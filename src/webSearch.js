const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// DuckDuckGo supporta un filtro data via il parametro "df" (d/w/m/y), analogo
// all'operatore "when:" usato per Google News, cosi' i due filtri restano coerenti.
const DDG_TIME_RANGES = { today: 'd', week: 'w', month: 'm', year: 'y' };

function resolveDdgLink(rawHref) {
  try {
    const url = new URL(rawHref, 'https://duckduckgo.com');
    if (url.hostname.endsWith('duckduckgo.com') && url.pathname === '/l/') {
      const target = url.searchParams.get('uddg');
      if (target) return decodeURIComponent(target);
    }
    return url.toString();
  } catch {
    return rawHref;
  }
}

// Ricerca web generale (motore DuckDuckGo, HTML pubblico, senza API key): a differenza
// di Google News, che seleziona solo contenuti classificati come "notizia", questa
// copre qualsiasi pagina/sito che contenga la parola cercata, aumentando la copertura.
async function searchWeb(query, { timeframe = 'all', limit = 40 } = {}) {
  const params = new URLSearchParams({ q: query, kl: 'wt-wt' });
  const df = DDG_TIME_RANGES[timeframe];
  if (df) params.set('df', df);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'it,en;q=0.8,fr;q=0.6,de;q=0.6',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);

    const html = await res.text();
    const dom = new JSDOM(html);
    const nodes = [...dom.window.document.querySelectorAll('.result')];

    return nodes
      .map((node) => {
        const linkEl = node.querySelector('.result__a');
        if (!linkEl) return null;
        const link = resolveDdgLink(linkEl.getAttribute('href') || '');
        if (!link) return null;

        let source = 'Sconosciuta';
        try {
          source = new URL(link).hostname.replace(/^www\./, '');
        } catch {
          /* link non valido: manteniamo la fonte generica */
        }

        const snippetEl = node.querySelector('.result__snippet');
        return {
          title: linkEl.textContent.trim(),
          source,
          link,
          publishedAt: null,
          snippet: (snippetEl?.textContent || '').trim(),
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  } catch (err) {
    console.error('Ricerca web (DuckDuckGo) non riuscita:', err.message);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { searchWeb };
