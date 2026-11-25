# Cuelia — Software Requirements Specification (SRS)

**Versione:** 0.2 — Draft  
**Data:** 24 novembre 2026  
**Stato:** Proposta iniziale, da validare  
**Prodotto di riferimento:** Quelea  
**Tipologia:** Applicazione web per la regia e proiezione multimediale durante eventi e culti

---

## 1. Visione e obiettivi

### 1.1 Visione

Cuelia è una piattaforma web multilingua per preparare, organizzare, controllare e visualizzare contenuti multimediali durante culti, conferenze ed eventi dal vivo.

L'applicazione deve consentire di sostituire le principali funzioni operative di Quelea attraverso un'interfaccia browser, senza richiedere un'applicazione desktop dedicata.

### 1.2 Obiettivi

- Gestire la proiezione di canti, passi biblici, immagini e altri contenuti.
- Controllare contemporaneamente più uscite indipendenti.
- Preparare scalette e contenuti prima dell'evento.
- Consentire la regia da computer, tablet e altri dispositivi.
- Garantire affidabilità durante eventi dal vivo.
- Consentire l'utilizzo dell'interfaccia in più lingue, indipendentemente dalla lingua dei contenuti proiettati.
- Supportare un motore di avanzamento automatico delle slide basato sul riconoscimento del cantato.
- Consentire il funzionamento nella rete locale, anche senza Internet quando le risorse necessarie sono disponibili localmente.

### 1.3 Utenti

**Amministratore:** configura l'applicazione, le uscite, i permessi e le librerie.

**Operatore di regia:** prepara e gestisce contenuti, scalette e proiezioni live.

**Operatore remoto:** controlla la proiezione da un dispositivo autorizzato.

**Visualizzatore:** riceve un'uscita di proiezione senza poter modificare lo stato della regia.

---

## 2. Scope

### 2.1 In scope — MVP

1. Gestione database dei canti.
2. Editor dei testi e delle sezioni.
3. Creazione e gestione delle scalette.
4. Interfaccia di regia con Preview e Live.
5. Controllo manuale delle slide.
6. Visualizzazione multischermo.
7. Gestione dei temi grafici.
8. Ricerca e proiezione dei passi biblici.
9. Proiezione di immagini.
10. Sincronizzazione in tempo reale.
11. Controllo remoto tramite browser.
12. Autenticazione e permessi essenziali.
13. Importazione iniziale della libreria.
14. Persistenza e recupero dello stato operativo.
15. Funzionamento locale indipendente da servizi cloud esterni per la regia manuale.
16. Interfaccia multilingua e gestione di contenuti in lingue diverse.

### 2.2 In scope — Versioni successive

- Video, PDF e presentazioni.
- Overlay per OBS.
- Annunci, timer e countdown.
- Traduzione automatica dei contenuti e sottotitoli multilingua.
- Mobile Lyrics.
- Registrazione audio.
- Integrazioni con piattaforme esterne.
- Riconoscimento del cantato e cambio slide automatico.
- Predizione della prossima sezione del canto.
- Controllo dei display mediante agente locale opzionale.

### 2.3 Out of scope — MVP

- Editing completo di presentazioni PowerPoint.
- Produzione e montaggio video.
- Mixing audio e sostituzione di OBS.
- Streaming video verso piattaforme esterne.
- Controllo hardware nativo garantito su tutti i sistemi operativi.
- Gestione amministrativa dell'organizzazione.
- Dipendenza obbligatoria da servizi di intelligenza artificiale.

---

## 3. Requisiti funzionali

Le priorità sono:

- **P0:** indispensabile per l'MVP.
- **P1:** importante per la prima release successiva.
- **P2:** evoluzione futura.

### RF-01 — Libreria dei canti

**Priorità: P0**

Il sistema deve consentire di:

- Creare, modificare, duplicare e archiviare canti.
- Memorizzare titolo, autore, testo, lingua, tag e metadati opzionali.
- Suddividere un canto in sezioni strutturate (strofa, ritornello, bridge, pre-chorus, outro).
- Ricercare per titolo, testo, autore e tag.
- Definire un ordine predefinito delle sezioni.
- Importare canti da almeno un formato di interscambio documentato.
- Evitare perdite di dati durante il salvataggio.

**Criterio di accettazione:** un operatore può creare un canto, modificarne le sezioni, ritrovarlo tramite ricerca e aggiungerlo a una scaletta.

### RF-02 — Editor e generazione delle slide

**Priorità: P0**

Il sistema deve:

