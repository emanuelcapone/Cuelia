# Changelog — Cuelia

Tutte le modifiche rilevanti al progetto vengono documentate in questo file, passo dopo passo.

---

## [Passo 2] — Autenticazione, utenti, ruoli e protezione REST/Socket.IO (2026-11-25)

### Database e migrazioni (PostgreSQL + Drizzle ORM)
- Definito lo schema PostgreSQL in `apps/server/src/db/schema.ts` con le tabelle `user`, `session`, `account` e `verification` (compatibili con Better Auth), includendo i campi Cuelia `role` (default `viewer`) e `locale` (default `it`), chiavi esterne con `ON DELETE CASCADE` e indici.
- Generata la prima migrazione SQL Drizzle in `apps/server/drizzle/0000_init_auth.sql` (con metadata in `apps/server/drizzle/meta/`).
- Aggiornato `apps/server/src/db/client.ts` per passare lo schema a Drizzle, gestire gli errori del pool PostgreSQL ed esporre `checkReady()` (`SELECT 1`).
- Aggiunto l'endpoint `GET /health/ready` mantenendo `GET /health/live` indipendente dal database.

### Autenticazione, ruoli e sicurezza (Better Auth + RBAC)
- Aggiunti i contratti condivisi di autenticazione e permessi in `packages/contracts/src/index.ts` per i 4 ruoli di prodotto:
  - `admin` (`users:manage`, `library:write`, `schedule:write`, `live:control`, `display:view`)
  - `operator` (`library:write`, `schedule:write`, `live:control`, `display:view`)
  - `remote` (`live:control`, `display:view`)
  - `viewer` (`display:view`)
- Implementato il modulo backend `apps/server/src/modules/auth/` (`user-repository.ts`, `auth-service.ts`, `auth-plugin.ts`):
  - Integrazione **Better Auth** con adapter Drizzle su PostgreSQL (quando `DATABASE_URL` è configurata) e adapter in-memory per test/sviluppo locale senza DB.
  - Plugin `bearer()` + sessioni cookie `HttpOnly` e controlli origine sulle mutazioni cookie.
  - Registrazione pubblica `/api/auth/sign-up/*` bloccata (`403 SIGNUP_DISABLED`).
  - Flusso **Configurazione iniziale amministratore** (`GET /api/v1/auth/bootstrap-status`, `POST /api/v1/auth/bootstrap`) attivo solo quando il database ha 0 utenti e bloccato automaticamente dopo la creazione del primo amministratore.
  - Endpoint autenticati `GET /api/v1/me` e `PATCH /api/v1/me/preferences` (salvataggio lingua interfaccia per utente, `RF-13`).
  - Endpoint riservati ad `admin` (`GET/POST /api/v1/users`, `PATCH /api/v1/users/:id/role`, `DELETE /api/v1/users/:id`) con protezione contro l'auto-eliminazione e contro la rimozione o il declassamento dell'ultimo amministratore.
- Aggiunto middleware di autenticazione e autorizzazione su **Socket.IO** in `apps/server/src/app.ts`:
  - Le connessioni `director` richiedono sessione autenticata all'handshake (`UNAUTHORIZED` altrimenti).
  - Le connessioni `display` restano in sola lettura (`viewer`).
  - I comandi `live:command` verificano sessione e permesso `live:control` sul server.

### Interfaccia Web (React + Tailwind + i18n IT/EN)
- Aggiunti i form accessibili di **Configurazione iniziale amministratore** e **Login** (`apps/web/src/components/AuthForms.tsx`).
- Aggiunto il pannello amministrativo **Utenti e ruoli** (`apps/web/src/components/UserManagementPanel.tsx`) per creare utenti, cambiare ruoli e rimuovere account con conferma inline.
- Aggiornato `apps/web/src/App.tsx` con sessione attiva, permessi visibili, sincronizzazione della lingua per utente e client API tipizzato (`apps/web/src/lib/auth-api.ts`) con token bearer solo in memoria.
- Estese le traduzioni in italiano e inglese in `apps/web/src/i18n.ts`.

### Configurazione, test e documentazione
- Aggiornato `.env.example` con le variabili segnaposto `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL`.
- Aggiornato `apps/server/src/modules/README.md`.
- Estesi i test automatici Vitest (`apps/server/src/app.test.ts`) su bootstrap, login, RBAC, preferenze e autorizzazione Socket.IO.
- Estesi i test Playwright E2E (`tests/e2e/scaffold.spec.ts`) sul flusso completo di configurazione iniziale, creazione operatore e accesso RBAC.

### Note operative per il deploy in produzione (Asus / Komodo)
- Prima o subito dopo il rilascio su produzione con PostgreSQL, eseguire la migrazione Drizzle (`npm run db:migrate`) contro il database e configurare una variabile `BETTER_AUTH_SECRET` casuale (almeno 32 caratteri) nello stack Komodo.

---

## [Passo 1] — Verifica ambiente e predisposizione database locale (2026-11-25)

- Analizzata l'architettura del repository (`apps/web`, `apps/server`, `packages/contracts`, `docs`, `compose.yaml`, `deploy/`).
- Verificati i controlli di base dello scaffold (`lint`, `typecheck`, `test`, `build`).
- Creato il file template `.env.example` con le variabili segnaposto per PostgreSQL (`POSTGRES_PASSWORD`, `DATABASE_URL`) e configurazione del server locale.
