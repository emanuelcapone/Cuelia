// Komodo Action: Cuelia release deploy. Only this fixed stack may be changed.
/* global ARGS, komodo, fetch, AbortSignal, console */
const body = ARGS.WEBHOOK_BODY;
if (body?.repository?.full_name !== "ChiesaSiloe/Cuelia") throw new Error("Unexpected repository");
const tag = (body.ref ?? "").replace(/^refs\/tags\//, "");
if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) throw new Error("Invalid release tag");
if (body.image !== `ghcr.io/chiesasiloe/cuelia:${tag}`) throw new Error("Unexpected image");
if (!/^\d+-\d+$/.test(body.deploymentId ?? "")) throw new Error("Invalid deployment ID");
const stackId = "6b0570917a62df59034fff8d";
const stack = await komodo.read("GetStack", { stack: stackId });
const previous = stack.config?.environment ?? "";
if (!/^CUELIA_TAG=.+$/m.test(previous)) throw new Error("Missing CUELIA_TAG");
let environment = previous.replace(/^CUELIA_TAG=.*$/m, `CUELIA_TAG=${tag}`);
environment = environment.replace(/^CUELIA_DEPLOYMENT=.*\n?/m, "");
environment = environment.trimEnd() + `\nCUELIA_DEPLOYMENT=${body.deploymentId}\n`;
await komodo.write("UpdateStack", { id: stackId, config: { environment } });
console.log(`Deploying Cuelia ${tag} on Asus`);
const update = await komodo.execute_and_poll("DeployStack", { stack: stackId });
if (!update.success) {
  await komodo.write("UpdateStack", { id: stackId, config: { environment: previous } });
  const rollback = await komodo.execute_and_poll("DeployStack", { stack: stackId });
  throw new Error(`Deploy failed. Previous configuration restored; rollback success: ${rollback.success}`);
}
const response = await fetch("https://cuelia.chiesasiloe.it/health/live", { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Public health check failed: ${response.status}`);
console.log(`Cuelia ${tag} deployed and reachable through Cloudflare`);

