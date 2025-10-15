// ============================
// ✅ parser.js — с изображения, филтри и безопасен reader hook
// ============================

// Безопасен селектор
const $ = s => document.querySelector(s);

// Помощни функции
function parseHTML(html){ return new DOMParser().parseFromString(html,'text/html'); }
function absURL(base, rel){ try{ return new URL(rel, base).href }catch{ return rel } }
function setStatus(msg){ const el = $('#status'); if(el) el.textContent = msg || ''; }

// Извличане на HTML чрез proxy (работи и в Safari)
async function fetchHTML(url){
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
  const res = await fetch(proxy, { cache:"no-store", mode:"cors" });
  if(!res.ok) throw new Error("HTTP "+res.status);
  return await res.text();
}

// Извличане на статии (<a class*="gtag-feed-statia">)
function extractFeedAnchors(doc, baseHref){
  const anchors = Array.from(doc.querySelectorAll('a[class*="gtag-feed-statia"]'));
  return anchors.map(a=>{
    const container = a.closest("article, li, div") || a.parentElement;
    const imgEl = container?.querySelector("img");
    const timeEl = container?.querySelector("time");
    const catEl = container?.querySelector(".category, .tag, .label, .news-category");

    return {
      href: absURL(baseHref, a.getAttribute("href") || ""),
      title: (a.textContent || a.getAttribute("title") || "").trim(),
      img: imgEl ? absURL(baseHref, imgEl.getAttribute("src") || "") : "",
      date: timeEl?.getAttribute("datetime") || timeEl?.textContent?.trim() || "",
      category: catEl?.textContent?.trim() || "",
      source: (()=>{ try{ return new URL(baseHref).hostname.replace(/^www\./,''); }catch{return '';} })()
    };
  }).filter(x=>x.href && x.title);
}

// Основна функция — зарежда новини по URL
async function importURL(url){
  if(!url){ setStatus('❌ Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');

  const listEl = $('#list');
  if(!listEl){ console.warn('⚠️ #list липсва в DOM'); return; }
  listEl.innerHTML = '';

  try{
    const html = await fetchHTML(url);
    const doc = parseHTML(html);
    const items = extractFeedAnchors(doc, url);

    if(!items.length){
      listEl.innerHTML = '<div class="placeholder">Няма намерени статии.</div>';
      setStatus('');
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((it,i)=>frag.appendChild(toCardElement(it,i)));
    listEl.appendChild(frag);

    populateCategories();
    setStatus('');
  }catch(e){
    console.error(e);
    setStatus('❌ Грешка при зареждане: '+e.message);
    const listEl = $('#list');
    if(listEl) listEl.innerHTML = `<div class="placeholder">❌ ${e.message}</div>`;
  }
}

// Създава карта за статия
function toCardElement(item,i){
  const card = document.createElement('div');
  card.className = 'card-row';
  card.dataset.href = item.href;
  if(item.date) card.dataset.date = item.date;
  if(item.category) card.dataset.category = item.category;

  const formattedDate = item.date ? new Date(item.date).toLocaleDateString('bg-BG',{dateStyle:'medium'}) : '';

  card.innerHTML = `
    <div class="thumb">
      ${item.img ? `<img src="${item.img}" alt="thumb">` : `<span>${i+1}</span>`}
    </div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${item.title}</a></h3>
        ${formattedDate ? `<div class="meta-date">🕒 ${formattedDate}</div>` : ''}
      </div>
      <div class="meta">${item.source}${item.category ? ` • ${item.category}` : ''}</div>
    </div>`;

  const link = card.querySelector('a');
  link.addEventListener('click', e=>{
    e.preventDefault();
    if(typeof openReader === 'function'){
      openReader(item.href, item.title);
    }else{
      console.warn('⚠️ openReader() не е дефиниран.');
    }
  });

  return card;
}

// === Филтри ===
const catSel = $('#categorySelect');
function populateCategories(){
  if(!catSel) return;
  const cats = new Set();
  document.querySelectorAll('.card-row[data-category]').forEach(c=>{
    const val = c.dataset.category;
    if(val) cats.add(val);
  });
  catSel.innerHTML = '<option value="all">Всички</option>' +
    [...cats].map(c=>`<option value="${c}">${c}</option>`).join('');
}
if(catSel){
  catSel.addEventListener('change',()=>{
    const sel = catSel.value;
    document.querySelectorAll('.card-row').forEach(c=>{
      c.style.display = (sel==='all' || c.dataset.category===sel)?'':'none';
    });
  });
}

// === Датови филтри ===
document.querySelectorAll('.chip').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    applyDateFilter(b.dataset.filter);
  });
});

function applyDateFilter(f){
  const now = new Date();
  document.querySelectorAll('.card-row').forEach(c=>{
    const d = new Date(c.dataset.date);
    let show = true;
    if(f==='today') show = d.toDateString()===now.toDateString();
    if(f==='week') show = (now-d)/(1000*60*60*24)<=7;
    if(f==='month') show = (now-d)/(1000*60*60*24)<=31;
    c.style.display = show?'':'none';
  });
}
