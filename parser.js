// ============================
// ✅ parser.js — стабилен парсер за новини (Safari/Chrome)
// ============================

// Универсални селектори за различни сайтове
const SELECTORS = [
  'article',                     // OFFNews, Dnevnik, Mediapool
  '.article-item',               // Kapital, Dnevnik
  '.post',                       // bTV
  '.news-item',                  // OFFNews
  '.story',                      // BBC
  '.c-article',                  // Mediapool
  '.l-article'                   // други
].join(',');

// ---- Proxy fallback (по приоритет) ----
const NEWS_PROXIES = [
  url => `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}&t=${Date.now()}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

// ---- Изтегляне с fallback по proxy списък ----
async function fetchWithProxies(url) {
  let lastErr;
  for (const make of NEWS_PROXIES) {
    const proxURL = make(url);
    try {
      const res = await fetch(proxURL, { mode: 'cors', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text && text.length > 100) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Всички proxy опити неуспешни');
}

// Избира raw блоковете със статии от HTML
function selectRawBlocks(doc) {
  return Array.from(doc.querySelectorAll(SELECTORS));
}

// Карта от raw HTML
function toCardElement(rawHTML, baseHref) {
  const fragDoc = parseHTML('<div id="wrap">' + rawHTML + '</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const imgSrc = wrap.querySelector('img')?.getAttribute('src') || '';
  const h = wrap.querySelector('h1,h2,h3,h4');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || '(без заглавие)').trim();
  const rawLink = h?.querySelector('a[href]')?.getAttribute('href') || wrap.querySelector('a[href]')?.getAttribute('href') || '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  let isoDate = '', formattedDate = '';
  const t = wrap.querySelector('time[datetime]') || wrap.querySelector('meta[property="article:published_time"]');
  const dateText = t ? (t.getAttribute('datetime') || t.content || '') : '';
  if (dateText) {
    const d = new Date(dateText);
    if (!isNaN(d)) {
      isoDate = d.toISOString();
      formattedDate = d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
    }
  }

  const breadcrumb = wrap.querySelector('li.breadcrumb-item, .category, .news-category');
  const category = breadcrumb ? breadcrumb.textContent.trim() : '';
  let source = '';
  try { source = new URL(baseHref).hostname.replace(/^www\./, ''); } catch {}

  const card = document.createElement('div');
  card.className = 'card-row';
  if (isoDate) card.dataset.date = isoDate;
  if (linkAbs) card.dataset.href = linkAbs;
  if (category) card.dataset.category = category;

  card.innerHTML = `
    <div class="thumb">${imgSrc ? `<img src="${imgSrc}" alt="">` : '<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="${linkAbs || '#'}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
        ${formattedDate ? `<div class="meta-date">🕒 ${formattedDate}</div>` : ''}
      </div>
      <div class="meta">${source}${category ? ` • ${category}` : ''}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) return setStatus('❌ Липсва линк към статия.');
    openReader(href);
  });

  return card;
}

// Импорт по URL (автоматичен proxy fallback)
async function importURL(url) {
  if (!url) { setStatus('Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  try {
    const html = await fetchWithProxies(url);
    const doc = parseHTML(html);
    renderCardsFromDoc(doc, url);
    setStatus('');
  } catch (e) {
    setStatus('❌ CORS/HTTP грешка: ' + e.message);
  }
}

// Рендер на картите
function renderCardsFromDoc(doc, baseHref) {
  const listEl = $('#list');
  listEl.innerHTML = '';
  const raw = selectRawBlocks(doc);
  if (!raw.length) {
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }
  raw.forEach(node => listEl.appendChild(toCardElement(node.outerHTML, baseHref)));
  populateCategories();
}
