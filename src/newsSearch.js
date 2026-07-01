const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArticleSearchApp/1.0)' },
});

// Google News RSS: ricerca gratuita, senza API key, aggrega testate di tutto il mondo.
// Interroghiamo piu' edizioni in parallelo per coprire le 4 lingue richieste e,
// separatamente, le edizioni svizzere (che danno priorita' alla stampa svizzera).
const WORLD_EDITIONS = [
  { hl: 'it', gl: 'IT', ceid: 'IT:it' },
  { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
  { hl: 'de', gl: 'DE', ceid: 'DE:de' },
];

const SWISS_EDITIONS = [
  { hl: 'it', gl: 'CH', ceid: 'CH:it' },
  { hl: 'fr', gl: 'CH', ceid: 'CH:fr' },
  { hl: 'de', gl: 'CH', ceid: 'CH:de' },
];

// Testate ticinesi/svizzere da garantire sempre in copertura, oltre a quelle che
// emergono naturalmente dalle edizioni svizzere sopra (RSI, Blick, NZZ, RTS, ecc.).
const FEATURED_SWISS_SITES = ['rsi.ch', 'tio.ch', 'laregione.ch', 'cdt.ch'];

// Filtri temporali supportati dall'operatore "when:" di Google News.
const TIME_FILTERS = {
  today: 'when:1d',
  week: 'when:7d',
  month: 'when:1m',
  year: 'when:1y',
  all: null,
};

function buildFeedUrl(query, { hl, gl, ceid }) {
  const params = new URLSearchParams({ q: query, hl, gl, ceid });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// I link degli item RSS di Google News passano da un redirect news.google.com;
// il titolo dell'item spesso contiene " - NomeTestata" in coda: lo separiamo per mostrare la fonte.
function splitTitleSource(rawTitle, feedSource) {
  if (feedSource) return { title: rawTitle, source: feedSource };
  const idx = rawTitle.lastIndexOf(' - ');
  if (idx > -1) {
    return { title: rawTitle.slice(0, idx), source: rawTitle.slice(idx + 3) };
  }
  return { title: rawTitle, source: null };
}

function mapItems(feed) {
  return (feed.items || []).map((item) => {
    const { title, source } = splitTitleSource(item.title || '', item.source);
    return {
      title,
      source: source || item.creator || 'Sconosciuta',
      link: item.link,
      publishedAt: item.pubDate || null,
      snippet: stripHtml(item.contentSnippet || item.content || ''),
    };
  });
}

async function fetchFeed(query, edition) {
  try {
    const feed = await parser.parseURL(buildFeedUrl(query, edition));
    return mapItems(feed);
  } catch (err) {
    console.error(`Feed non raggiungibile (${edition.ceid}):`, err.message);
    return [];
  }
}

function dedupe(results) {
  const seen = new Set();
  const unique = [];
  for (const item of results) {
    const key = `${(item.title || '').trim().toLowerCase()}|${(item.source || '').trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

async function searchArticles(query, { timeframe = 'all', limit = 60 } = {}) {
  const timeSuffix = TIME_FILTERS[timeframe] ?? TIME_FILTERS.all;
  const finalQuery = timeSuffix ? `${query} ${timeSuffix}` : query;

  const swissQuery = timeSuffix
    ? `(${FEATURED_SWISS_SITES.map((site) => `site:${site}`).join(' OR ')}) ${query} ${timeSuffix}`
    : `(${FEATURED_SWISS_SITES.map((site) => `site:${site}`).join(' OR ')}) ${query}`;

  const feedRequests = [
    ...WORLD_EDITIONS.map((edition) => fetchFeed(finalQuery, edition)),
    ...SWISS_EDITIONS.map((edition) => fetchFeed(finalQuery, edition)),
    fetchFeed(swissQuery, SWISS_EDITIONS[0]),
  ];

  const feedResults = await Promise.all(feedRequests);
  const merged = dedupe(feedResults.flat());

  merged.sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  return merged.slice(0, limit);
}

module.exports = { searchArticles, TIME_FILTERS };
