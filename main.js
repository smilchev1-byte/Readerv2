// Режим: news | videos
let MODE = 'news';

// === Филтри ===
function wireFilters() {
  const timeSelect = document.getElementById('timeSelect');
  const catSelect = document.getElementById('categorySelect');

  if (timeSelect) {
    timeSelect.addEventListener('change', () => applyDateFilter(timeSelect.value));
  }

  if (catSelect) {
    catSelect.addEventListener('change', () => {
      const sel = catSelect.value;
      document.querySelectorAll('.card-row').forEach(c => {
        c.style.display = (sel === 'all' || c.dataset.category === sel) ? '' : 'none';
      });
    });
  }
}

// === Sidebar ===
async function loadSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const file = MODE === 'news' ? './sidebar.html' : './channels.html';
    const html = await fetch(file).then(r=>r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-url],[data-channel]').forEach(el=>{
      el.classList.add('cat');
      const labelText = (el.textContent||'').trim();
      el.innerHTML = '';
      const iconUrl = el.getAttribute('data-icon') || DEFAULT_ICON;
      const img = document.createElement('img');
      img.className='fav'; img.alt=''; img.src = iconUrl;
      const span = document.createElement('span');
      span.className='label'; span.textContent = labelText;
      el.append(img, span);
      el.title = labelText;
    });

    // клик поведение
    sidebarEl.addEventListener('click', e=>{
      e.stopPropagation();
      const btnNews  = e.target.closest('[data-url]');
      const btnVideo = e.target.closest('[data-channel]');
      sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));

      if (MODE === 'news' && btnNews){
        btnNews.classList.add('active');
        importURL(btnNews.dataset.url);
      } else if (MODE === 'videos' && btnVideo){
        btnVideo.classList.add('active');
        loadVideosFromChannel(btnVideo.dataset.channel);
      }
    }, false);

  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

// === Превключване на режими ===

function wireModeSwitch(){
  const btnNews   = document.getElementById('modeNews');
  const btnVideos = document.getElementById('modeVideos');
  const btnMarkets = document.getElementById('modeMarkets');

  btnNews.addEventListener('click', ()=>{ ... }); // без промяна
  btnVideos.addEventListener('click', ()=>{ ... }); // без промяна

  btnMarkets.addEventListener('click', ()=>{
    if (MODE==='markets') return;
    MODE='markets';
    btnMarkets.classList.add('active');
    btnMarkets.setAttribute('aria-selected','true');
    [btnNews,btnVideos].forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false');});
    document.querySelector('.headline').textContent = 'Пазарни индекси и активи';
    document.getElementById('list').innerHTML = '<div class="placeholder">Зареждам пазари...</div>';
    fetchMarketData();
  });
}

// === Скрол hide ===
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

// === Sidebar toggle ===
const collapseBtn = document.getElementById('collapseToggle');
if (collapseBtn) {
  collapseBtn.textContent = '☰';
  collapseBtn.addEventListener('click', e=>{
    e.stopPropagation();
    document.body.classList.toggle('sidebar-open');
  }, false);
}

// === Tap-outside ===
document.addEventListener('click', e=>{
  if (window.innerWidth > 768) return;
  if (!document.body.classList.contains('sidebar-open')) return;
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('collapseToggle');
  if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
  document.body.classList.remove('sidebar-open');
}, false);

// === Init ===
wireFilters();
wireModeSwitch();
wireScrollHide();
loadSidebar();