- Consentire la modifica del testo delle sezioni.
- Suddividere il contenuto in slide proiettabili.
- Supportare interruzioni di slide manuali.
- Applicare regole configurabili di impaginazione.
- Offrire un'anteprima del risultato.
- Consentire sequenze diverse senza alterare necessariamente il canto originale.

**Criterio di accettazione:** una modifica effettuata all'impaginazione è riprodotta coerentemente nell'anteprima e nell'uscita live.

### RF-03 — Gestione delle scalette

**Priorità: P0**

Il sistema deve:

- Creare, salvare, duplicare e modificare scalette.
- Aggiungere canti, passi biblici e immagini.
- Riordinare gli elementi tramite drag-and-drop o controlli equivalenti.
- Supportare copie specifiche dei canti nella scaletta.
- Ripristinare una scaletta salvata.
- Consentire la modifica della scaletta durante l'evento.

**Criterio di accettazione:** il riordinamento di una scaletta non modifica involontariamente l'elemento attualmente in proiezione.

### RF-04 — Regia live

**Priorità: P0**

L'interfaccia deve presentare:

- Libreria dei contenuti.
- Scaletta corrente.
- Anteprima del contenuto selezionato.
- Stato della proiezione live.
- Slide corrente e prossima slide.
- Comandi Go Live, Next, Previous e selezione diretta.
- Comandi Black, Clear e Logo.
- Scorciatoie da tastiera configurabili almeno per le operazioni fondamentali.

**Criterio di accettazione:** l'operatore può preparare un elemento in Preview senza modificarne la visualizzazione Live.

### RF-05 — Gestione delle uscite

**Priorità: P0**

Il sistema deve:

- Definire uscite logiche indipendenti.
- Supportare un'uscita principale e una Stage View.
- Consentire a una pagina browser di registrarsi come display.
- Assegnare a un display un profilo di visualizzazione.
- Sincronizzare le uscite con lo stato live.
- Mostrare nella regia la connessione delle uscite.
- Ripristinare lo stato dopo una riconnessione.
- Supportare modalità fullscreen tramite le capacità del browser.

Il rilevamento e posizionamento automatico dei monitor locali deve essere considerato una capacità opzionale, subordinata al supporto del browser.

**Criterio di accettazione:** due browser su dispositivi distinti visualizzano correttamente il contenuto live secondo due layout differenti.

### RF-06 — Temi e layout

**Priorità: P0**

Il sistema deve consentire di definire:

- Font, dimensioni e colore del testo.
- Allineamento, margini e spaziatura.
- Sfondi statici con colori o immagini.
- Layout specifici per tipologia di uscita.
- Temi riutilizzabili.
- Tema predefinito e override per singolo elemento.

**Criterio di accettazione:** lo stesso canto può essere mostrato sul proiettore e sul monitor palco con due presentazioni grafiche diverse.

### RF-07 — Bibbia

**Priorità: P0**

Il sistema deve:

- Consultare traduzioni bibliche legalmente disponibili.
- Ricercare libri, capitoli e versetti.
- Selezionare intervalli di versetti.
- Creare slide a partire dai passi selezionati.
- Visualizzare il riferimento biblico.
- Aggiungere i passi alla scaletta.

**Criterio di accettazione:** un operatore può cercare un passo biblico, visualizzarlo in Preview e inviarlo Live.

### RF-08 — Immagini

**Priorità: P0**

Il sistema deve permettere il caricamento, l'organizzazione e la proiezione di immagini nei formati web supportati.

Deve supportare le principali modalità di adattamento allo schermo senza distorsioni indesiderate.

### RF-09 — Controllo remoto

**Priorità: P0**

Il sistema deve consentire a un dispositivo autorizzato di:

- Visualizzare lo stato della regia.
- Navigare tra le slide.
- Navigare tra gli elementi della scaletta.
- Eseguire i principali comandi di proiezione.
- Operare senza accedere direttamente al computer che ospita il servizio.

### RF-10 — Gestione della sessione live

**Priorità: P0**

Il sistema deve mantenere uno stato centrale che includa almeno:

- Scaletta attiva.
- Elemento corrente.
- Slide corrente.
- Modalità output.
- Tema applicato.
- Stato dei display connessi.
- Ultima versione dello stato pubblicato.

L'aggiornamento simultaneo di più operatori deve essere gestito mediante regole esplicite di autorizzazione e concorrenza.

### RF-11 — Contenuti multimediali avanzati

**Priorità: P1**

Il sistema deve supportare:

- Riproduzione di video caricati.
- Controlli essenziali di playback.
- Presentazioni PDF.
- Timer e countdown.
- Annunci.
- Uscite dedicate alla composizione video in OBS.

