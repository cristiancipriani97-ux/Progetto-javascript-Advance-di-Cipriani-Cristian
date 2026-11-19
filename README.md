# Tongue Tech

Le notizie tech di **Hacker News**, rese accessibili a tutti: un'app web veloce da scorrere, pensata per la community di [Tongue](https://www.instagram.com/) e per chi vuole restare aggiornato sul mondo tech senza essere del settore.

## 🔗 Prova l'app online

**👉 [INSERISCI QUI IL LINK DEL DEPLOY (Netlify/Firebase)](https://INSERISCI-IL-TUO-LINK)**

## Funzionalità

- Tre sezioni: **In evidenza**, **Ultime**, **Migliori** (dati live da Hacker News)
- **Caricamento progressivo** (15 notizie alla volta)
- **Ricerca** full-text con debounce
- **Preferiti** salvati nel browser (con ricerca locale)
- **Tema chiaro/scuro** (rispetta le preferenze del sistema)
- Prima notizia **in evidenza**, classifica numerata, badge **🔥 In tendenza** e "logo" colorato della fonte
- Scorciatoie da tastiera: `/` per cercare, `Esc` per svuotare la ricerca
- Animazioni d'ingresso (disattivate con `prefers-reduced-motion`)
- Gestione errori con pulsante **Riprova** e annullamento delle richieste obsolete
- Interfaccia responsive e accessibile

## Screenshot

_Aggiungi qui uno o due screenshot (cartella `img/`)._

## Tecnologie

- JavaScript ES6+ (ES modules, classi, campi privati, async/await, AbortController)
- [Vite](https://vitejs.dev/) – dev server e bundling
- [Vitest](https://vitest.dev/) – test automatici
- [Axios](https://axios-http.com/) – chiamate HTTP
- API: [Hacker News (Firebase)](https://github.com/HackerNews/API) e [Algolia HN Search](https://hn.algolia.com/api)

## Avvio del progetto

Requisiti: Node.js 20 o superiore.

```bash
npm install        # installa le dipendenze
npm run dev        # avvia il server di sviluppo (http://localhost:5173)
npm test           # esegue i test con Vitest
npm run build      # genera la versione di produzione in dist/
npm run preview    # prova la build in locale
```

## Struttura del progetto

```
├── index.html                  # contenuto HTML
├── css/styles.css              # stili
├── img/                        # immagini e favicon
├── js/
│   ├── main.js                 # composition root + azioni (controller)
│   ├── api/
│   │   ├── http.js             # client Axios (unico file che dipende da Axios)
│   │   ├── hackerNewsRepository.js   # Repository: accesso ai dati
│   │   └── normalizers.js      # API diverse -> un unico modello interno
│   ├── store/
│   │   ├── store.js            # store reattivo (Observer)
│   │   ├── selectors.js        # dati derivati dallo stato
│   │   ├── favorites.js        # servizio preferiti
│   │   └── storage.js          # wrapper sicuro per localStorage
│   ├── ui/view.js              # rendering del DOM
│   └── utils/                  # format, pagination, errors
└── tests/                      # unit test Vitest
```

## Design pattern utilizzati

**Repository (con Dependency Injection)** — `HackerNewsRepository`
Problema: la UI non deve conoscere endpoint, formati di risposta, cache o gestione degli errori. Il repository espone metodi di dominio (`getStoryIds`, `getStories`, `search`) e riceve i client HTTP dall'esterno, quindi nei test si usano client finti senza rete.

**Observer** — `createStore`
Problema: separare logica e interfaccia. Il controller aggiorna lo stato, la view è iscritta allo store e si ridisegna a ogni cambiamento. Lo stato è in un unico punto, prevedibile e testabile.

## Test

I test (`tests/`) coprono le parti critiche di calcolo e gestione dati: normalizzazione delle risposte API, repository (ordine, cache, errori parziali e totali), paginazione, tempo relativo, store, preferiti, storage e selettori.

## Note di sviluppo

- La UI usa solo `textContent` (mai `innerHTML` con dati esterni) per evitare XSS.
- Con `Promise.allSettled` una notizia che non si carica non blocca le altre.
- Ogni nuova azione annulla la richiesta precedente (`AbortController`), evitando che risposte "vecchie" sovrascrivano quelle nuove.

## Autore

_Il tuo nome_ — progetto del Corso di JavaScript Advanced.
