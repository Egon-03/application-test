# Ricerca Articoli nel Mondo

Web app per cercare articoli e notizie da testate di tutto il mondo a partire da parole chiave, ed estrarne il testo completo.

## Come funziona

- **Ricerca**: interroga in parallelo più edizioni del feed RSS pubblico di Google News (`news.google.com/rss/search`) — italiano, inglese, francese e tedesco a livello mondiale, più le edizioni svizzere (IT/FR/DE-CH) e una query mirata sulle testate ticinesi (RSI, TIO.CH, laRegione.ch, Corriere del Ticino) — per garantire copertura sia globale che svizzera. I risultati vengono uniti, deduplicati e ordinati per data. Non richiede alcuna API key.
- **Filtro periodo**: puoi limitare i risultati ad oggi, ultima settimana, ultimo mese, ultimo anno oppure a tutto il periodo disponibile.
- **Estrazione testo completo**: per ogni articolo selezionato, il server scarica la pagina originale e ne estrae il contenuto pulito (senza menu, pubblicità, ecc.) usando [Readability](https://github.com/mozilla/readability) di Mozilla — lo stesso motore della "modalità lettura" di Firefox.
- Il testo estratto può essere scaricato come file `.txt`.

## Requisiti

- Node.js 18+

## Avvio

```bash
npm install
npm start
```

L'app sarà disponibile su [http://localhost:3000](http://localhost:3000).

Per lo sviluppo con riavvio automatico:

```bash
npm run dev
```

## Note

- L'estrazione del testo completo dipende dalla struttura di ciascun sito e potrebbe non riuscire su pagine con paywall stretti o protezioni anti-bot.
- Ogni ricerca interroga 8 feed RSS in parallelo (4 edizioni mondiali + 3 svizzere + 1 mirata sulla stampa ticinese), quindi può richiedere qualche secondo in più rispetto a una ricerca su una singola edizione.

## Deploy pubblico da GitHub (link sempre attivo)

L'app è un normale server Node/Express (legge `process.env.PORT`), quindi è pronta per essere collegata a un hosting gratuito che si aggiorna automaticamente a ogni push sul repo GitHub. Il repo include già un `render.yaml` per il deploy su [Render](https://render.com):

1. Crea un account gratuito su [render.com](https://render.com) (login con GitHub).
2. Su Render: **New > Blueprint**, seleziona questo repository GitHub.
3. Render legge `render.yaml` e crea automaticamente il Web Service (build `npm install`, avvio `npm start`).
4. Al termine del deploy ottieni un URL pubblico tipo `https://article-search-app.onrender.com`, aggiornato automaticamente a ogni push su `main`.

> Nota: il piano free di Render "si addormenta" dopo ~15 minuti di inattività; la prima richiesta successiva può richiedere qualche secondo in più per il riavvio. In alternativa funzionano allo stesso modo altri hosting Node collegabili a GitHub come [Railway](https://railway.app) o [Fly.io](https://fly.io).
