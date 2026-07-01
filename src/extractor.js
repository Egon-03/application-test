const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fetchHtml(url, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Richiesta fallita con status ${res.status}`);
    }
    const finalUrl = res.url || url;
    const html = await res.text();
    return { html, finalUrl };
  } finally {
    clearTimeout(timer);
  }
}

// Estrae il testo completo (articolo pulito, senza menu/pubblicita') di una pagina web
// usando lo stesso algoritmo di "Modalita' lettura" di Firefox (Readability di Mozilla).
async function extractArticle(url) {
  const { html, finalUrl } = await fetchHtml(url);
  const dom = new JSDOM(html, { url: finalUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || !article.textContent.trim()) {
    throw new Error('Impossibile estrarre il testo completo da questa pagina (contenuto non riconosciuto o protetto).');
  }

  return {
    url: finalUrl,
    title: article.title || null,
    byline: article.byline || null,
    siteName: article.siteName || null,
    excerpt: article.excerpt || null,
    textContent: article.textContent.trim(),
    length: article.length || article.textContent.trim().length,
  };
}

module.exports = { extractArticle };
