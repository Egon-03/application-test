const form = document.getElementById('search-form');
const queryInput = document.getElementById('query-input');
const editionSelect = document.getElementById('edition-select');
const searchBtn = document.getElementById('search-btn');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}

function renderResults(results) {
  resultsEl.innerHTML = '';
  results.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'result-card';
    li.innerHTML = `
      <h3>${escapeHtml(item.title)}</h3>
      <div class="result-meta">${escapeHtml(item.source)}${item.publishedAt ? ' · ' + formatDate(item.publishedAt) : ''}</div>
      <p class="result-snippet">${escapeHtml(item.snippet)}</p>
      <div class="result-actions">
        <button data-idx="${idx}" class="extract-btn">Estrai testo completo</button>
        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Apri originale</a>
      </div>
    `;
    resultsEl.appendChild(li);
  });

  resultsEl.querySelectorAll('.extract-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = results[Number(btn.dataset.idx)];
      openExtractModal(item.link);
    });
  });
}

async function openExtractModal(url) {
  modal.classList.remove('hidden');
  modalBody.innerHTML = '<p>Caricamento testo completo...</p>';

  try {
    const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Estrazione non riuscita.');
    }

    modalBody.innerHTML = `
      <h2 class="article-title">${escapeHtml(data.title || 'Articolo')}</h2>
      <div class="article-meta">
        ${data.siteName ? escapeHtml(data.siteName) + ' · ' : ''}${data.byline ? escapeHtml(data.byline) + ' · ' : ''}
        <a href="${escapeHtml(data.url)}" target="_blank" rel="noopener noreferrer">Fonte originale</a>
      </div>
      <button id="download-btn">Scarica come .txt</button>
      <div class="article-text">${escapeHtml(data.textContent)}</div>
    `;

    document.getElementById('download-btn').addEventListener('click', () => {
      const blob = new Blob([data.textContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeName = (data.title || 'articolo').replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
      link.download = `${safeName || 'articolo'}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    });
  } catch (err) {
    modalBody.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`;
  }
}

modalClose.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (!query) return;

  searchBtn.disabled = true;
  statusEl.textContent = 'Ricerca in corso...';
  resultsEl.innerHTML = '';

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&edition=${editionSelect.value}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Ricerca non riuscita.');
    }

    if (data.results.length === 0) {
      statusEl.textContent = 'Nessun articolo trovato per questa ricerca.';
    } else {
      statusEl.textContent = `${data.results.length} articoli trovati.`;
      renderResults(data.results);
    }
  } catch (err) {
    statusEl.textContent = '';
    resultsEl.innerHTML = `<li class="error">${escapeHtml(err.message)}</li>`;
  } finally {
    searchBtn.disabled = false;
  }
});
