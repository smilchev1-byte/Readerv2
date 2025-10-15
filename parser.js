// ==========================
// parser.js — Capital.bg и общи сайтове
// ==========================

// fallback за SELECTORS, ако utils.js не е зареден
if (typeof SELECTORS === 'undefined')
  var SELECTORS = 'div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3';

// -------- ОБЩИ ФУНКЦИИ --------

function selectRawBlocks(doc) {
  return Array.from(doc.querySelectorAll(SELECTORS));
}

function toCardElement(rawHTML, baseHref) {
  const fragDoc = parseHTML('<div id="wrap">' + rawHTML + '</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const img = wrap.querySelector('img');
  const imgSrc = img?.getAttribute('src') || '';

  const a = wrap.querySelector('a[href]');
  const linkAbs = a ? absURL(baseHref, a.getAttribute('href')) : '';
  const title = (a?.getAttribute('title') || a?.textContent || '(без заглавие)').trim();

  const time = wrap.querySelector('time[datetime]');
  let isoDate = '', formattedDate = '';
  if (time) {
    const d = new Date(time.getAttribute('datetime'));
    if (!isNaN(d)) {
      isoDate = d.toISOString();
      formattedDate = d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
    }
  }

  let category = '';
  const cat = wrap.querySelector('.breadcrumb-item');
  if (cat) category = cat.textContent.trim();

  const card = document.createElement('div');
  card.className = 'card-row';
  if (isoDate) card.dataset.date = isoDate;
  if (category) card.dataset.category = category;
  if (linkAbs) card.dataset.href = linkAbs;

  card.innerHTML = `
    <div class="thumb">${imgSrc ? `<img src="${imgSrc}" alt="">` : '<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${title}</a></h3>
        ${formattedDate ? `<div class="meta-date">🕒 ${formattedDate}</div>` : ''}
      </div>
      <div class="meta">capital.bg${category ? ' • ' + category : ''}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    if (!linkAbs) return setStatus('❌ Липсва линк към статия.');
    openReader(linkAbs);
  });

  return card;
}

// -------- СПЕЦИАЛЕН ПАРСЪР ЗА CAPITAL.BG --------

function extractCapitalArticles(doc, baseHref) {
  // Търсим блоковете по структурата от снимката
  const blocks = Array.from(doc.querySelectorAll('div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3'));
  if (!blocks.length) return [];

  return blocks.map(block => {
    const a = block.querySelector('a.stretched-link.gtag-feed-statia[href]');
    if (!a) return null;

    const link = absURL(baseHref, a.getAttribute('href'));
    const title = a.getAttribute('title') || a.textContent.trim() || '(без заглавие)';
    const img = block.querySelector('img')?.getAttribute('src') || '';
    const time = block.querySelector('time')?.getAttribute('datetime') || '';
    const d = time ? new Date(time) : null;
    const iso = d && !isNaN(d) ? d.toISOString() : '';
    const fDate = d && !isNaN(d) ? d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }) : '';

    const card = document.createElement('div');
    card.className = 'card-row';
    if (iso) card.dataset.date = iso;
    card.dataset.href = link;

    card.innerHTML = `
      <div class="thumb">${img ? `<img src="${img}" alt="">` : '<span>no image</span>'}</div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title"><a href="#">${title}</a></h3>
          ${fDate ? `<div class="meta-date">🕒 ${fDate}</div>` : ''}
        </div>
        <div class="meta">capital.bg</div>
      </div>`;

    card.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      openReader(link);
    });

    return card;
  }).filter(Boolean);
}

// -------- ИМПОРТ И ВИЗУАЛИЗАЦИЯ --------

async function importURL(url) {
  if (!url) {
    setStatus('Невалиден URL.');
    return;
  }
  setStatus('⏳ Зареждам новини…');
  try {
    const prox = `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const doc = parseHTML(html);
    renderCardsFromDoc(doc, url);
    setStatus('');
  } catch (e) {
    setStatus('❌ CORS/HTTP грешка: ' + e.message);
  }
}

function renderCardsFromDoc(doc, baseHref) {
  const listEl = $('#list');
  listEl.innerHTML = '';

  let cards = [];

  if (baseHref.includes('capital.bg')) {
    cards = extractCapitalArticles(doc, baseHref);
  } else {
    const raw = selectRawBlocks(doc);
    cards = raw.map(node => toCardElement(node.outerHTML, baseHref));
  }

  if (!cards.length) {
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }

  cards.forEach(card => listEl.appendChild(card));
  populateCategories();
}