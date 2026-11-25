import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Server } from 'socket.io';

export async function buildApp({ logger = true, webRoot = resolve('dist/web') } = {}) {
  const app = Fastify({ logger: logger ? { level: process.env.LOG_LEVEL ?? 'info', redact: ['req.headers.authorization', 'req.headers.cookie'] } : false });
  app.get('/health/live', async () => ({ status: 'ok' }));
  // Liveness only: database readiness will be added with the first persistent module.
  app.get('/api/v1/info', async () => ({ name: 'Cuelia', stage: 'scaffold', releaseTag: process.env.CUELIA_RELEASE ?? 'development', deploymentId: process.env.CUELIA_DEPLOYMENT ?? 'local' }));
  const io = new Server(app.server, { transports: ['websocket'], serveClient: false });
  // No live-state commands until authentication and authorization are implemented.
  io.on('connection', (socket) => socket.emit('server:ready', { protocolVersion: 1 }));
  app.addHook('onClose', async () => { await new Promise<void>((done) => io.close(() => done())); });
  if (existsSync(webRoot)) {
    await app.register(fastifyStatic, { root: webRoot });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/') && !request.url.startsWith('/health/') && !request.url.startsWith('/socket.io') && !request.url.includes('.')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }
  return app;
}
