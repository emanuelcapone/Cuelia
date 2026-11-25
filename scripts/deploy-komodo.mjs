/* global fetch, AbortSignal */
import process from 'node:process';
import console from 'node:console';
import { setTimeout } from 'node:timers';
import { createHmac } from 'node:crypto';

const tag = process.env.RELEASE_TAG;
const deploymentId = process.env.DEPLOYMENT_ID;
const secret = process.env.KOMODO_CUELIA_WEBHOOK_SECRET;
if (!tag || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) throw new Error('Invalid release tag');
if (!deploymentId || !/^\d+-\d+$/.test(deploymentId)) throw new Error('Invalid deployment ID');
if (!secret) throw new Error('KOMODO_CUELIA_WEBHOOK_SECRET is required');

const body = JSON.stringify({
  ref: `refs/tags/${tag}`,
  repository: { full_name: 'ChiesaSiloe/Cuelia' },
  image: `ghcr.io/chiesasiloe/cuelia:${tag}`,
  deploymentId,
});
const signature = createHmac('sha256', secret).update(body).digest('hex');
const response = await fetch('https://komodo.nickmalik.dev/listener/github/action/cuelia-release-deploy/__ANY__', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${signature}` },
  body,
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Komodo rejected deploy: HTTP ${response.status}`);
console.log(`Deploy accepted for ${tag}. Waiting for deployment ${deploymentId}...`);
// Komodo accepts webhooks asynchronously. HTTP 200 is not proof of a successful deploy.
const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  try {
    const info = await fetch('https://cuelia.chiesasiloe.it/api/v1/info', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (info.ok) {
      const data = await info.json();
      if (data.releaseTag === tag && data.deploymentId === deploymentId) {
        const health = await fetch('https://cuelia.chiesasiloe.it/health/live', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (health.ok) {
          console.log(`Cuelia ${tag} (${deploymentId}) is healthy at https://cuelia.chiesasiloe.it`);
          process.exit(0);
        }
      }
    }
  } catch { /* Tunnel reconnects and container replacement can briefly interrupt requests. */ }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
throw new Error(`Deploy ${deploymentId} did not become healthy within 10 minutes; inspect cuelia-release-deploy in Komodo`);
