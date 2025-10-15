// ============================
// parser.js — извличане по gtag-feed-statia* + интеграция със sidebar
// ============================

// Извличане на HTML през AllOrigins (без кеш)
async function fetchHTML(url){
  const api = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
  const res = await fetch(api, { cache: "no-store", mode: "cors", credentials: "omit" });
  if(!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

// Извлича елементи от списъчна страница: <a class*="gtag-feed-statia">
function extractFeedAnchors(doc, baseHref){
  const anchors = Array.from(doc.querySelectorAll('a[class*="gtag-feed-statia"]'));
  return anchors.map(a=>{
    const container = a.closest("article, li, div") || a.parentElement;
    const imgEl = container?.querySelector("img");
    const timeEl = container?.querySelector("time");
    const hrefRel = a.getAttribute("href") || "";
    const titleTxt = (a.textContent || a.getAttribute("title") || "").trim();
    return {
      href: absURL(baseHref, hrefRel),
      title: titleTxt || '(без заглавие)',
      img: imgEl ? absURL(baseHref, imgEl.getAttribute("src")||"") : "",
      date: timeEl?.getAttribute("datetime") || timeEl?.textContent?.trim() || ""
    };
  }).filter(x => x.href);
}

// Генерира карта (card-row) от item
function toCardElement(item, idx){
  const card = document.createElement('div');
  card.className = 'card-row';
  card.dataset.href = item.href;
  if (item.date) {
    const d = new Date(item.date);
    if (!isNaN(d)) card.dataset.date = d.toISOString();
  }

  const host = (()=>{ try{ return new URL(item.href).hostname.replace(/^www\./,''); }catch{ return '' } })();
  const fDate = item.date ? (()=>{ const d=new Date(item.date); return isNaN(d)?'':d.toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}) })() : '';

  card.innerHTML = `
    <div class="thumb">${item.img ? `<img src="${item.img}" alt="">` : `<span>${String(idx+1).padStart(2,'0')}</span>`}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
        ${fDate ? `<div class="meta-date">🕒 ${fDate}</div>` : ''}
      </div>
      <div class="meta">${host}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    openReader(item.href, item.title);
  });

  return card;
}

// Главна функция: зареждане от sidebar URL
async function importURL(url){
  if(!url){ setStatus('❌ Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  const listEl = $('#list');
  listEl.innerHTML = '';

  try{
    const html = await fetchHTML(url);
    const doc = parseHTML(html);
    const items = extractFeedAnchors(doc, url);

    if(!items.length){
      listEl.innerHTML = '<div class="placeholder">Няма намерени статии (gtag-feed-statia*).</div>';
      setStatus('');
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((it,i)=> frag.appendChild(toCardElement(it,i)));
    listEl.appendChild(frag);
    populateCategories();
    setStatus('');
  }catch(e){
    console.error(e);
    listEl.innerHTML = `<div class="placeholder">❌ Грешка при зареждане: ${e.message}</div>`;
    setStatus('❌ Грешка: ' + e.message);
  }
}
