# Moduli backend

Moduli Fastify del monolite Cuelia:

- **`auth`** (implementato): Better Auth + Drizzle ORM (`user`, `session`, `account`, `verification`), configurazione iniziale amministratore, gestione utenti e ruoli (`admin`, `operator`, `remote`, `viewer`), preferenza lingua per utente e guardie REST/Socket.IO.
- Prossimi moduli da aggiungere: `songs`, `schedules`, `live`, `displays`, `themes`, `bible` e `media`.

Ogni modulo possiede routes, service e repository quando necessari e viene registrato in `app.ts`.
