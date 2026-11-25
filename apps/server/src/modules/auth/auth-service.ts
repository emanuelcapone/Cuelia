import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { bearer } from 'better-auth/plugins';
import {
  getRolePermissions,
  isLocale,
  isUserRole,
  type AuthUser,
  type Locale,
  type SessionInfo,
  type UserRole,
} from '../../../../../packages/contracts/src/index.js';
import type { CueliaDatabase } from '../../db/client.js';
import { authSchema } from '../../db/schema.js';
import {
  DrizzleUserRepository,
  MemoryUserRepository,
  type MemoryAuthTables,
  type UserRepository,
} from './user-repository.js';

export interface CreateAuthServiceOptions {
  db?: CueliaDatabase;
  secret?: string;
  baseURL?: string;
}

export interface AuthService {
  auth: ReturnType<typeof createBetterAuthInstance>;
  userRepo: UserRepository;
  databaseMode: 'postgres' | 'memory';
  usesEphemeralSecret: boolean;
  getSessionFromHeaders(headers: Headers): Promise<SessionInfo | null>;
  bootstrapFirstAdmin(input: {
    name: string;
    email: string;
    password: string;
    locale: Locale;
  }): Promise<
    | { ok: true; session: SessionInfo; token: string | null; setCookies: string[] }
    | { ok: false; code: 'ALREADY_INITIALIZED' | 'SIGNUP_FAILED'; status: number; message: string }
  >;
  createUserWithRole(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    locale: Locale;
  }): Promise<
    | { ok: true; user: AuthUser }
    | { ok: false; code: 'EMAIL_EXISTS' | 'CREATE_FAILED'; status: number; message: string }
  >;
}

function createBetterAuthInstance(options: {
  database: ReturnType<typeof drizzleAdapter> | ReturnType<typeof memoryAdapter>;
  secret: string;
  configuredBaseURL?: string;
}) {
  const staticOrigins = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ];
  if (options.configuredBaseURL) {
    try {
      staticOrigins.push(new URL(options.configuredBaseURL).origin);
    } catch {
      // Ignore malformed BETTER_AUTH_URL and rely on request origin matching.
    }
  }

  return betterAuth({
    secret: options.secret,
    baseURL: options.configuredBaseURL
      ? options.configuredBaseURL
      : { allowedHosts: ['*'], fallback: 'http://127.0.0.1:3000' },
    trustedOrigins: async (request) => {
      const origins = new Set(staticOrigins);
      if (request) {
        try {
          origins.add(new URL(request.url).origin);
        } catch {
          // Ignore malformed request URL.
        }
      }
      return [...origins];
    },
    database: options.database,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'viewer',
          input: false,
        },
        locale: {
          type: 'string',
          required: false,
          defaultValue: 'it',
          input: true,
        },
      },
    },
    plugins: [bearer()],
  });
}

function formatAuthUserFromSession(
  rawUser: Record<string, unknown>,
  persistedUser?: AuthUser | null,
): AuthUser {
  if (persistedUser) return persistedUser;
  const createdAt = rawUser.createdAt;
  return {
    id: String(rawUser.id),
    name: String(rawUser.name),
    email: String(rawUser.email),
    role: isUserRole(rawUser.role) ? rawUser.role : 'viewer',
    locale: isLocale(rawUser.locale) ? rawUser.locale : 'it',
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : typeof createdAt === 'string'
          ? createdAt
          : new Date().toISOString(),
  };
}

