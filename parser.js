// ==========================
// parser.js — Capital.bg deep fix (универсален)
// ==========================
if (typeof SELECTORS === 'undefined')
  var SELECTORS = 'div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3';

function selectRawBlocks(doc){
  return Array.from(doc.querySelectorAll(SELECTORS));
}

function extractCapitalArticles(doc, baseHref){
  const blocks = Array.from(
    doc.querySelectorAll('div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3')
  );
  const links = Array.from(
    doc.querySelectorAll('a.stretched-link[class*="gtag-feed-statia"]')
  );
  const all = blocks.length ? blocks : links.map(l => l.closest('.card'));
  if (!all.length) return [];

  return all.map(block=>{
    if(!block) return null;
    const a = block.querySelector('a.stretched-link[class*="gtag-feed-statia"]');
    if(!a) return null;
    const link = absURL(baseHref,a.getAttribute('href'));
    const title = a.getAttribute('title') || a.textContent.trim() || '(без заглавие)';
    const img = block.querySelector('img')?.src || '';
    const time = block.querySelector('time')?.getAttribute('datetime') || '';
    const d = time?new Date(time):null;
    const iso = d && !isNaN(d)?d.toISOString():'';
    const fDate = d && !isNaN(d)?d.toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}):'';

    const card=document.createElement('div');
    card.className='card-row';
    if(iso) card.dataset.date=iso;
    card.dataset.href=link;
    card.innerHTML=`
      <div class="thumb">${img?`<img src="${img}" alt="">`:'<span>no image</span>'}</div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title"><a href="#">${title}</a></h3>
          ${fDate?`<div class="meta-date">🕒 ${fDate}</div>`:''}
        </div>
        <div class="meta">capital.bg</div>
      </div>`;
    card.querySelector('a').addEventListener('click',e=>{
      e.preventDefault(); openReader(link);
    });
    return card;
  }).filter(Boolean);
}

async function importURL(url){
  if(!url){setStatus('Невалиден URL.');return;}
  setStatus('⏳ Зареждам новини…');
  try{
    const prox=`https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}`;
    const res=await fetch(prox,{mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const html=await res.text();
    const doc=parseHTML(html);
    renderCardsFromDoc(doc,url);
  }catch(e){ setStatus('❌ CORS/HTTP грешка: '+e.message); }
}

function renderCardsFromDoc(doc, baseHref){
  const listEl=$('#list'); listEl.innerHTML='';
  let cards=[];
  if(baseHref.includes('capital.bg')){
    cards=extractCapitalArticles(doc,baseHref);
    setStatus(cards.length?`✔ Намерени: ${cards.length}`:'⚠ Не намерих статии (capital.bg).');
  }else{
    const raw=selectRawBlocks(doc);
    cards=raw.map(n=>toCardElement(n.outerHTML,baseHref));
    setStatus(cards.length?`✔ Елементи: ${cards.length}`:'⚠ Няма намерени.');
  }
  if(!cards.length){
    listEl.innerHTML='<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }
  cards.forEach(c=>listEl.appendChild(c));
  populateCategories();
}