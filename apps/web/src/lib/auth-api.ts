import type {
  AuthUser,
  Locale,
  SessionInfo,
  UserRole,
} from '../../../../packages/contracts/src/index';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

// Held strictly in JS memory (never persisted to localStorage or sessionStorage).
let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function clearAuthToken() {
  inMemoryToken = null;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; response: Response }> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'cuelia');
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  const nextToken = response.headers.get('set-auth-token');
  if (nextToken) {
    inMemoryToken = nextToken;
  }

  if (response.status === 204) {
    return { data: undefined as T, response };
  }

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const code =
      typeof payload?.error === 'string'
        ? payload.error
        : typeof payload?.code === 'string'
          ? payload.code
          : 'REQUEST_FAILED';
    const message = typeof payload?.message === 'string' ? payload.message : undefined;
    throw new ApiError(response.status, code, message);
  }

  return { data: payload as T, response };
}

export async function fetchBootstrapStatus(): Promise<{
  needsBootstrap: boolean;
  databaseMode: 'postgres' | 'memory';
}> {
  const { data } = await apiFetch<{
    needsBootstrap: boolean;
    databaseMode: 'postgres' | 'memory';
  }>('/api/v1/auth/bootstrap-status');
  return data;
}

export async function fetchCurrentSession(): Promise<SessionInfo | null> {
  try {
    const { data } = await apiFetch<SessionInfo>('/api/v1/me');
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function bootstrapAdmin(input: {
  name: string;
  email: string;
  password: string;
  locale: Locale;
}): Promise<SessionInfo> {
  const { data } = await apiFetch<SessionInfo & { token?: string | null }>(
    '/api/v1/auth/bootstrap',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  if (data.token) {
    inMemoryToken = data.token;
  }
  return { user: data.user, permissions: data.permissions };
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
}): Promise<SessionInfo> {
  const { data } = await apiFetch<{ token?: string }>('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (data?.token) {
    inMemoryToken = data.token;
  }
  const session = await fetchCurrentSession();
  if (!session) {
    throw new ApiError(401, 'UNAUTHORIZED');
  }
  return session;
}

export async function signOut(): Promise<void> {
  try {
    await apiFetch('/api/auth/sign-out', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  } finally {
    inMemoryToken = null;
  }
}

export async function updateMyLocale(locale: Locale): Promise<SessionInfo> {
  const { data } = await apiFetch<SessionInfo>('/api/v1/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ locale }),
  });
  return data;
}

export async function listUsers(): Promise<AuthUser[]> {
  const { data } = await apiFetch<{ users: AuthUser[] }>('/api/v1/users');
  return data.users;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  locale: Locale;
}): Promise<AuthUser> {
  const { data } = await apiFetch<{ user: AuthUser }>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<AuthUser> {
  const { data } = await apiFetch<{ user: AuthUser }>(
    `/api/v1/users/${encodeURIComponent(userId)}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );
  return data.user;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch(`/api/v1/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