export function createAuthService(options: CreateAuthServiceOptions = {}): AuthService {
  const configuredSecret = options.secret?.trim() || process.env.BETTER_AUTH_SECRET?.trim();
  const usesEphemeralSecret = !configuredSecret || configuredSecret.length < 32;
  const secret = usesEphemeralSecret ? randomBytes(32).toString('hex') : configuredSecret;
  const configuredBaseURL = options.baseURL?.trim() || process.env.BETTER_AUTH_URL?.trim();

  let userRepo: UserRepository;
  let database: ReturnType<typeof drizzleAdapter> | ReturnType<typeof memoryAdapter>;
  let databaseMode: 'postgres' | 'memory';

  if (options.db) {
    databaseMode = 'postgres';
    userRepo = new DrizzleUserRepository(options.db);
    database = drizzleAdapter(options.db, {
      provider: 'pg',
      schema: authSchema,
    });
  } else {
    databaseMode = 'memory';
    const tables: MemoryAuthTables = {
      user: [],
      session: [],
      account: [],
      verification: [],
    };
    userRepo = new MemoryUserRepository(tables);
    database = memoryAdapter(tables);
  }

  const auth = createBetterAuthInstance({ database, secret, configuredBaseURL });
  let bootstrapLock = false;

  async function getSessionFromHeaders(headers: Headers): Promise<SessionInfo | null> {
    try {
      const result = await auth.api.getSession({ headers });
      if (!result?.user) return null;
      const persisted = await userRepo.findById(String(result.user.id));
      const user = formatAuthUserFromSession(result.user as unknown as Record<string, unknown>, persisted);
      return {
        user,
        permissions: getRolePermissions(user.role),
      };
    } catch {
      return null;
    }
  }

  async function bootstrapFirstAdmin(input: {
    name: string;
    email: string;
    password: string;
    locale: Locale;
  }) {
    if (bootstrapLock) {
      return {
        ok: false as const,
        code: 'ALREADY_INITIALIZED' as const,
        status: 409,
        message: 'Initial administrator setup is already in progress or completed.',
      };
    }

    bootstrapLock = true;
    try {
      const existingCount = await userRepo.countUsers();
      if (existingCount > 0) {
        return {
          ok: false as const,
          code: 'ALREADY_INITIALIZED' as const,
          status: 409,
          message: 'Initial administrator has already been configured.',
        };
      }

      const response = await auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          locale: input.locale,
        },
        asResponse: true,
      });

      const payload = (await response.json().catch(() => null)) as
        | { user?: { id?: string }; token?: string; message?: string }
        | null;

      if (!response.ok || !payload?.user?.id) {
        return {
          ok: false as const,
          code: 'SIGNUP_FAILED' as const,
          status: response.status >= 400 ? response.status : 400,
          message: payload?.message ?? 'Unable to create initial administrator.',
        };
      }

      const promoted = await userRepo.updateRole(payload.user.id, 'admin');
      if (!promoted) {
        return {
          ok: false as const,
          code: 'SIGNUP_FAILED' as const,
          status: 500,
          message: 'Failed to assign administrator role.',
        };
      }

      const token = response.headers.get('set-auth-token') ?? payload.token ?? null;
      const setCookies =
        typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];

      return {
        ok: true as const,
        session: {
          user: promoted,
          permissions: getRolePermissions('admin'),
        },
        token,
        setCookies,
      };
    } finally {
      bootstrapLock = false;
    }
  }

  async function createUserWithRole(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    locale: Locale;
  }) {
    const response = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        locale: input.locale,
      },
      asResponse: true,
    });

    const payload = (await response.json().catch(() => null)) as
      | { user?: { id?: string }; code?: string; message?: string }
      | null;

    if (!response.ok || !payload?.user?.id) {
      const isConflict =
        response.status === 422 ||
        response.status === 409 ||
        payload?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL';
      return {
        ok: false as const,
        code: isConflict ? ('EMAIL_EXISTS' as const) : ('CREATE_FAILED' as const),
        status: isConflict ? 409 : 400,
        message: payload?.message ?? 'Unable to create user.',
      };
    }

    const updated =
      input.role === 'viewer'
        ? await userRepo.findById(payload.user.id)
        : await userRepo.updateRole(payload.user.id, input.role);

    if (!updated) {
      return {
        ok: false as const,
        code: 'CREATE_FAILED' as const,
        status: 500,
        message: 'Failed to finalize user creation.',
      };
    }

    return { ok: true as const, user: updated };
  }

  return {
    auth,
    userRepo,
    databaseMode,
    usesEphemeralSecret,
    getSessionFromHeaders,
    bootstrapFirstAdmin,
    createUserWithRole,
  };
}
