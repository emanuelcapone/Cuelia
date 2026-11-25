import { afterEach, expect, it, vi } from 'vitest';
import { buildApp } from './app.js';
const apps: Awaited<ReturnType<typeof buildApp>>[] = [];
afterEach(async () => { vi.unstubAllEnvs(); await Promise.all(apps.splice(0).map((app) => app.close())); });
it('exposes liveness and keeps unknown API routes as 404', async () => {
  const app = await buildApp({ logger: false }); apps.push(app);
  expect((await app.inject('/health/live')).json()).toEqual({ status: 'ok' });
  expect((await app.inject('/api/v1/missing')).statusCode).toBe(404);
});

it('reports the release and deployment identity supplied by the runtime', async () => {
  vi.stubEnv('CUELIA_RELEASE', 'v0.1.1');
  vi.stubEnv('CUELIA_DEPLOYMENT', '12345-1');
  const app = await buildApp({ logger: false }); apps.push(app);
  expect((await app.inject('/api/v1/info')).json()).toMatchObject({ releaseTag: 'v0.1.1', deploymentId: '12345-1' });
});
