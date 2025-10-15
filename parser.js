// =========================
// parser.js (финална версия)
// =========================

// По-гъвкави селектори за различни сайтове
const SELECTORS = [
  'article',                     // OFFNews, Dnevnik, Mediapool
  '.article-item',               // Kapital, Dnevnik
  '.post',                       // bTV
  '.news-item',                  // OFFNews
  '.story',                      // BBC
  '.c-article',                  // Mediapool
  '.l-article',                  // други
].join(',');

function selectRawBlocks(doc){
  return Array.from(doc.querySelectorAll(SELECTORS));
}

function toCardElement(rawHTML, baseHref){
  const fragDoc = parseHTML('<div id="wrap">'+rawHTML+'</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  // Намиране на изображение
  const img = wrap.querySelector('img');
  const imgSrc = img?.getAttribute('src') || '';

  // Намиране на заглавие
  const h = wrap.querySelector('h1,h2,h3,h4');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || wrap.textContent || '(без заглавие)').trim();

  // Линк
  const rawLink = (h?.querySelector('a[href]')?.getAttribute('href')) || wrap.querySelector('a[href]')?.getAttribute('href') || '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  // Дата
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

  // Категория (ако има)
  const breadcrumb = wrap.querySelector('li.breadcrumb-item, .category, .news-category');
  const category = breadcrumb ? breadcrumb.textContent.trim() : '';

  // Източник (домен)
  let source = ''; 
  try { source = new URL(baseHref).hostname.replace(/^www\./,''); } catch {}

  // Карта
  const card = document.createElement('div');
  card.className = 'card-row';
  if (isoDate) card.dataset.date = isoDate;
  if (category) card.dataset.category = category;
  if (linkAbs) card.dataset.href = linkAbs;

  card.innerHTML = `
    <div class="thumb">${imgSrc?`<img src="${imgSrc}" alt="">`:'<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${title}</a></h3>
        ${formattedDate?`<div class="meta-date">🕒 ${formattedDate}</div>`:''}
      </div>
      <div class="meta">${source}${category?` • ${category}`:''}</div>
    </div>`;

  // Отваряне в четеца
  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) { setStatus('❌ Липсва линк към статия.'); return; }
    openReader(href);
  });

  return card;
}

// Импорт на URL (зареждане през твоя Cloudflare proxy)
async function importURL(url){
  if(!url){ setStatus('Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  try{
    // ✅ Използваме твоя Cloudflare Worker proxy
    const prox = `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}`;
    const res  = await fetch(prox, {mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const html = await res.text();

    const doc  = parseHTML(html);
    renderCardsFromDoc(doc, url);
    setStatus('');
  }catch(e){ 
    setStatus('❌ CORS/HTTP грешка: '+e.message); 
  }
}

// Рендиране на картите
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