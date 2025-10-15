// ==========================
// markets.js — Пазари (Yahoo Finance през Cloudflare Worker)
// ==========================

// твой Cloudflare Worker proxy
const PROXY = 'https://tight-wildflower-8f1a.s-milchev1.workers.dev';

// налични категории и символи
const MARKET_CATEGORIES = {
  stocks: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOG'],
  etfs: ['SPY', 'QQQ', 'VTI', 'VGK', 'EEM'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'XRP-USD']
};

// === Sidebar за пазари ===
async function loadMarketsSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  try {
    const html = await fetch('./markets.html').then(r => r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-market]').forEach(btn => {
      btn.classList.add('cat');
      btn.addEventListener('click', () => {
        sidebarEl.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        renderMarketDropdown(btn.dataset.market);
      });
    });

    // По подразбиране зарежда Stocks
    const firstBtn = sidebarEl.querySelector('[data-market="stocks"]');
    if (firstBtn) firstBtn.click();

  } catch (err) {
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя пазари<br>${err.message}</div>`;
  }
}
window.loadMarketsSidebar = loadMarketsSidebar;

// === Dropdown според категория ===
function renderMarketDropdown(categoryKey) {
  const container = document.getElementById('marketFilters');
  const listEl = document.getElementById('list');
  container.innerHTML = '';
  listEl.innerHTML = '<div class="placeholder">Избери актив от списъка.</div>';

  const items = MARKET_CATEGORIES[categoryKey];
  if (!items) {
    container.innerHTML = '<div class="placeholder">Няма налични активи.</div>';
    return;
  }

  const label = document.createElement('label');
  label.textContent = 'Избери актив:';
  label.className = 'market-label';

  const select = document.createElement('select');
  select.id = 'symbolSelect';
  select.className = 'market-dropdown';
  items.forEach(sym => {
    const opt = document.createElement('option');
    opt.value = sym;
    opt.textContent = sym;
    select.appendChild(opt);
  });

  container.appendChild(label);
  container.appendChild(select);
  container.style.display = 'block';

  select.addEventListener('change', () => fetchSingleMarketData(select.value));
  fetchSingleMarketData(select.value); // зарежда първия символ
}

// === Изтегляне на Yahoo данни през Cloudflare Worker ===
async function fetchSingleMarketData(symbol) {
  setStatus(`⏳ Зареждам данни за ${symbol}...`);
  const listEl = document.getElementById('list');
  listEl.innerHTML = '';

  try {
    // Генерираме вътрешния Yahoo URL
    const yahooURL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;

    // Само еднократно кодиране (Cloudflare сам декодира)
    const proxURL = `${PROXY}/?url=${encodeURIComponent(yahooURL)}&nocache=${Date.now()}`;

    const res = await fetch(proxURL, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    let wrapper;
    try {
      wrapper = await res.json();
    } catch {
      wrapper = JSON.parse(await res.text());
    }

    // Cloudflare може да върне {data:{...}} или директно {...}
    const data = wrapper?.data || wrapper;
    const result = data?.quoteResponse?.result?.[0];

    if (!result) throw new Error('Няма резултат от Yahoo');

    renderMarketCard(result);
    setStatus('');
  } catch (e) {
    console.error('fetchSingleMarketData:', e);
    setStatus('❌ Грешка: ' + e.message);
    listEl.innerHTML = '<div class="placeholder">Няма налични данни.</div>';
  }
}

// === Визуализация на картата за избрания актив ===
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
        timeStyle: 'short'
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