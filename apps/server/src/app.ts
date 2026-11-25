import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Server } from 'socket.io';
import {
  hasPermission,
  type ServerReadyPayload,
  type SessionInfo,
} from '../../../packages/contracts/src/index.js';
import { createDatabase } from './db/client.js';
import { createAuthService } from './modules/auth/auth-service.js';
import { registerAuthPlugin } from './modules/auth/auth-plugin.js';

export interface BuildAppOptions {
  logger?: boolean;
  webRoot?: string;
  databaseUrl?: string;
  authSecret?: string;
  authBaseUrl?: string;
}

export async function buildApp({
  logger = true,
  webRoot = resolve('dist/web'),
  databaseUrl = process.env.DATABASE_URL,
  authSecret = process.env.BETTER_AUTH_SECRET,
  authBaseUrl = process.env.BETTER_AUTH_URL,
}: BuildAppOptions = {}) {
  const app = Fastify({
    logger: logger
      ? {
          level: process.env.LOG_LEVEL ?? 'info',
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        }
      : false,
  });

  const database = databaseUrl ? createDatabase(databaseUrl) : null;
  const authService = createAuthService({
    db: database?.db,
    secret: authSecret,
    baseURL: authBaseUrl,
  });

  if (authService.usesEphemeralSecret && logger) {
    app.log.warn(
      'BETTER_AUTH_SECRET is not set (or shorter than 32 chars): using an ephemeral in-memory secret.',
    );
  }
  if (!database && logger) {
    app.log.warn(
      'DATABASE_URL is not set: running auth store in memory (configure PostgreSQL for persistent storage).',
    );
  }

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    if (!database) {
      return { status: 'ok', database: 'memory' };
    }
    try {
      await database.checkReady();
      return { status: 'ok', database: 'ready' };
    } catch {
      return reply.code(503).send({ status: 'degraded', database: 'unavailable' });
    }
  });

  app.get('/api/v1/info', async () => ({
    name: 'Cuelia',
    stage: 'auth',
    releaseTag: process.env.CUELIA_RELEASE ?? 'development',
    deploymentId: process.env.CUELIA_DEPLOYMENT ?? 'local',
  }));

  await registerAuthPlugin(app, authService);

  const io = new Server(app.server, {
    transports: ['websocket'],
    serveClient: false,
  });

  io.use(async (socket, next) => {
    const handshakeHeaders = new Headers();
    const rawCookie = socket.handshake.headers.cookie;
    if (typeof rawCookie === 'string' && rawCookie.length > 0) {
      handshakeHeaders.set('cookie', rawCookie);
    }
    const authToken =
      typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;
    if (authToken) {
      handshakeHeaders.set('authorization', `Bearer ${authToken}`);
    }

    const session = await authService.getSessionFromHeaders(handshakeHeaders);
    const clientType =
      socket.handshake.auth?.clientType === 'director' ? 'director' : 'display';

    if (clientType === 'director' && !session) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    socket.data.session = session;
    socket.data.clientType = clientType;
    next();
  });

  io.on('connection', (socket) => {
    const session = (socket.data.session ?? null) as SessionInfo | null;
    const role = session?.user.role ?? 'viewer';
    const readyPayload: ServerReadyPayload = {
      protocolVersion: 1,
      authenticated: Boolean(session),
      role,
    };

    if (session && hasPermission(role, 'live:control')) {
      void socket.join('directors');
    } else {
      void socket.join('displays');
    }

    socket.emit('server:ready', readyPayload);

    socket.on(
      'live:command',
      (
        _payload: unknown,
        ack?: (response: { ok: boolean; error?: string; role?: string }) => void,
      ) => {
        if (!session) {
          ack?.({ ok: false, error: 'UNAUTHORIZED' });
          return;
        }
        if (!hasPermission(session.user.role, 'live:control')) {
          ack?.({ ok: false, error: 'FORBIDDEN' });
          return;
        }
        // Live state commands will be implemented in RF-04/RF-10 after library and schedules.
        ack?.({ ok: false, error: 'LIVE_NOT_IMPLEMENTED', role: session.user.role });
      },
    );
  });

  app.addHook('onClose', async () => {
    await new Promise<void>((done) => io.close(() => done()));
    if (database) {
      await database.close();
    }
  });

  if (existsSync(webRoot)) {
    await app.register(fastifyStatic, { root: webRoot });
    app.setNotFoundHandler((request, reply) => {
      if (
        request.method === 'GET' &&
        !request.url.startsWith('/api/') &&
        !request.url.startsWith('/health/') &&
        !request.url.startsWith('/socket.io') &&
        !request.url.includes('.')
      ) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }

  return app;
}
