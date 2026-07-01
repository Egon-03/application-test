const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArticleSearchApp/1.0)' },
});

// Google News RSS: ricerca gratuita, senza API key, aggrega testate di tutto il mondo.
// `hl`/`gl`/`ceid` selezionano lingua/paese dell'edizione ma i risultati includono comunque
// fonti internazionali pertinenti alla query.
const EDITIONS = {
  it: { hl: 'it', gl: 'IT', ceid: 'IT:it' },
  en: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
};

function buildFeedUrl(query, edition) {
  const { hl, gl, ceid } = EDITIONS[edition] || EDITIONS.it;
  const params = new URLSearchParams({
    q: query,
    hl,
    gl,
    ceid,
  });
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

async function searchArticles(query, { edition = 'it', limit = 20 } = {}) {
  const feedUrl = buildFeedUrl(query, edition);
  const feed = await parser.parseURL(feedUrl);

  return (feed.items || []).slice(0, limit).map((item) => {
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

module.exports = { searchArticles };
