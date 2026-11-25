# Cuelia

Regia multimediale web per culti ed eventi: canti, passi biblici e proiezioni su più display. Progettata per funzionare in LAN, anche senza Internet, con interfaccia multilingua.

**Stato:** scaffold iniziale. Sono disponibili avvio web/server, pagine regia e display, italiano/inglese e pipeline CI/CD. Le funzionalità di prodotto e l'autenticazione sono da sviluppare.

## Avvio rapido

Con Node.js 24 e npm:

```sh
npm ci
npm run dev
```

Regia: [localhost:5173](http://localhost:5173). Display: `/display/main` e `/display/stage`. API: [localhost:3000/api/v1/info](http://localhost:3000/api/v1/info).

Lo scaffold parte senza database. Per configurazione, PostgreSQL, migrazioni e container consultare [la guida di sviluppo](docs/sviluppo.md).

## Struttura e stack

| Percorso | Contenuto |
| --- | --- |
| `apps/web` | React, Vite, Tailwind, traduzioni e renderer |
| `apps/server` | Node.js, Fastify, Socket.IO e Drizzle/PostgreSQL |
| `packages/contracts` | Tipi condivisi e interfacce storage/STT |
| `tests/e2e` | Test Playwright |
| `docs` | Visione prodotto e guida operativa |

## Sviluppo e release

Si lavora su `feature/*`, `fix/*` o `chore/*`, con PR verso `main`. La CI verifica lint, tipi, test, build e container. Il push di un tag versione (es. `v0.1.1`) su un commit integrato in `main` avvia build e pubblicazione su `ghcr.io/chiesasiloe/cuelia:<tag>`. Dopo la pubblicazione, Komodo distribuisce su Asus e la pipeline verifica la versione online.

- [Visione prodotto e requisiti](docs/visione-prodotto.md)
- [Istruzioni per agenti e flusso di rilascio](AGENTS.md)
- [Guida per lo sviluppo](docs/sviluppo.md)
- [Deploy Komodo, tunnel e rollback](docs/deploy-komodo.md)

Sito: https://cuelia.chiesasiloe.it
