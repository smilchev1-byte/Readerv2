// ==========================
// parser.js — стабилна версия (Capital + други)
// ==========================

// селектори, които Капитал и Дневник използват реално
const SELECTORS = 'div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3';

function selectRawBlocks(doc){
  return Array.from(doc.querySelectorAll(SELECTORS));
}

function toCardElement(rawHTML, baseHref){
  const fragDoc = parseHTML('<div id="wrap">'+rawHTML+'</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  // изображение
  const img = wrap.querySelector('img');
  const imgSrc = img?.getAttribute('src') || '';

  // заглавие
  const h = wrap.querySelector('h1,h2,h3');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || wrap.textContent || '(без заглавие)').trim();

  // линк
  const rawLink = (h?.querySelector('a[href]')?.getAttribute('href')) || wrap.querySelector('a[href]')?.getAttribute('href') || '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  // дата
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

  // категория
  const breadcrumb = wrap.querySelector('li.breadcrumb-item.d-lg-inline.mb-1');
  const category = breadcrumb ? breadcrumb.textContent.trim() : '';

  let source = '';
  try { source = new URL(baseHref).hostname.replace(/^www\./,''); } catch {}

  // създаване на картата
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

  // отваряне в reader
  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) { setStatus('❌ Липсва линк към статия.'); return; }
    openReader(href);
  });

  return card;
}

async function importURL(url){
  if(!url){ setStatus('Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  try{
    // ✅ използваме твоя Cloudflare proxy (по-надеждно от allorigins)
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

function renderCardsFromDoc(doc, baseHref){
  const listEl = $('#list');
  listEl.innerHTML = '';

  const raw = selectRawBlocks(doc);
  if(!raw.length){
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    setStatus('⚠ Няма намерени елементи (провери структурата).');
    return;
  }

  raw.forEach(node => listEl.appendChild(toCardElement(node.outerHTML, baseHref)));
  populateCategories();
  setStatus(`✔ Заредени статии: ${raw.length}`);
}