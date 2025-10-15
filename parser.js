// ==========================
// parser.js (финална версия)
// ==========================

// Избор на елементи за общите сайтове (Darik, bTV, Dnevnik, OFFNews, Mediapool и др.)
function selectRawBlocks(doc) {
  return Array.from(doc.querySelectorAll(SELECTORS));
}

// Създаване на карта (карта = визуален елемент в списъка)
function toCardElement(rawHTML, baseHref) {
  const fragDoc = parseHTML('<div id="wrap">' + rawHTML + '</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const img = wrap.querySelector('img');
  const imgSrc = img?.getAttribute('src') || '';

  const h = wrap.querySelector('h1,h2,h3');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || wrap.textContent || '(без заглавие)').trim();

  const rawLink =
    (h?.querySelector('a[href]')?.getAttribute('href')) ||
    wrap.querySelector('a[href]')?.getAttribute('href') ||
    '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  let isoDate = '',
    formattedDate = '';
  const t = wrap.querySelector('time[datetime]') || wrap.querySelector('meta[property="article:published_time"]');
  const dateText = t ? t.getAttribute('datetime') || t.content || '' : '';
  if (dateText) {
    const d = new Date(dateText);
    if (!isNaN(d)) {
      isoDate = d.toISOString();
      formattedDate = d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
    }
  }

  const breadcrumb = wrap.querySelector('li.breadcrumb-item.d-lg-inline.mb-1');
  const category = breadcrumb ? breadcrumb.textContent.trim() : '';

  let source = '';
  try {
    source = new URL(baseHref).hostname.replace(/^www\./, '');
  } catch {}

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
      <div class="meta">${source}${category ? ` • ${category}` : ''}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) {
      setStatus('❌ Липсва линк към статия.');
      return;
    }
    openReader(href);
  });

  return card;
}

// ===============================
// Специален парсър за Capital.bg
// ===============================

function extractCapitalArticles(doc, baseHref) {
  const items = Array.from(
    doc.querySelectorAll(
      '.article-item a.stretched-link[href*="/biznes/"], .article-item a.stretched-link[href*="/politika/"], .article-item a.stretched-link[href*="/pazari/"]'
    )
  );

  const list = [];

  for (const a of items) {
    const link = absURL(baseHref, a.getAttribute('href'));
    const title = a.getAttribute('title') || a.textContent.trim() || '(без заглавие)';
    const parent = a.closest('.article-item');
    const img = parent?.querySelector('img')?.src || '';
    const time = parent?.querySelector('time')?.getAttribute('datetime') || '';
    const d = time ? new Date(time) : null;
    const dateISO = d && !isNaN(d) ? d.toISOString() : '';
    const dateStr = d && !isNaN(d) ? d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }) : '';

    // създаваме карта 1:1 като останалите
    const card = document.createElement('div');
    card.className = 'card-row';
    if (dateISO) card.dataset.date = dateISO;
    card.dataset.href = link;

    card.innerHTML = `
      <div class="thumb">${img ? `<img src="${img}" alt="">` : '<span>no image</span>'}</div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title"><a href="#">${title}</a></h3>
          ${dateStr ? `<div class="meta-date">🕒 ${dateStr}</div>` : ''}
        </div>
        <div class="meta">capital.bg • Пазари</div>
      </div>`;

    card.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      openReader(link);
    });

    list.push(card);
  }

  return list;
}

// ===============================
// Импорт и визуализация
// ===============================

async function importURL(url) {
  if (!url) {
    setStatus('Невалиден URL.');
    return;
  }
  setStatus('⏳ Зареждам новини…');
  try {
    // ✅ използваме твоя Cloudflare Worker proxy
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

  // специален случай за Capital.bg
  if (baseHref.includes('capital.bg')) {
    cards = extractCapitalArticles(doc, baseHref);
  } else {
    const raw = selectRawBlocks(doc);
    cards = raw.map((node) => toCardElement(node.outerHTML, baseHref));
  }

  if (!cards.length) {
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }

  cards.forEach((card) => listEl.appendChild(card));
  populateCategories();
}