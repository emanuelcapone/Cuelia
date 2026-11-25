# Guida per lo sviluppo

## Confini dello scaffold

Sono funzionanti bootstrap web/server, due URL display, selezione lingua/tema, API info, liveness e handshake Socket.IO.
Non sono implementati login, autorizzazioni, tabelle, libreria, scalette, sincronizzazione live, upload, gestione monitor, OBS o STT.
Better Auth e Socket.IO client sono predisposti come dipendenze; non simulano funzionalità complete.
Il renderer riceve dati tramite props e resta separato dalla regia. Le API di dominio non esistono ancora.

## Flusso di lavoro

1. Partire da main aggiornato e creare `feature/<requisito>`.
2. Implementare un requisito piccolo con criteri di accettazione dalla visione prodotto.
3. Aggiungere stringhe in entrambe le lingue e contratti condivisi quando necessari.
4. Eseguire i controlli di AGENTS.md, aprire PR e attendere revisione e CI.
5. Integrare in main; la pubblicazione avviene solo al push di un tag versione.

## Primo percorso suggerito

1. Schema utenti e Better Auth con migrazioni, sessioni e ruoli; autorizzazione REST e realtime prima dei comandi live.
2. RF-01: canti e ricerca, repository PostgreSQL e API validate.
3. RF-02/03: editor e scalette con Preview separata dal Live.
4. RF-04/05/10: stato centrale versionato, comandi autorizzati, riconnessione e conservazione dell'ultima slide sui display.

## Database nello sviluppo locale

Creare un file locale `compose.dev.yaml` (non contiene segreti):

```yaml
services:
  db:
    ports:
      - "127.0.0.1:5432:5432"
```

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d db
```

DATABASE_URL nel processo Node punta a localhost; nel container punta al servizio db.
Le migrazioni generate vanno committate e applicate esplicitamente; evitare modifiche automatiche allo schema all'avvio.

## UI e adapter

La configurazione shadcn/ui è in components.json; aggiungere solo i componenti necessari in apps/web/src/components/ui e i relativi token CSS quando si adotta un componente.
Le stringhe sono in i18n.ts (fallback italiano). La preferenza attuale è locale al browser; la preferenza per utente arriva con auth.
Gli adapter di storage/STT implementano le interfacce in packages/contracts. Nessun provider cloud è richiesto per avviare lo scaffold.
Il supporto Window Management API rimane opzionale: mantenere URL display apribili manualmente.

## Riferimenti

- [GitHub: pubblicazione immagini](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)
- [Tailwind con Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Fastify server](https://fastify.dev/docs/latest/Reference/Server/)

## Comandi e produzione

I comandi di verifica e il flusso di rilascio sono in [AGENTS.md](../AGENTS.md).

`npm run build` prepara frontend e server; `npm start` serve API, SPA e renderer su http://localhost:3000.
Per generare e applicare le migrazioni usare `npm run db:generate` e `npm run db:migrate`, con DATABASE_URL nella .env o nell'ambiente. Lo schema dello scaffold è vuoto.

Per avviare tutto in container:

```sh
cp .env.example .env
# Impostare POSTGRES_PASSWORD nella .env.
# Aggiornare anche DATABASE_URL con la stessa password per i processi Node locali.
docker compose up --build -d
```

PostgreSQL e media usano volumi persistenti. Il binding dell'app è localhost; l'autenticazione è ancora da implementare. Il controllo /health/live verifica il processo, non la disponibilità del DB.

Per usare un'immagine pubblicata, dopo autenticazione GHCR se il package è privato:

```sh
CUELIA_IMAGE=ghcr.io/chiesasiloe/cuelia:v0.1.0 docker compose pull app
CUELIA_IMAGE=ghcr.io/chiesasiloe/cuelia:v0.1.0 docker compose up -d --no-build app
```

Usare la versione desiderata al posto di v0.1.0. La pipeline pubblica l'immagine e distribuisce automaticamente su Asus tramite Komodo; non pubblica il tag Docker latest. Vedere [deploy, tunnel e rollback](deploy-komodo.md).
