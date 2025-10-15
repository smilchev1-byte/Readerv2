// ==========================
// markets.js — секция „Пазари“ с категории, филтри и Yahoo Finance API
// ==========================

// Примерни активи по категории
const MARKET_CATEGORIES = {
  stocks: [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOG', name: 'Alphabet' },
  ],
  etfs: [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'NASDAQ 100' },
    { symbol: 'VTI', name: 'Total US Market' },
    { symbol: 'VGK', name: 'Europe' },
    { symbol: 'EEM', name: 'Emerging Markets' },
  ],
  crypto: [
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'XRP-USD', name: 'XRP' },
  ]
};

// --- Създава филтрите според избраната категория
function renderMarketFilters(categoryKey){
  const container = document.getElementById('marketFilters');
  container.innerHTML = '';

  const items = MARKET_CATEGORIES[categoryKey];
  if (!items){
    container.innerHTML = '<div class="placeholder">Избери категория от менюто.</div>';
    return;
  }

  const section = document.createElement('div');
  section.className = 'market-section';

  const title = document.createElement('h4');
  title.textContent = categoryKey === 'stocks' ? '📈 Акции' :
                      categoryKey === 'etfs' ? '💹 ETF-и' :
                      '💰 Криптовалути';
  section.appendChild(title);

  items.forEach(({symbol, name})=>{
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" checked data-symbol="${symbol}"> ${name} (${symbol})`;
    section.appendChild(label);
  });

  container.appendChild(section);
  container.style.display = 'block';

  const checkboxes = container.querySelectorAll('input[type=checkbox]');
  function updateSelection(){
    const active = Array.from(checkboxes)
      .filter(cb=>cb.checked)
      .map(cb=>cb.dataset.symbol);
    fetchMarketData(active);
  }
  checkboxes.forEach(cb=>cb.addEventListener('change', updateSelection));
  updateSelection();
}

// --- Зареждане на пазарни данни от Yahoo Finance
async function fetchMarketData(symbols){
  const listEl = document.getElementById('list');
  if(!symbols.length){
    listEl.innerHTML = '<div class="placeholder">Избери поне един актив.</div>';
    return;
  }

  setStatus('⏳ Зареждам пазарни данни...');
  try{
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox, { mode: 'cors' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();

    // 💡 Универсално извличане на резултати
    const result =
      data?.quoteResponse?.result ||
      data?.result ||
      (Array.isArray(data) ? data : []);

    if (!result || !result.length)
      throw new Error('Празен резултат от API.');

    renderMarketCards(result);
    setStatus('');
  }catch(err){
    setStatus('❌ Грешка: '+err.message);
    console.error('Market fetch error', err);
  }
}

// --- Визуализация на пазарните карти
function renderMarketCards(data){
  const list = document.getElementById('list');
  list.innerHTML = '';

  if(!data || !data.length){
    list.innerHTML = '<div class="placeholder">Няма пазарни данни.</div>';
    return;
  }

  data.forEach(item=>{
    const symbol = item.symbol || '-';
    const name = item.shortName || item.longName || symbol;
    const price = item.regularMarketPrice?.toFixed?.(2) || '-';
    const change = item.regularMarketChange ?? 0;
    const percent = item.regularMarketChangePercent ?? 0;
    const up = change >= 0;
    const time = item.regularMarketTime
      ? new Date(item.regularMarketTime * 1000).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})
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
          <span style="color:${up?'#4bff6b':'#ff4b4b'}">
            ${up?'▲':'▼'} ${percent.toFixed(2)}%
          </span>
        </div>
      </div>`;
    list.appendChild(div);
  });
}

// --- Зареждане на sidebar (Stocks / ETFs / Crypto)
async function loadMarketsSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const html = await fetch('./markets.html').then(r=>r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-market]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        renderMarketFilters(btn.dataset.market);
      });
    });
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя пазари<br>${err.message}</div>`;
  }
}

// --- Експортираме функцията за main.js
window.loadMarketsSidebar = loadMarketsSidebar;