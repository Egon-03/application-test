const path = require('path');
const express = require('express');
const { searchArticles, TIME_FILTERS } = require('./newsSearch');
const { extractArticle } = require('./extractor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

app.get('/api/search', async (req, res) => {
  const query = (req.query.q || '').toString().trim();
  const timeframeRaw = (req.query.timeframe || 'all').toString();
  const timeframe = Object.prototype.hasOwnProperty.call(TIME_FILTERS, timeframeRaw) ? timeframeRaw : 'all';

  if (!query) {
    return res.status(400).json({ error: 'Il parametro "q" (parole chiave) e\' obbligatorio.' });
  }

  try {
    const results = await searchArticles(query, { timeframe, limit: 150 });
    res.json({ query, timeframe, count: results.length, results });
  } catch (err) {
    console.error('Errore ricerca:', err.message);
    res.status(502).json({ error: 'Ricerca non riuscita. Riprova tra qualche istante.' });
  }
});

app.get('/api/extract', async (req, res) => {
  const url = (req.query.url || '').toString().trim();

  if (!url) {
    return res.status(400).json({ error: 'Il parametro "url" e\' obbligatorio.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!/^https?:$/.test(parsedUrl.protocol)) throw new Error('protocollo non valido');
  } catch {
    return res.status(400).json({ error: 'URL non valido.' });
  }

  try {
    const article = await extractArticle(parsedUrl.toString());
    res.json(article);
  } catch (err) {
    console.error('Errore estrazione:', err.message);
    res.status(502).json({ error: err.message || 'Estrazione del testo non riuscita per questo articolo.' });
  }
});

app.listen(PORT, () => {
  console.log(`Article Search App in ascolto su http://localhost:${PORT}`);
});
