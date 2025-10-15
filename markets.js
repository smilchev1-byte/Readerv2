// ==========================
// markets.js — пазарни данни + филтри в основната част
// ==========================

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

function renderMarketFilters(){
  const container = document.getElementById('marketFilters');
  container.innerHTML = '';

  Object.entries(MARKET_CATEGORIES).forEach(([key, items])=>{
    const section = document.createElement('div');
    section.className = 'market-section';

    const title = document.createElement('h4');
    title.textContent = key === 'stocks' ? '📈 Акции' :
                        key === 'etfs' ? '💹 ETF-и' :
                        '💰 Крипто';
    section.appendChild(title);

    items.forEach(({symbol, name})=>{
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" checked data-symbol="${symbol}"> ${name} (${symbol})`;
      section.appendChild(label);
    });

    container.appendChild(section);
  });

  container.style.display = 'block';

  const checkboxes = container.querySelectorAll('input[type=checkbox]');
  function updateSelection(){
    const active = Array.from(checkboxes).filter(cb=>cb.checked).map(cb=>cb.dataset.symbol);
    fetchMarketData(active);
  }
  checkboxes.forEach(cb=>cb.addEventListener('change', updateSelection));
  updateSelection();
}

async function fetchMarketData(symbols){
  if(!symbols.length){
    document.getElementById('list').innerHTML = '<div class="placeholder">Избери поне един актив.</div>';
    return;
  }

  setStatus('⏳ Зареждам пазарни данни...');
  try{
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    renderMarketCards(data.quoteResponse.result);
    setStatus('');
  }catch(err){
    setStatus('❌ Грешка: '+err.message);
  }
}

function renderMarketCards(data){
  const list = document.getElementById('list');
  list.innerHTML = '';
  if(!data || !data.length){
    list.innerHTML = '<div class="placeholder">Няма пазарни данни.</div>';
    return;
  }

  data.forEach(item=>{
    const price = item.regularMarketPrice?.toFixed(2) || '-';
    const change = item.regularMarketChange?.toFixed(2) || 0;
    const percent = item.regularMarketChangePercent?.toFixed(2) || 0;
    const up = change >= 0;

    const div = document.createElement('div');
    div.className = 'card-row';
    div.innerHTML = `
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
    list.appendChild(div);
  });
}

window.renderMarketFilters = renderMarketFilters;