L'integrazione con formati PowerPoint nativi e servizi video esterni è subordinata a una verifica di compatibilità.

### RF-12 — Automazione intelligente delle slide

**Priorità: P1**

Il sistema dovrà prevedere un modulo opzionale in grado di:

- Acquisire un flusso audio autorizzato.
- Ricevere trascrizioni in tempo reale.
- Associare il cantato alle sezioni di un canto.
- Stimare la posizione corrente.
- Prevedere la probabile sezione successiva.
- Gestire ripetizioni, salti e improvvisazioni.
- Effettuare transizioni automatiche secondo regole configurabili.
- Consentire all'operatore di disabilitare immediatamente l'automazione.
- Supportare diversi motori di riconoscimento vocale, locali o remoti.

**Criterio di accettazione:** il modulo può essere disattivato senza interrompere la regia manuale o le uscite di proiezione.

### RF-13 — Interfaccia multilingua

**Priorità: P0**

Il sistema deve:

- Consentire la selezione della lingua dell'interfaccia per operatore e conservarne la preferenza.
- Fornire nell'MVP almeno italiano e inglese per regia, amministrazione e controllo remoto.
- Separare la lingua dell'interfaccia dalla lingua dei canti, delle traduzioni bibliche e degli altri contenuti.
- Consentire a operatori con lingue dell'interfaccia diverse di controllare la stessa sessione.
- Gestire contenuti Unicode senza alterarne testo e caratteri durante salvataggio, ricerca e proiezione.
- Applicare una lingua di fallback esplicita alle traduzioni dell'interfaccia mancanti.

**Criterio di accettazione:** due operatori utilizzano la stessa sessione con interfacce in italiano e inglese; il cambio della lingua dell'interfaccia non modifica i contenuti né lo stato Live. Entrambe le lingue sono disponibili senza Internet.

---

## 4. Requisiti non funzionali

I valori numerici seguenti sono **target progettuali proposti**, da validare con test sul campo.

### RNF-01 — Prestazioni

- Propagazione dei normali cambi slide ai display connessi: P95 inferiore a 150 ms nella LAN, esclusi i tempi di rendering di contenuti pesanti.
- Interfaccia reattiva durante la navigazione.
- Supporto iniziale di almeno 5 display contemporanei.
- Nessuna dipendenza dal tempo di risposta di un modello AI per il cambio slide manuale.

### RNF-02 — Affidabilità

- La perdita temporanea del collegamento al backend non deve causare automaticamente una schermata vuota.
- Ogni display deve conservare l'ultimo contenuto correttamente visualizzato.
- Dopo la riconnessione deve avvenire la risincronizzazione.
- Il riavvio di un display non deve interrompere gli altri.
- Il fallimento del modulo AI non deve bloccare il controllo manuale.

### RNF-03 — Disponibilità offline

- La regia manuale deve poter funzionare in una rete locale senza accesso Internet.
- I contenuti necessari alla sessione devono essere disponibili localmente.
- Il sistema non deve richiedere obbligatoriamente servizi cloud per autenticazione e proiezione.
- Le funzionalità che richiedono servizi esterni devono degradare senza compromettere le funzioni fondamentali.

### RNF-04 — Compatibilità

- Browser desktop moderni basati su Chromium come riferimento primario per le funzioni avanzate.
- Accesso alla regia da browser mobili compatibili.
- Display utilizzabili su dispositivi diversi attraverso URL dedicati.
- Risoluzioni Full HD come target iniziale.
- Layout responsive per regia e controlli remoti.

### RNF-05 — Sicurezza

- Autenticazione degli operatori.
- Autorizzazione per le operazioni che modificano il live.
- Display con accesso limitato ai contenuti necessari.
- Protezione degli endpoint e dei canali di comunicazione.
- TLS per accessi esterni alla LAN e per le funzioni che lo richiedono.
- Controllo degli upload e dei contenuti non attendibili.

### RNF-06 — Usabilità

- Interfaccia utilizzabile in condizioni di scarsa illuminazione.
- Controlli essenziali sempre accessibili.
- Distinzione visiva inequivocabile tra Preview e Live.
- Prevenzione dei comandi accidentali durante la proiezione.
- Navigazione rapida mediante tastiera.
- Accessibilità e leggibilità delle uscite.

### RNF-07 — Manutenibilità

- Separazione tra regia, contenuti, rendering e sincronizzazione.
- Motore di proiezione indipendente dal riconoscimento vocale.
- API documentate.
- Logging degli errori.
- Test automatici delle principali operazioni.
- Possibilità di aggiungere nuovi tipi di contenuto e nuovi output.

### RNF-08 — Portabilità e distribuzione

