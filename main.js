// ==========================
// main.js — режими: Новини / Видеа / Пазари + стабилен sidebar за iPhone
// ==========================

// --- iPhone стабилизиране (трябва да е в началото)
(function stabilizeIOS(){
  const ua = navigator.userAgent || '';
  const isiOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isiOS) {
    document.body.classList.add('ios');
    document.body.classList.add('sidebar-collapsed');

    const sidebar = document.getElementById('sidebar');
    sidebar?.addEventListener('touchstart', ev => ev.stopPropagation(), { passive: true });

    const btn = document.getElementById('collapseToggle');
    if (btn) {
      btn.classList.remove('desktop-only');
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.toggle('sidebar-collapsed');
      }, { passive:false });
    }

    const main = document.getElementById('main');
    main?.addEventListener('touchstart', ()=>{}, { passive:true });
  }
})();

let MODE = 'news';

// --- Филтри (новини)
function wireFilters(){
  document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    applyDateFilter(b.dataset.filter);
  }));

  const catSel = document.getElementById('categorySelect');
  if (catSel) {
    catSel.addEventListener('change', ()=>{
      const sel = catSel.value;
      document.querySelectorAll('.card-row').forEach(c=>{
        c.style.display = (sel==='all' || c.dataset.category===sel) ? '' : 'none';
      });
    });
  }
}

// --- Зареждане на sidebar (новини / видеа / пазари)
async function loadSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    let file = '';
    if (MODE === 'news') file = './sidebar.html';
    else if (MODE === 'videos') file = './channels.html';
    else if (MODE === 'markets') file = './markets.html';

    if (!file){ sidebarEl.innerHTML = ''; return; }

    const html = await fetch(file).then(r=>r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-url],[data-channel],[data-market]').forEach(el=>{
      el.classList.add('cat');
      const labelText = (el.textContent||'').trim();
      el.innerHTML = '';
      const iconUrl = el.getAttribute('data-icon') || DEFAULT_ICON;
      const img = document.createElement('img');
      img.className='fav';
      img.alt='';
      img.referrerPolicy='no-referrer';
      img.src = iconUrl;
      const span = document.createElement('span');
      span.className='label';
      span.textContent = labelText;
      el.append(img, span);
      el.title = labelText;
    });

    sidebarEl.addEventListener('click', e=>{
      const item = e.target.closest('[data-url], [data-channel], [data-market]');
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();

      sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
      item.classList.add('active');

      if (MODE === 'news' && item.dataset.url){
        importURL(item.dataset.url);
      } else if (MODE === 'videos' && item.dataset.channel){
        loadVideosFromChannel(item.dataset.channel);
      } else if (MODE === 'markets' && item.dataset.market){
        if (typeof renderMarketFilters === 'function') renderMarketFilters(item.dataset.market);
        document.getElementById('list').innerHTML = '<div class="placeholder">Зареждам пазари…</div>';
      }
    });
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

// --- Превключване на режимите
function wireModeSwitch(){
  const btnNews = document.getElementById('modeNews');
  const btnVideos = document.getElementById('modeVideos');
  const btnMarkets = document.getElementById('modeMarkets');
  const allBtns = [btnNews, btnVideos, btnMarkets];

  function deactivateAll(){
    allBtns.forEach(b=>{
      if(!b) return;
      b.classList.remove('active');
      b.setAttribute('aria-selected','false');
    });
  }

  // --- Новини ---
  btnNews.addEventListener('click', ()=>{
    if (MODE==='news') return;
    MODE='news';
    deactivateAll();
    btnNews.classList.add('active');
    btnNews.setAttribute('aria-selected','true');
    document.querySelector('.headline').textContent = 'Последни новини';
    document.getElementById('filters').style.display = 'block';
    const marketFilters = document.getElementById('marketFilters');
    if (marketFilters) marketFilters.style.display = 'none';
    document.getElementById('list').innerHTML = '<div class="placeholder">Използвай менюто, за да заредиш новини.</div>';
    loadSidebar();
  });

  // --- Видеа ---
  btnVideos.addEventListener('click', ()=>{
    if (MODE==='videos') return;
    MODE='videos';
    deactivateAll();
    btnVideos.classList.add('active');
    btnVideos.setAttribute('aria-selected','true');
    document.querySelector('.headline').textContent = 'Последни видеа';
    document.getElementById('filters').style.display = 'none';
    const marketFilters = document.getElementById('marketFilters');
    if (marketFilters) marketFilters.style.display = 'none';
    document.getElementById('list').innerHTML = '<div class="placeholder">Избери канал от менюто, за да заредиш видеа.</div>';
    loadSidebar();
  });

  // --- Пазари ---
  btnMarkets.addEventListener('click', ()=>{
    if (MODE==='markets') return;
    MODE='markets';
    deactivateAll();
    btnMarkets.classList.add('active');
    btnMarkets.setAttribute('aria-selected','true');
    document.querySelector('.headline').textContent = 'Пазарни индекси и активи';
    document.getElementById('filters').style.display = 'none';
    const marketFilters = document.getElementById('marketFilters');
    if (marketFilters) marketFilters.style.display = 'block';
    document.getElementById('list').innerHTML = '<div class="placeholder">Избери категория от менюто вляво.</div>';
    if (typeof loadMarketsSidebar === 'function') loadMarketsSidebar();
  });
}

// --- Скрол hide за headline ---
let lastScrollTop = 0;
function wireScrollHide(){
  const mainEl = document.getElementById('main');
  mainEl.addEventListener('scroll', ()=>{
    const st = mainEl.scrollTop;
    if (st > lastScrollTop && st > 30) document.body.classList.add('scrolling-down');
    else document.body.classList.remove('scrolling-down');
    lastScrollTop = st <= 0 ? 0 : st;
  });
}

// --- Collapse (desktop) ---
const collapseBtn = document.getElementById('collapseToggle');
if (collapseBtn) {
  collapseBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('sidebar-collapsed');
  });
}

// --- Init ---
wireFilters();
wireModeSwitch();
wireScrollHide();
loadSidebar();