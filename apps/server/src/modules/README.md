# Moduli backend

Aggiungere plugin Fastify per songs, schedules, live, displays, themes, bible, media e auth.
Ogni modulo possiede routes, service e repository quando necessari. Registrare i plugin in app.ts.
Better Auth è una dipendenza predisposta, non ancora configurata: prima dei comandi di dominio aggiungere schema, migrazioni, sessioni e autorizzazioni REST/Socket.IO. Non esporre questo scaffold come servizio operativo.
