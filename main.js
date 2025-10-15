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

// === Sidebar зареждане ===
async function loadSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const file = MODE === 'news' ? './sidebar.html' : './channels.html';
    const html = await fetch(file).then(r=>r.text());
    sidebarEl.innerHTML = html;

    // Иконки
    sidebarEl.querySelectorAll('[data-url],[data-channel]').forEach(el=>{
      el.classList.add('cat');
      const labelText = (el.textContent||'').trim();
      el.innerHTML = '';
      const iconUrl = el.getAttribute('data-icon') || DEFAULT_ICON;
      const img = document.createElement('img');
      img.className='fav'; img.alt=''; img.referrerPolicy='no-referrer'; img.src = iconUrl;
      const span = document.createElement('span');
      span.className='label'; span.textContent = labelText;
      el.append(img, span);
      el.title = labelText;
    });

    // Клик поведение
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

      // затваряне след клик само на мобилен
      if (window.innerWidth <= 768) {
        setTimeout(()=> document.body.classList.remove('sidebar-open'), 400);
      }
    }, false);

    sidebarEl.addEventListener('touchstart', e => e.stopPropagation(), {passive:true});

  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

// === Превключване на режимите ===
function wireModeSwitch(){
  const btnNews   = document.getElementById('modeNews');
  const btnVideos = document.getElementById('modeVideos');

  btnNews.addEventListener('click', () => {
    if (MODE === 'news') return;
    MODE = 'news';
    btnNews.classList.add('active');
    btnVideos.classList.remove('active');
    document.querySelector('.headline').textContent = 'Последни новини';
    document.getElementById('filters-news').style.display = 'flex';
    document.getElementById('filters-videos').style.display = 'none';
    document.getElementById('list').innerHTML =
      '<div class="placeholder">Използвай менюто, за да заредиш новини.</div>';
    loadSidebar();
  });

  btnVideos.addEventListener('click', () => {
    if (MODE === 'videos') return;
    MODE = 'videos';
    btnVideos.classList.add('active');
    btnNews.classList.remove('active');
    document.querySelector('.headline').textContent = 'Последни видеа';
    document.getElementById('filters-news').style.display = 'none';
    document.getElementById('filters-videos').style.display = 'flex';
    document.getElementById('list').innerHTML =
      '<div class="placeholder">Избери канал от менюто, за да заредиш видеа.</div>';
    loadSidebar();
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
    if (window.innerWidth <= 768) {
      document.body.classList.toggle('sidebar-open'); // само този клас на мобилен
    } else {
      document.body.classList.toggle('sidebar-collapsed'); // само на десктоп
    }
  }, false);
}

// === Tap-outside ===
document.addEventListener('click', e=>{
  if (window.innerWidth > 768) return;
  if (!document.body.classList.contains('sidebar-open')) return;

  const path = e.composedPath ? e.composedPath() : [];
  const sidebar = document.getElementById('sidebar');
  const toggle  = document.getElementById('collapseToggle');
  const clickedInsideSidebar = sidebar && path.includes(sidebar);
  const clickedToggle = toggle && (toggle === e.target || toggle.contains(e.target));

  if (!clickedInsideSidebar && !clickedToggle) {
    document.body.classList.remove('sidebar-open');
  }
}, false);

// === Init ===
wireFilters();
wireModeSwitch();
wireScrollHide();
loadSidebar();