// ==========================
// markets.js — динамичен sidebar + Yahoo Finance данни
// ==========================

async function fetchMarketData(symbols){
  if(!symbols || !symbols.length){
    $('#list').innerHTML = '<div class="placeholder">Избери поне един актив.</div>';
    return;
  }

  setStatus('⏳ Зареждам пазарни данни...');
  try{
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox, {mode:'cors'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    renderMarketCards(json.quoteResponse.result);
    setStatus('');
  }catch(e){
    setStatus('❌ Грешка при зареждане: '+e.message);
  }
}

function renderMarketCards(data){
  const listEl = $('#list');
  listEl.innerHTML = '';
  if(!data || !data.length){
    listEl.innerHTML = '<div class="placeholder">Няма пазарни данни.</div>';
    return;
  }

  data.forEach(item=>{
    const price = item.regularMarketPrice?.toFixed(2) || '-';
    const change = item.regularMarketChange?.toFixed(2) || 0;
    const percent = item.regularMarketChangePercent?.toFixed(2) || 0;
    const up = change >= 0;

    const card = document.createElement('div');
    card.className = 'card-row';
    card.innerHTML = `
      <div class="thumb"><span>${item.symbol}</span></div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title">${item.shortName || item.symbol}</h3>
          <div class="meta-date">${new Date(item.regularMarketTime*1000).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})}</div>
        </div>
        <div class="meta">
          💰 <strong>${price}</strong> 
          <span style="color:${up?'#4bff6b':'#ff4b4b'}">${up?'▲':'▼'} ${percent}%</span>
        </div>
      </div>`;
    listEl.appendChild(card);
  });
}

// зареждане на sidebar
async function loadMarketsSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const html = await fetch('./markets.html').then(r=>r.text());
    sidebarEl.innerHTML = html;

    const checkboxes = sidebarEl.querySelectorAll('input[type=checkbox]');
    function updateSelection(){
      const active = Array.from(checkboxes).filter(cb=>cb.checked).map(cb=>cb.dataset.symbol);
      fetchMarketData(active);
    }
    checkboxes.forEach(cb=>cb.addEventListener('change', updateSelection));
    updateSelection(); // първоначално зареждане
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя пазари<br>${err.message}</div>`;
  }
}

// достъпно глобално
window.loadMarketsSidebar = loadMarketsSidebar;