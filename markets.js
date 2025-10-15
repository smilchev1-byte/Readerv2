// ==========================
// markets.js — Yahoo Finance базов инструмент
// ==========================

// Списък с активи, които ще показваме
const MARKET_SYMBOLS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'NASDAQ' },
  { symbol: 'AAPL', label: 'Apple' },
  { symbol: 'MSFT', label: 'Microsoft' },
  { symbol: 'EURUSD=X', label: 'EUR/USD' },
  { symbol: 'BTC-USD', label: 'Bitcoin' },
  { symbol: 'GC=F', label: 'Gold' }
];

async function fetchMarketData(){
  setStatus('⏳ Зареждам пазарни данни...');
  try{
    const symbols = MARKET_SYMBOLS.map(x=>x.symbol).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const prox = `https://tight-wildflower-8f1a.s-milchev1.workers.dev/?url=${encodeURIComponent(url)}`;
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
    const label = MARKET_SYMBOLS.find(x=>x.symbol===item.symbol)?.label || item.symbol;
    const price = item.regularMarketPrice?.toFixed(2) || '-';
    const change = item.regularMarketChange?.toFixed(2) || 0;
    const percent = item.regularMarketChangePercent?.toFixed(2) || 0;
    const up = change >= 0;

    const card = document.createElement('div');
    card.className = 'card-row';
    card.innerHTML = `
      <div class="thumb"><span>${label}</span></div>
      <div class="right-side">
        <div class="header-row">
          <h3 class="title">${item.shortName || label}</h3>
          <div class="meta-date">${new Date(item.regularMarketTime*1000).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})}</div>
        </div>
        <div class="meta">
          💰 Цена: <strong>${price}</strong>  
          <span style="color:${up?'#4bff6b':'#ff4b4b'}">(${percent}% ${up?'▲':'▼'})</span>
        </div>
      </div>`;
    listEl.appendChild(card);
  });
}