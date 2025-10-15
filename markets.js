// ==========================
// markets.js — Пазари с dropdown избор по символ
// ==========================

// Налични категории
const MARKET_CATEGORIES = {
  stocks: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG'],
  etfs: ['SPY', 'QQQ', 'VTI', 'VGK', 'EEM'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD']
};

// Зарежда sidebar за пазари
async function loadMarketsSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const html = await fetch('./markets.html').then(r=>r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-market]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        renderMarketDropdown(btn.dataset.market);
      });
    });
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}
window.loadMarketsSidebar = loadMarketsSidebar;

// Рендерира dropdown филтър за избраната категория
function renderMarketDropdown(categoryKey){
  const container = document.getElementById('marketFilters');
  const listEl = document.getElementById('list');
  container.innerHTML = '';
  listEl.innerHTML = '<div class="placeholder">Избери актив от списъка.</div>';

  const items = MARKET_CATEGORIES[categoryKey];
  if(!items){ container.innerHTML = '<div class="placeholder">Няма налични активи.</div>'; return; }

  const label = document.createElement('label');
  label.textContent = 'Избери актив:';
  label.className = 'market-label';

  const select = document.createElement('select');
  select.id = 'symbolSelect';
  select.className = 'market-dropdown';
  items.forEach(sym=>{
    const opt = document.createElement('option');
    opt.value = sym;
    opt.textContent = sym;
    select.appendChild(opt);
  });

  container.appendChild(label);
  container.appendChild(select);

  // При промяна
  select.addEventListener('change', ()=>{
    fetchSingleMarketData(select.value);
  });

  // По подразбиране първия
  fetchSingleMarketData(select.value);
}

// Изтегля данни за един символ от Yahoo
async function fetchSingleMarketData(symbol){
  setStatus(`⏳ Зареждам данни за ${symbol}...`);
  const listEl = document.getElementById('list');
  listEl.innerHTML = '';

  try{
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const proxUrl  = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    const res = await fetch(proxUrl);
    if(!res.ok) throw new Error('HTTP '+res.status);
    let data = await res.json();
    const item = data?.quoteResponse?.result?.[0];
    if(!item) throw new Error('Няма резултат от Yahoo');

    renderMarketCard(item);
    setStatus('');
  }catch(e){
    console.error(e);
    setStatus('❌ Грешка: '+e.message);
    listEl.innerHTML = '<div class="placeholder">Няма налични данни.</div>';
  }
}

// Визуализира картата за избрания актив
function renderMarketCard(item){
  const list = document.getElementById('list');
  list.innerHTML = '';

  const symbol  = item.symbol || '-';
  const name    = item.shortName || item.longName || symbol;
  const price   = item.regularMarketPrice?.toFixed?.(2) || '-';
  const change  = item.regularMarketChange ?? 0;
  const percent = item.regularMarketChangePercent ?? 0;
  const up      = change >= 0;
  const time    = item.regularMarketTime
    ? new Date(item.regularMarketTime*1000).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})
    : '';

  const div = document.createElement('div');
  div.className = 'card-row';
  div.innerHTML = `
    <div class="thumb"><span>${symbol}</span></div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title">${name}</h3>
        <div class="meta-date">${time}</div>
      </div>
      <div class="meta">
        💰 <strong>${price}</strong>
        <span style="color:${up ? '#4bff6b' : '#ff4b4b'}">
          ${up ? '▲' : '▼'} ${percent.toFixed(2)}%
        </span>
      </div>
    </div>`;
  list.appendChild(div);
}