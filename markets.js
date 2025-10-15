// ==========================
// markets.js — Пазари (по символ наведнъж, dropdown избор)
// ==========================

// Източници по категории
const MARKET_CATEGORIES = {
  stocks: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG'],
  etfs: ['SPY', 'QQQ', 'VTI', 'VGK', 'EEM'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD']
};

function renderMarketFilters(categoryKey) {
  const container = document.getElementById('marketFilters');
  container.innerHTML = '';

  const items = MARKET_CATEGORIES[categoryKey];
  if (!items) {
    container.innerHTML = '<div class="placeholder">Избери категория.</div>';
    return;
  }

  const label = document.createElement('label');
  label.textContent = 'Избери актив: ';
  label.style.display = 'block';
  label.style.marginBottom = '8px';

  const select = document.createElement('select');
  select.id = 'symbolSelect';
  select.style.padding = '8px';
  select.style.borderRadius = '8px';
  select.style.background = '#1e1e1e';
  select.style.color = '#fff';
  select.style.border = '1px solid #333';
  select.style.fontSize = '16px';

  items.forEach(sym => {
    const opt = document.createElement('option');
    opt.value = sym;
    opt.textContent = sym;
    select.appendChild(opt);
  });

  container.appendChild(label);
  container.appendChild(select);
  container.style.display = 'block';

  select.addEventListener('change', () => {
    fetchSingleMarketData(select.value);
  });

  // зарежда първия по подразбиране
  fetchSingleMarketData(select.value);
}

async function fetchSingleMarketData(symbol) {
  setStatus(`⏳ Зареждам данни за ${symbol}...`);
  const listEl = document.getElementById('list');
  listEl.innerHTML = '';

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;

    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    let data;
    try {
      data = await res.json();
    } catch {
      data = JSON.parse(await res.text());
    }

    const result = data?.quoteResponse?.result?.[0];
    if (!result) throw new Error('Няма данни за ' + symbol);

    renderMarketCard(result);
    setStatus('');
  } catch (err) {
    setStatus('❌ Грешка: ' + err.message);
    console.error(err);
  }
}

function renderMarketCard(item) {
  const list = document.getElementById('list');
  list.innerHTML = '';

  const symbol = item.symbol || '-';
  const name = item.shortName || item.longName || symbol;
  const price = item.regularMarketPrice?.toFixed?.(2) || '-';
  const change = item.regularMarketChange ?? 0;
  const percent = item.regularMarketChangePercent ?? 0;
  const up = change >= 0;
  const time = item.regularMarketTime
    ? new Date(item.regularMarketTime * 1000).toLocaleString('bg-BG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
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

async function loadMarketsSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  try {
    const html = await fetch('./markets.html').then(r => r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-market]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebarEl.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        renderMarketFilters(btn.dataset.market);
      });
    });
  } catch (err) {
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

window.loadMarketsSidebar = loadMarketsSidebar;