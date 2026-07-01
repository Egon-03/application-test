# Ricerca Articoli nel Mondo

Web app per cercare articoli e notizie da testate di tutto il mondo a partire da parole chiave, ed estrarne il testo completo.

## Come funziona

- **Ricerca**: interroga il feed RSS pubblico di Google News (`news.google.com/rss/search`), che aggrega migliaia di testate giornalistiche e siti d'informazione a livello mondiale. Non richiede alcuna API key.
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
- La ricerca usa l'edizione italiana di Google News per default; è possibile selezionare l'edizione inglese (globale) per risultati internazionali più ampi.
