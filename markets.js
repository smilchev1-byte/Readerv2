// ============================
// markets.js — Yahoo Finance чрез allorigins
// ============================

const MARKET_CATEGORIES = {
  stocks: ['AAPL','MSFT','NVDA','AMZN','GOOG'],
  etfs: ['SPY','QQQ','VTI','VGK','EEM'],
  crypto: ['BTC-USD','ETH-USD','SOL-USD','ADA-USD','XRP-USD']
};

async function loadMarketsSidebar() {
  const sidebarEl = $('#sidebar');
  try {
    const html = await fetch('./markets.html').then(r=>r.text());
    sidebarEl.innerHTML = html;
    sidebarEl.querySelectorAll('[data-market]').forEach(btn=>{
      btn.classList.add('cat');
      btn.addEventListener('click',()=>{
        sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        renderMarketDropdown(btn.dataset.market);
      });
    });
    sidebarEl.querySelector('[data-market="stocks"]')?.click();
  } catch (e) {
    sidebarEl.innerHTML = `<div class="placeholder">❌ ${e.message}</div>`;
  }
}

function renderMarketDropdown(categoryKey) {
  const container = $('#marketFilters'), listEl = $('#list');
  container.innerHTML = ''; listEl.innerHTML = '<div class="placeholder">Избери актив.</div>';
  const items = MARKET_CATEGORIES[categoryKey]; if (!items) return;

  const label = document.createElement('label');
  label.textContent = 'Избери актив:'; label.className = 'market-label';
  const select = document.createElement('select');
  select.id = 'symbolSelect'; select.className = 'market-dropdown';
  items.forEach(sym => { const o=document.createElement('option'); o.value=sym; o.textContent=sym; select.appendChild(o); });
  container.append(label, select); container.style.display='block';
  select.addEventListener('change',()=>fetchSingleMarketData(select.value));
  fetchSingleMarketData(select.value);
}

async function fetchSingleMarketData(symbol) {
  setStatus(`⏳ Зареждам ${symbol}...`);
  const listEl = $('#list'); listEl.innerHTML = '';
  try {
    const yahooURL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const proxURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooURL)}`;
    const res = await fetch(proxURL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const data = JSON.parse(text);
    const result = data?.quoteResponse?.result?.[0];
    if (!result) throw new Error('Няма резултат от Yahoo');
    renderMarketCard(result);
    setStatus('');
  } catch (e) {
    setStatus('❌ ' + e.message);
    listEl.innerHTML = '<div class="placeholder">Няма налични данни.</div>';
  }
}

function renderMarketCard(item) {
  const list = $('#list'); list.innerHTML = '';
  const sym = item.symbol || '-', name = item.shortName || item.longName || sym;
  const price = item.regularMarketPrice?.toFixed?.(2) || '-', ch = item.regularMarketChange||0;
  const perc = item.regularMarketChangePercent||0, up = ch>=0;
  const time = item.regularMarketTime ? new Date(item.regularMarketTime*1000).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}) : '';
  const div = document.createElement('div');
  div.className='card-row';
  div.innerHTML = `
    <div class="thumb"><span>${sym}</span></div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title">${name}</h3>
        <div class="meta-date">${time}</div>
      </div>
      <div class="meta">
        💰 <strong>${price}</strong>
        <span style="color:${up?'#4bff6b':'#ff4b4b'}">${up?'▲':'▼'} ${perc.toFixed(2)}%</span>
      </div>
    </div>`;
  list.appendChild(div);
}