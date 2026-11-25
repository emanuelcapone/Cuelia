import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  getRolePermissions,
  hasPermission,
  isLocale,
  isUserRole,
  type Permission,
  type SessionInfo,
} from '../../../../../packages/contracts/src/index.js';
import type { AuthService } from './auth-service.js';

declare module 'fastify' {
  interface FastifyRequest {
    cueliaSession?: SessionInfo | null;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildHeadersFromRequest(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, String(value));
    }
  }
  return headers;
}

function resolveRequestOrigin(request: FastifyRequest): string {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const proto =
    typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto.split(',')[0]!.trim()
      : request.protocol || 'http';
  const forwardedHost = request.headers['x-forwarded-host'];
  const host =
    typeof forwardedHost === 'string' && forwardedHost.length > 0
      ? forwardedHost.split(',')[0]!.trim()
      : request.headers.host || '127.0.0.1:3000';
  return `${proto}://${host}`;
}

function isTrustedCookieMutation(request: FastifyRequest): boolean {
  if (request.headers.authorization?.startsWith('Bearer ')) {
    return true;
  }
  if (!request.headers.cookie) {
    return true;
  }
  const requestedWith = request.headers['x-requested-with'];
  if (requestedWith === 'cuelia') {
    return true;
  }
  const origin = request.headers.origin;
  if (typeof origin === 'string' && origin.length > 0) {
    try {
      const originHost = new URL(origin).host;
      const expectedHost =
        typeof request.headers['x-forwarded-host'] === 'string'
          ? request.headers['x-forwarded-host'].split(',')[0]!.trim()
          : request.headers.host;
      if (expectedHost && originHost === expectedHost) return true;
      if (originHost === 'localhost:5173' || originHost === '127.0.0.1:5173') return true;
    } catch {
      return false;
    }
  }
  return false;
}

function parseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return null;
  return trimmed;
}

function parseEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 254 || !EMAIL_PATTERN.test(normalized)) return null;
  return normalized;
}

function parsePassword(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  if (value.length < 8 || value.length > 128) return null;
  return value;
}

export function createAuthGuards(authService: AuthService) {
  async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      if (!isTrustedCookieMutation(request)) {
        return reply.code(403).send({ error: 'FORBIDDEN_ORIGIN' });
      }
    }
    const session = await authService.getSessionFromHeaders(buildHeadersFromRequest(request));
    if (!session) {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }
    request.cueliaSession = session;
  }

  function requirePermission(permission: Permission) {
    return async function permissionPreHandler(request: FastifyRequest, reply: FastifyReply) {
      await requireAuth(request, reply);
      if (reply.sent) return;
      const session = request.cueliaSession;
      if (!session || !hasPermission(session.user.role, permission)) {
        return reply.code(403).send({ error: 'FORBIDDEN' });
      }
    };
  }

  return { requireAuth, requirePermission };
}

