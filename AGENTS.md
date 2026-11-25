# Cuelia — Istruzioni per gli agenti

## Prodotto e perimetro
Leggere [la visione prodotto](docs/visione-prodotto.md) prima di intervenire. Rispettare le priorità MVP e aggiornare la documentazione quando cambia il comportamento previsto.

## Stack tecnologico
- **Linguaggio:** TypeScript end-to-end.
- **Frontend:** React + Vite, SPA responsive.
- **UI:** Tailwind CSS + shadcn/ui, con dark mode.
- **Backend:** Node.js + Fastify, API REST e canale realtime Socket.IO.
- **Database:** PostgreSQL per canti, scalette, configurazioni e utenti.
- **ORM:** Drizzle ORM per schema e migrazioni.
- **Realtime:** Socket.IO su WebSocket per sincronizzare regia e display.
- **Rendering:** HTML5, CSS3 e Canvas API.
- **Media storage:** filesystem locale, con astrazione per storage S3-compatible.
- **Autenticazione:** Better Auth, con ruoli e permessi.
- **Multi-monitor:** Window Management API ove supportata, fullscreen e finestre browser indipendenti.
- **Automazione AI:** modulo separato con interfaccia indipendente dal provider STT (Gemini Live, Whisper o modelli locali).
- **Streaming:** OBS Browser Source tramite URL dedicati.
- **Testing:** Vitest per unit/integration test; Playwright per E2E.
- **Observability:** Pino per logging strutturato e health checks.
- **Deployment:** Docker Compose, self-hosted e local-first.
- **CI/CD:** GitHub Actions per test, build e pubblicazione delle immagini Docker.
- **Architettura:** monolite modulare, API-first, senza microservizi nell'MVP.

## Principi di implementazione
- Separare logicamente frontend, backend e renderer delle uscite, mantenendoli distribuibili come un'unica applicazione.
- Garantire regia manuale offline in LAN, senza dipendenze cloud obbligatorie, con più display e un singolo host.
- Conservare l'ultima slide sui display disconnessi e risincronizzare lo stato alla riconnessione.
- Mantenere Preview e Live indipendenti; l'automazione AI non deve bloccare il controllo manuale.
- Prevedere un'alternativa manuale per i browser privi della Window Management API.
- Progettare l'interfaccia multilingua fin dall'MVP: stringhe in risorse di traduzione locali, fallback esplicito e lingua dell'interfaccia separata da quella dei contenuti.
- Validare gli input e autorizzare i comandi sia REST sia realtime; non inserire segreti nel codice o nei log.
- Eseguire i controlli pertinenti alle modifiche e documentarne l'esito; non dichiarare eseguiti test non disponibili.

## Flusso di sviluppo
1. Leggere questa guida, la visione prodotto e [la guida operativa](docs/sviluppo.md). Verificare lo stato del repository prima di modificare file.
2. Partire da `main` aggiornato e lavorare su `feature/<nome>`; usare `fix/<nome>` o `chore/<nome>` per correzioni e manutenzione. Integrare tramite PR verso `main`.
3. Limitare ogni PR a un risultato verificabile. Aggiungere traduzioni italiano/inglese, migrazioni e documentazione quando pertinenti; mantenere il lockfile aggiornato se cambiano le dipendenze.
4. Eseguire i controlli pertinenti prima del push; per modifiche applicative usare i comandi sotto. Per sole modifiche documentali verificare link, percorsi e coerenza con script e workflow.
5. Nella PR descrivere comportamento, requisito RF/RNF pertinente, verifiche e impatti operativi. Correggere i fallimenti della CI prima dell'integrazione.
6. Dopo il merge verificare la CI di `main`. Un merge non pubblica immagini e non avvia deploy.

Prerequisiti: Node.js 24 e npm. `npm ci` installa le versioni del lockfile; `npm run dev` avvia web e server. Per PostgreSQL locale seguire docs/sviluppo.md.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

La build precede gli E2E perché Playwright avvia il server di produzione con `npm start`.
La CI (`.github/workflows/ci.yml`) parte su push a `main`, `feature/**`, `fix/**`, `chore/**` e su PR verso `main`; esegue anche build e smoke test Docker senza push al registry.
I check sono `Quality checks` e `Container smoke test`. Le protezioni di branch sono configurazioni GitHub: non presumere che siano attive.

## Flusso di rilascio
1. Scegliere una versione non ancora usata nel formato `vMAJOR.MINOR.PATCH` oppure `vMAJOR.MINOR.PATCH-rc.N`.
2. Integrare le modifiche in `main`, verificare la CI e creare il tag sul commit da rilasciare. Controllare i tag remoti prima di procedere.
3. Fare push del tag: `.github/workflows/release.yml` verifica formato e appartenenza del commit alla storia di `main`, ripete la CI e pubblica solo se tutti i controlli passano.
4. Verificare che `Publish container` completi anche il job `Deploy Cuelia on Asus`: dopo il push GHCR, il webhook dedicato attiva Komodo e il job attende tag e deploymentId del proprio run su /api/v1/info e il controllo /health/live. Riportare versione, link al run ed esito.
5. Se fallisce, leggere i log e correggere su un nuovo branch. Non spostare o sovrascrivere tag di release già pubblicati; usare una nuova versione quando cambia il codice.

```sh
git switch main
git pull --ff-only
git fetch --tags
# Esempio: usare v0.1.1 solo se non è già presente.
git tag v0.1.1
git push origin v0.1.1
```

La versione dell'immagine deriva dal tag Git, non dal campo version di package.json.
Il workflow usa `GITHUB_TOKEN` con `packages: write`; non aggiungere PAT o credenziali al repository.
Non viene pubblicato il tag Docker `latest`; il deploy usa una versione esplicita e viene eseguito dal job successivo alla pubblicazione. La creazione di una GitHub Release è facoltativa: per la pipeline basta il push del tag.

## Deploy su Asus
Seguire [la guida Komodo](docs/deploy-komodo.md). Il webhook cuelia-release-deploy può aggiornare solo lo stack Cuelia; mantenere le credenziali amministrative fuori da GitHub e dal codice. Conservare variabili private e volumi. Il tunnel esistente inoltra cuelia.chiesasiloe.it a 127.0.0.1:8005. Mantenere allineati deploy/compose.komodo.yaml e deploy/komodo-action.js con le copie operative in Komodo.
