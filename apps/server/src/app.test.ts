import { afterEach, describe, expect, it, vi } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import { buildApp } from './app.js';

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
const sockets: Socket[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  for (const socket of sockets.splice(0)) {
    socket.disconnect();
  }
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

async function createTestApp() {
  const app = await buildApp({
    logger: false,
    databaseUrl: '',
    authSecret: 'test-secret-with-at-least-32-characters-0001',
  });
  apps.push(app);
  return app;
}

describe('Cuelia server scaffold & info', () => {
  it('exposes liveness, readiness and keeps unknown API routes as 404', async () => {
    const app = await createTestApp();
    expect((await app.inject('/health/live')).json()).toEqual({ status: 'ok' });
    expect((await app.inject('/health/ready')).json()).toEqual({
      status: 'ok',
      database: 'memory',
    });
    expect((await app.inject('/api/v1/missing')).statusCode).toBe(404);
  });

  it('reports the release and deployment identity supplied by the runtime', async () => {
    vi.stubEnv('CUELIA_RELEASE', 'v0.1.1');
    vi.stubEnv('CUELIA_DEPLOYMENT', '12345-1');
    const app = await createTestApp();
    expect((await app.inject('/api/v1/info')).json()).toMatchObject({
      name: 'Cuelia',
      stage: 'auth',
      releaseTag: 'v0.1.1',
      deploymentId: '12345-1',
    });
  });
});

describe('Authentication, roles and RBAC', () => {
  it('blocks unauthenticated access to protected routes and disables public sign-up', async () => {
    const app = await createTestApp();

    expect((await app.inject('/api/v1/me')).statusCode).toBe(401);
    expect((await app.inject('/api/v1/users')).statusCode).toBe(401);

    const signupRes = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Intruder', email: 'intruder@example.com', password: 'password123' },
    });
    expect(signupRes.statusCode).toBe(403);
    expect(signupRes.json()).toMatchObject({ error: 'SIGNUP_DISABLED' });
  });

  it('bootstraps the first admin once, enforces RBAC and protects the last admin', async () => {
    const app = await createTestApp();

    const statusBefore = await app.inject('/api/v1/auth/bootstrap-status');
    expect(statusBefore.json()).toMatchObject({ needsBootstrap: true });

    const bootstrapRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/bootstrap',
      payload: {
        name: 'Admin Principale',
        email: 'admin@cuelia.local',
        password: 'password-sicura-123',
        locale: 'it',
      },
    });
    expect(bootstrapRes.statusCode).toBe(201);
    const bootstrapBody = bootstrapRes.json() as {
      user: { id: string; role: string; locale: string };
      permissions: string[];
      token: string;
    };
    expect(bootstrapBody.user.role).toBe('admin');
    expect(bootstrapBody.permissions).toContain('users:manage');
    expect(bootstrapBody.token).toBeTruthy();

    // Second bootstrap attempt is permanently locked.
    const secondBootstrap = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/bootstrap',
      payload: {
        name: 'Secondo Admin',
        email: 'second@cuelia.local',
        password: 'password-sicura-123',
      },
    });
    expect(secondBootstrap.statusCode).toBe(409);

    const adminHeaders = { authorization: `Bearer ${bootstrapBody.token}` };

    // Last admin cannot demote themselves or delete themselves.
    const demoteSelf = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${bootstrapBody.user.id}/role`,
      headers: adminHeaders,
      payload: { role: 'operator' },
    });
    expect(demoteSelf.statusCode).toBe(400);
    expect(demoteSelf.json()).toEqual({ error: 'LAST_ADMIN_PROTECTED' });

    const deleteSelf = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${bootstrapBody.user.id}`,
      headers: adminHeaders,
    });
    expect(deleteSelf.statusCode).toBe(400);

    // Admin updates their own language preference.
    const prefRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me/preferences',
      headers: adminHeaders,
      payload: { locale: 'en' },
    });
    expect(prefRes.statusCode).toBe(200);
    expect(prefRes.json().user.locale).toBe('en');

    // Admin creates an operator user.
    const createOp = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: adminHeaders,
      payload: {
        name: 'Operatore Regia',
        email: 'operator@cuelia.local',
        password: 'password-operatore',
        role: 'operator',
        locale: 'it',
      },
    });
    expect(createOp.statusCode).toBe(201);
    const createdOp = createOp.json().user as { id: string; role: string };
    expect(createdOp.role).toBe('operator');

    // Operator signs in via Better Auth and receives a bearer token.
    const signInRes = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'operator@cuelia.local', password: 'password-operatore' },
    });
    expect(signInRes.statusCode).toBe(200);
    const opToken = String(signInRes.headers['set-auth-token'] ?? signInRes.json().token);
    expect(opToken).toBeTruthy();

    // Operator can read /api/v1/me but is forbidden from managing users.
    const opMe = await app.inject({
      url: '/api/v1/me',
      headers: { authorization: `Bearer ${opToken}` },
    });
    expect(opMe.statusCode).toBe(200);
    expect(opMe.json().user.role).toBe('operator');

    const opUsers = await app.inject({
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${opToken}` },
    });
    expect(opUsers.statusCode).toBe(403);
  });

  it('enforces Socket.IO authentication for directors and role checks on live commands', async () => {
    const app = await createTestApp();
    const address = await app.listen({ host: '127.0.0.1', port: 0 });

    // Bootstrap admin and create a viewer account.
    const adminRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/bootstrap',
      payload: {
        name: 'Admin',
        email: 'admin@cuelia.local',
        password: 'password-sicura-123',
      },
    });
    const adminToken = adminRes.json().token as string;

    await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        name: 'Viewer',
        email: 'viewer@cuelia.local',
        password: 'password-viewer-123',
        role: 'viewer',
      },
    });
    const viewerSignIn = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'viewer@cuelia.local', password: 'password-viewer-123' },
    });
    const viewerToken = String(
      viewerSignIn.headers['set-auth-token'] ?? viewerSignIn.json().token,
    );

    // 1. Unauthenticated director socket is rejected at handshake.
    const unauthError = await new Promise<Error>((resolveError) => {
      const socket = createClient(address, {
        transports: ['websocket'],
        auth: { clientType: 'director' },
        reconnection: false,
      });
      sockets.push(socket);
      socket.on('connect_error', resolveError);
    });
    expect(unauthError.message).toBe('UNAUTHORIZED');

    // 2. Unauthenticated display socket connects as viewer, cannot issue live commands.
    const displaySocket = createClient(address, {
      transports: ['websocket'],
      auth: { clientType: 'display' },
      reconnection: false,
    });
    sockets.push(displaySocket);
    const displayReady = await new Promise<{ authenticated: boolean; role: string }>((res) => {
      displaySocket.once('server:ready', res);
    });
    expect(displayReady).toMatchObject({ authenticated: false, role: 'viewer' });

    const displayCmdAck = await new Promise<{ ok: boolean; error?: string }>((res) => {
      displaySocket.emit('live:command', { action: 'next' }, res);
    });
    expect(displayCmdAck).toEqual({ ok: false, error: 'UNAUTHORIZED' });

    // 3. Authenticated viewer cannot issue live:control commands.
    const viewerSocket = createClient(address, {
      transports: ['websocket'],
      auth: { clientType: 'director', token: viewerToken },
      reconnection: false,
    });
    sockets.push(viewerSocket);
    const viewerReady = await new Promise<{ authenticated: boolean; role: string }>((res) => {
      viewerSocket.once('server:ready', res);
    });
    expect(viewerReady).toMatchObject({ authenticated: true, role: 'viewer' });

    const viewerCmdAck = await new Promise<{ ok: boolean; error?: string }>((res) => {
      viewerSocket.emit('live:command', { action: 'next' }, res);
    });
    expect(viewerCmdAck).toEqual({ ok: false, error: 'FORBIDDEN' });

    // 4. Authenticated admin passes live:control authorization guard.
    const adminSocket = createClient(address, {
      transports: ['websocket'],
      auth: { clientType: 'director', token: adminToken },
      reconnection: false,
    });
    sockets.push(adminSocket);
    const adminReady = await new Promise<{ authenticated: boolean; role: string }>((res) => {
      adminSocket.once('server:ready', res);
    });
    expect(adminReady).toMatchObject({ authenticated: true, role: 'admin' });

    const adminCmdAck = await new Promise<{ ok: boolean; error?: string; role?: string }>((res) => {
      adminSocket.emit('live:command', { action: 'next' }, res);
    });
    expect(adminCmdAck).toEqual({ ok: false, error: 'LIVE_NOT_IMPLEMENTED', role: 'admin' });
  });
});
