// ============================
// ✅ parser.js — стабилен, без кеш, без объркване между секции
// (максимално близо до предишната ти логика)
// ============================

const SELECTORS = [
  'article',
  '.article-item',
  '.post',
  '.news-item',
  '.story',
  '.c-article',
  '.l-article'
].join(',');

// ——— вътрешно anti-race id, за да игнорираме по-стари отговори
let __newsReqId = 0;

// Избира raw блоковете със статии от HTML
function selectRawBlocks(doc){
  return Array.from(doc.querySelectorAll(SELECTORS));
}

// Карта от raw HTML
function toCardElement(rawHTML, baseHref){
  const fragDoc = parseHTML('<div id="wrap">'+rawHTML+'</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const img = wrap.querySelector('img');
  const imgSrc = img?.getAttribute('src') || '';

  const h = wrap.querySelector('h1,h2,h3,h4');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || '(без заглавие)').trim();

  const rawLink = (h?.querySelector('a[href]')?.getAttribute('href')) || wrap.querySelector('a[href]')?.getAttribute('href') || '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  let isoDate = '', formattedDate = '';
  const t = wrap.querySelector('time[datetime]') || wrap.querySelector('meta[property="article:published_time"]');
  const dateText = t ? (t.getAttribute('datetime') || t.content || '') : '';
  if (dateText) {
    const d = new Date(dateText);
    if (!isNaN(d)) {
      isoDate = d.toISOString();
      formattedDate = d.toLocaleString('bg-BG',{dateStyle:'medium', timeStyle:'short'});
    }
  }

  // опит за категория (ако има)
  const breadcrumb = wrap.querySelector('li.breadcrumb-item, .category, .news-category');
  const category = breadcrumb ? breadcrumb.textContent.trim() : '';

  let source = '';
  try { source = new URL(baseHref).hostname.replace(/^www\./,''); } catch {}

  const card = document.createElement('div');
  card.className = 'card-row';
  if (isoDate) card.dataset.date = isoDate;
  if (category) card.dataset.category = category;
  if (linkAbs) card.dataset.href = linkAbs;

  card.innerHTML = `
    <div class="thumb">${imgSrc ? `<img src="${imgSrc}" alt="">` : '<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title">
          <a href="${linkAbs || '#'}" target="_blank" rel="noopener noreferrer" style="cursor:pointer">${title}</a>
        </h3>
        ${formattedDate ? `<div class="meta-date">🕒 ${formattedDate}</div>` : ''}
      </div>
      <div class="meta">${source}${category?` • ${category}`:''}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) { setStatus('❌ Липсва линк към статия.'); return; }
    openReader(href);
  });

  return card;
}

// Импорт по URL — стабилен, без кеш + fallback proxy
async function importURL(url){
  if(!url){ setStatus('Невалиден URL.'); return; }
  const reqId = ++__newsReqId;

  setStatus('⏳ Зареждам новини…');
  const listEl = $('#list');
  listEl.innerHTML = '';

  // добавяме cache-buster към самия URL (за секции на един и същ домейн)
  const targetURL = new URL(url, location.href);
  targetURL.searchParams.set('_ts', Date.now().toString());

  // proxy в този ред (макс. близо до твоята логика)
  const chain = [
    // твой Cloudflare Worker (ако е активен)
    (u) => `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(u)}&nocache=${Date.now()}`,
    // Codetabs
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    // AllOrigins
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
  ];

  let html = '';
  let lastErr = null;

  for (const make of chain) {
    const prox = make(targetURL.href);
    try {
      const res = await fetch(prox, {
        mode: 'cors',
        cache: 'reload',
        credentials: 'omit',
        headers: {
          'pragma': 'no-cache',
          'cache-control': 'no-cache'
        }
      });
      if (!res.ok) throw new Error('HTTP '+res.status);
      const text = await res.text();
      if (!text || text.length < 64) throw new Error('Празен отговор');
      html = text;
      break;
    } catch (e) {
      lastErr = e;
      // пробваме следващия proxy
    }
  }

  if (!html) {
    setStatus('❌ CORS/HTTP грешка: ' + (lastErr?.message || lastErr || 'неизвестна'));
    return;
  }

  // ако междувременно е стартирана нова заявка — игнорирай тази
  if (reqId !== __newsReqId) return;

  try{
    const doc = parseHTML(html);
    renderCardsFromDoc(doc, targetURL.href);
    setStatus('');
  }catch(e){
    setStatus('❌ Грешка при парсване: '+e.message);
  }
}

// Рендер на картите
function renderCardsFromDoc(doc, baseHref){
  const listEl = $('#list');
  listEl.innerHTML = '';
  const raw = selectRawBlocks(doc);
  if(!raw.length){
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }
  raw.forEach(node => listEl.appendChild(toCardElement(node.outerHTML, baseHref)));
  populateCategories();
}
