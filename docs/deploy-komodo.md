# Deploy su Asus con Komodo

Cuelia è pubblicato su https://cuelia.chiesasiloe.it tramite il tunnel Cloudflare esistente su Asus.

## Risorse
- Stack Komodo: [cuelia](https://komodo.nickmalik.dev/stacks/6b0570917a62df59034fff8d).
- Action: [cuelia-release-deploy](https://komodo.nickmalik.dev/actions/6b0573037a62df59034fffea).
- Compose di riferimento: [deploy/compose.komodo.yaml](../deploy/compose.komodo.yaml).
- Script dell'action: [deploy/komodo-action.js](../deploy/komodo-action.js).
- Ingress nello stack cloudflare-tunnel: cuelia.chiesasiloe.it → http://127.0.0.1:8005.
- PostgreSQL e media usano volumi dello stack; il database non pubblica porte.

Compose e script sono conservati nel repository come riferimento: le copie operative sono configurate in Komodo. Quando cambiano questi file, aggiornare anche le risorse corrispondenti prima della release.

## Rilascio
1. Integrare la PR in main con CI verde.
2. Creare un tag versione non ancora usato, per esempio v0.1.1.
3. Il workflow Publish container valida il tag, esegue la CI e pubblica l'immagine su GHCR.
4. Il job Deploy Cuelia on Asus invia una richiesta firmata HMAC al webhook dedicato.
5. L'action accetta solo il repository ChiesaSiloe/Cuelia e l'immagine Cuelia con tag versione valido; aggiorna CUELIA_TAG e CUELIA_DEPLOYMENT, preservando le altre variabili, quindi distribuisce tramite Komodo.
6. Il job attende che /api/v1/info riporti il tag e l'identificativo del proprio run e che /health/live risponda. Un webhook accettato non basta a considerare concluso il deploy.

Il deploy usa la credenziale GHCR già configurata in Komodo. Il secret GitHub Actions KOMODO_CUELIA_WEBHOOK_SECRET deve contenere la chiave HMAC della sola action Cuelia; non usare le credenziali amministrative di Komodo.

I deploy GitHub sono serializzati dal gruppo di concorrenza cuelia-production; anche il listener Komodo accoda le richieste della stessa action. Evitare di rilasciare versioni diverse contemporaneamente se serve un ordine preciso.

## Operazioni manuali e ripristino
Sul server, km è già configurato. Per ridistribuire la versione selezionata:

```sh
km deploy stack cuelia
```

Confermare l'esecuzione quando richiesto. Per un rollback cambiare CUELIA_TAG nell'ambiente dello stack alla versione precedente, poi ridistribuire e verificare health check e immagine del container. Conservare POSTGRES_PASSWORD e i volumi: non distruggere lo stack per aggiornare l'applicazione.

L'action ripristina l'ambiente precedente e tenta un nuovo deploy se DeployStack fallisce. Il rollback dell'immagine non annulla eventuali migrazioni del database; i rilasci con migrazioni richiedono un piano compatibile.

## Diagnostica
- Il job si ferma prima del webhook: controllare CI, push GHCR e presenza del secret.
- Webhook 401: verificare la corrispondenza delle chiavi HMAC, senza stamparle nei log.
- Timeout in attesa della versione: controllare i log dell'action e dello stack in Komodo.
- App sana in localhost ma errore pubblico: controllare ingress e connettività del tunnel.
- Lo scaffold non implementa ancora autenticazione né funzioni di dominio. Il sito espone attualmente solo la pagina iniziale e metadati operativi non sensibili.

