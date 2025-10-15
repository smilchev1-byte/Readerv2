// ==========================
// parser.js — deep fix (Capital + general)
// ==========================

// fallback за SELECTORS, ако utils.js не е зареден
if (typeof SELECTORS === 'undefined')
  var SELECTORS = 'div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3';

// ---------- helpers (robust) ----------
function pickImageURL(node){
  if(!node) return '';
  // 1) <img src>
  const img = node.querySelector('img');
  if (img){
    const srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset') || '';
    // вземаме първия URL от srcset, ако има
    if (srcset){
      const first = srcset.split(',')[0].trim().split(/\s+/)[0];
      if (first) return first;
    }
    const ds = img.getAttribute('data-src');
    if (ds) return ds;
    const s = img.getAttribute('src');
    if (s) return s;
  }
  // 2) <source srcset> в <picture>
  const src = node.querySelector('source[srcset], source[data-srcset]');
  if (src){
    const ss = src.getAttribute('data-srcset') || src.getAttribute('srcset') || '';
    if (ss){
      const first = ss.split(',')[0].trim().split(/\s+/)[0];
      if (first) return first;
    }
  }
  return '';
}

function formatDateISOtoBG(iso){
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleString('bg-BG', {dateStyle:'medium', timeStyle:'short'});
}

// ---------- общата ти логика ----------
function selectRawBlocks(doc){
  return Array.from(doc.querySelectorAll(SELECTORS));
}

function toCardElement(rawHTML, baseHref){
  const fragDoc = parseHTML('<div id="wrap">'+rawHTML+'</div>');
  const wrap = fragDoc.getElementById('wrap');
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const imgSrc = pickImageURL(wrap);

  const h = wrap.querySelector('h1,h2,h3');
  const title = (h?.textContent || wrap.querySelector('a[href]')?.textContent || wrap.textContent || '(без заглавие)').trim();

  const rawLink = (h?.querySelector('a[href]')?.getAttribute('href')) || wrap.querySelector('a[href]')?.getAttribute('href') || '';
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : '';

  let isoDate = '', formattedDate = '';
  const t = wrap.querySelector('time[datetime], meta[property="article:published_time"]');
  const dateText = t ? (t.getAttribute?.('datetime') || t.content || '') : '';
  if (dateText) {
    const d = new Date(dateText);
    if (!isNaN(d)) { isoDate = d.toISOString(); formattedDate = formatDateISOtoBG(isoDate); }
  }

  let source = ''; try { source = new URL(baseHref).hostname.replace(/^www\./,''); } catch {}

  const card = document.createElement('div');
  card.className = 'card-row';
  if (isoDate) card.dataset.date = isoDate;
  if (linkAbs) card.dataset.href = linkAbs;

  card.innerHTML = `
    <div class="thumb">${imgSrc?`<img src="${imgSrc}" alt="">`:'<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${title}</a></h3>
        ${formattedDate?`<div class="meta-date">🕒 ${formattedDate}</div>`:''}
      </div>
      <div class="meta">${source}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    const href = card.dataset.href || '';
    if (!href) { setStatus('❌ Липсва линк към статия.'); return; }
    openReader(href);
  });

  return card;
}

// ---------- специален парсър за capital.bg ----------
function extractCapitalArticles(doc, baseHref){
  // 1) директно всички <a> с клас, съдържащ "gtag-feed-statia"
  let anchors = Array.from(doc.querySelectorAll('a.stretched-link[href][class*="gtag-feed-statia"]'));

  // 2) ако по някаква причина няма, пробваме през блоковете .card.pt-4.pb-4.ad0/.ad3
  if (!anchors.length){
    const blocks = Array.from(doc.querySelectorAll('div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3'));
    anchors = blocks.map(b => b.querySelector('a.stretched-link[href][class*="gtag-feed-statia"]')).filter(Boolean);
  }

  const cards = [];

  for (const a of anchors){
    const parent = a.closest('.card') || a.closest('.article-item') || a.parentElement;
    const link = absURL(baseHref, a.getAttribute('href'));
    const title = (a.getAttribute('title') || a.textContent || '(без заглавие)').trim();

    // картинка (robust)
    const imgSrc = pickImageURL(parent || a);

    // дата
    let iso = '';
    const t = (parent && parent.querySelector('time[datetime]')) || null;
    if (t){
      const d = new Date(t.getAttribute('datetime'));
      if(!isNaN(d)) iso = d.toISOString();
    }
    const fDate = formatDateISOtoBG(iso);

    const card = document.createElement('div');
    card.className = 'card-row';
    if (iso) card.dataset.date = iso;
    card.dataset.href = link;

    card.innerHTML = `
      <div class="thumb">${imgSrc?`<img src="${imgSrc}" alt="">`:'<span>no image</span>'}</div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title"><a href="#">${title}</a></h3>
          ${fDate?`<div class="meta-date">🕒 ${fDate}</div>`:''}
        </div>
        <div class="meta">capital.bg</div>
      </div>`;

    card.querySelector('a').addEventListener('click', e=>{
      e.preventDefault();
      openReader(link);
    });

    cards.push(card);
  }

  return cards;
}

// ---------- импорт и визуализация ----------
async function importURL(url){
  if(!url){ setStatus('Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  try{
    const prox = `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}`;
    const res  = await fetch(prox, {mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const html = await res.text();
    const doc  = parseHTML(html);
    renderCardsFromDoc(doc, url);
  }catch(e){
    setStatus('❌ CORS/HTTP грешка: '+e.message);
  }
}

function renderCardsFromDoc(doc, baseHref){
  const listEl = $('#list'); listEl.innerHTML = '';

  let cards = [];
  if (baseHref.includes('capital.bg')) {
    cards = extractCapitalArticles(doc, baseHref);
    setStatus(cards.length ? `✔ Намерени статии: ${cards.length}` : '⚠ Няма намерени елементи (capital.bg).');
  } else {
    const raw = selectRawBlocks(doc);
    cards = raw.map(node => toCardElement(node.outerHTML, baseHref));
    setStatus(cards.length ? `✔ Намерени елементи: ${cards.length}` : '⚠ Няма намерени елементи.');
  }

  if (!cards.length){
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }
  cards.forEach(c => listEl.appendChild(c));
  populateCategories();
}