- Distribuzione tramite container.
- Configurazione esterna all'immagine applicativa.
- Persistenza dei dati su storage configurabile.
- Backup e ripristino dei contenuti e delle impostazioni.
- Possibilità di esecuzione su un singolo host locale.

### RNF-09 — Internazionalizzazione

- Le stringhe dell'interfaccia devono essere esterne ai componenti e organizzate in risorse di traduzione estendibili.
- Le traduzioni dell'interfaccia devono essere distribuite localmente, senza servizi cloud obbligatori.
- Date, numeri e plurali devono rispettare la lingua selezionata.
- I layout devono tollerare la diversa lunghezza dei testi tradotti.
- La localizzazione dell'interfaccia non implica la traduzione automatica dei contenuti, prevista nelle versioni successive.

---

## 5. Vincoli architetturali

### 5.1 Principi

1. **Web-first:** la regia deve essere accessibile via browser.
2. **Output-agnostic:** un'uscita logica non deve dipendere dal monitor fisico.
3. **Real-time:** le proiezioni devono reagire ai cambiamenti dello stato condiviso.
4. **Local-first:** l'evento deve poter funzionare senza connessione a Internet.
5. **AI-optional:** l'intelligenza artificiale deve essere un modulo facoltativo.
6. **Fail-safe:** un errore in un componente non deve interrompere l'intero sistema.

### 5.2 Moduli logici

- Content Library
- Song Editor
- Schedule Manager
- Live Controller
- Output Renderer
- Display Registry
- Theme Engine
- Bible Provider
- Media Manager
- Authentication & Authorization
- Realtime Synchronization
- Automation Engine (successivo all'MVP)

L'implementazione iniziale può essere un monolite modulare. Non è richiesto l'utilizzo di microservizi.

---

## 6. User journey fondamentali

### UC-01 — Preparazione del culto

L'operatore accede alla piattaforma, ricerca i canti, aggiunge i passi biblici, compone la scaletta, configura i temi e salva la sessione.

### UC-02 — Avvio della regia

L'operatore apre l'interfaccia di regia, verifica i display collegati, seleziona la scaletta e verifica l'anteprima prima della proiezione.

### UC-03 — Cambio slide

Durante un canto l'operatore seleziona una slide o utilizza i controlli Next/Previous. Il sistema aggiorna tutte le uscite assegnate mantenendo i rispettivi layout.

### UC-04 — Collegamento di un nuovo display

Un secondo dispositivo apre l'URL dell'uscita assegnata. Dopo la registrazione e l'autorizzazione eventualmente richiesta, riceve lo stato corrente e visualizza immediatamente il contenuto live.

### UC-05 — Perdita di connessione

Un display perde temporaneamente il collegamento. Mantiene l'ultima slide disponibile e, quando la connessione ritorna, recupera lo stato aggiornato senza richiedere il riavvio della regia.

### UC-06 — Automazione del canto (P1)

Il modulo automatico riconosce il canto, identifica la sezione attualmente eseguita e propone o applica il cambio slide. In qualsiasi momento l'operatore può assumere il controllo manuale.

---

## 7. Criteri di completamento dell'MVP

L'MVP può considerarsi funzionalmente completo quando:

1. Un operatore riesce a importare o creare una libreria di canti.
2. Riesce a costruire e salvare una scaletta.
3. Riesce a gestire Preview e Live indipendentemente.
4. Riesce a cambiare slide tramite tastiera o interfaccia.
5. Riesce a visualizzare contemporaneamente una proiezione principale e una Stage View.
6. Un secondo dispositivo può controllare la regia con autorizzazioni appropriate.
7. Una disconnessione temporanea del display non cancella la proiezione.
8. Il sistema può completare una sessione manuale in rete locale senza Internet.
9. I contenuti e la configurazione sopravvivono a un riavvio.
10. Sono superati i test essenziali di navigazione, sincronizzazione e recupero dello stato.
11. La regia è utilizzabile in italiano e inglese anche offline, senza cambiare la lingua dei contenuti proiettati.

---

## 8. Decisioni ancora da validare

- Modello di deploy iniziale: server locale, cloud o entrambi.
- Formati di importazione da supportare prioritariamente.
- Traduzioni bibliche disponibili e relative licenze.
- Gestione delle versioni dei contenuti condivisi.
- Regole di controllo quando più operatori sono connessi.
- Supporto ufficiale dei diversi browser.
- Requisiti esatti per la riproduzione video.
- Collocazione dell'automazione AI nella roadmap.
- Strategia di sincronizzazione dei contenuti tra più installazioni.

**Fine documento — Versione 0.2**