export async function registerAuthPlugin(app: FastifyInstance, authService: AuthService) {
  const { requireAuth, requirePermission } = createAuthGuards(authService);

  // Mount Better Auth handler while closing public self-registration endpoints.
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const pathOnly = request.url.split('?')[0] ?? '';
      if (pathOnly.startsWith('/api/auth/sign-up')) {
        return reply.code(403).send({
          error: 'SIGNUP_DISABLED',
          message: 'Account creation is restricted to initial setup and administrators.',
        });
      }

      const url = new URL(request.url, resolveRequestOrigin(request));
      const headers = buildHeadersFromRequest(request);
      headers.delete('content-length');

      const hasBody =
        request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined;
      let serializedBody: string | undefined;
      if (hasBody) {
        serializedBody =
          typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json');
        }
      }

      const webRequest = new Request(url.toString(), {
        method: request.method,
        headers,
        body: serializedBody,
      });

      const webResponse = await authService.auth.handler(webRequest);

      reply.status(webResponse.status);
      const setCookies =
        typeof webResponse.headers.getSetCookie === 'function'
          ? webResponse.headers.getSetCookie()
          : [];
      for (const cookie of setCookies) {
        reply.header('set-cookie', cookie);
      }
      webResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        reply.header(key, value);
      });

      const text = await webResponse.text();
      return reply.send(text);
    },
  });

  app.get('/api/v1/auth/bootstrap-status', async () => {
    const userCount = await authService.userRepo.countUsers();
    return {
      needsBootstrap: userCount === 0,
      databaseMode: authService.databaseMode,
    };
  });

  app.post('/api/v1/auth/bootstrap', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const name = parseName(body.name);
    const email = parseEmail(body.email);
    const password = parsePassword(body.password);
    const locale = isLocale(body.locale) ? body.locale : 'it';

    if (!name || !email || !password) {
      return reply.code(400).send({
        error: 'INVALID_INPUT',
        message: 'Name (2-80 chars), valid email, and password (8-128 chars) are required.',
      });
    }

    const result = await authService.bootstrapFirstAdmin({ name, email, password, locale });
    if (!result.ok) {
      return reply.code(result.status).send({ error: result.code, message: result.message });
    }

    for (const cookie of result.setCookies) {
      reply.header('set-cookie', cookie);
    }
    if (result.token) {
      reply.header('set-auth-token', result.token);
    }

    return reply.code(201).send({
      user: result.session.user,
      permissions: result.session.permissions,
      token: result.token,
    });
  });

  app.get('/api/v1/me', { preHandler: [requireAuth] }, async (request) => {
    return request.cueliaSession!;
  });

  app.patch('/api/v1/me/preferences', { preHandler: [requireAuth] }, async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    if (!isLocale(body.locale)) {
      return reply.code(400).send({ error: 'INVALID_LOCALE' });
    }
    const updated = await authService.userRepo.updateLocale(
      request.cueliaSession!.user.id,
      body.locale,
    );
    if (!updated) {
      return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    }
    return {
      user: updated,
      permissions: getRolePermissions(updated.role),
    };
  });

  app.get(
    '/api/v1/users',
    { preHandler: [requirePermission('users:manage')] },
    async () => {
      const users = await authService.userRepo.listUsers();
      return { users };
    },
  );

  app.post(
    '/api/v1/users',
    { preHandler: [requirePermission('users:manage')] },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const name = parseName(body.name);
      const email = parseEmail(body.email);
      const password = parsePassword(body.password);
      const role = isUserRole(body.role) ? body.role : null;
      const locale = isLocale(body.locale) ? body.locale : 'it';

      if (!name || !email || !password || !role) {
        return reply.code(400).send({
          error: 'INVALID_INPUT',
          message: 'Name, valid email, password (8+ chars), and valid role are required.',
        });
      }

      const result = await authService.createUserWithRole({ name, email, password, role, locale });
      if (!result.ok) {
        return reply.code(result.status).send({ error: result.code, message: result.message });
      }
      return reply.code(201).send({ user: result.user });
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/v1/users/:id/role',
    { preHandler: [requirePermission('users:manage')] },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      if (!isUserRole(body.role)) {
        return reply.code(400).send({ error: 'INVALID_ROLE' });
      }

      const target = await authService.userRepo.findById(request.params.id);
      if (!target) {
        return reply.code(404).send({ error: 'USER_NOT_FOUND' });
      }

      if (target.role === 'admin' && body.role !== 'admin') {
        const adminCount = await authService.userRepo.countAdmins();
        if (adminCount <= 1) {
          return reply.code(400).send({ error: 'LAST_ADMIN_PROTECTED' });
        }
      }

      const updated = await authService.userRepo.updateRole(target.id, body.role);
      return { user: updated };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/v1/users/:id',
    { preHandler: [requirePermission('users:manage')] },
    async (request, reply) => {
      const actorId = request.cueliaSession!.user.id;
      const targetId = request.params.id;
      if (actorId === targetId) {
        return reply.code(400).send({ error: 'CANNOT_DELETE_SELF' });
      }

      const target = await authService.userRepo.findById(targetId);
      if (!target) {
        return reply.code(404).send({ error: 'USER_NOT_FOUND' });
      }

      if (target.role === 'admin') {
        const adminCount = await authService.userRepo.countAdmins();
        if (adminCount <= 1) {
          return reply.code(400).send({ error: 'LAST_ADMIN_PROTECTED' });
        }
      }

      await authService.userRepo.deleteUser(targetId);
      return reply.code(204).send();
    },
  );
}
