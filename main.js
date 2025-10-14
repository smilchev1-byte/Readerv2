// Режим: news | videos
let MODE = 'news';

function wireFilters() {
  const timeSelect = document.getElementById('timeSelect');
  const catSelect = document.getElementById('categorySelect');

  if (timeSelect) {
    timeSelect.addEventListener('change', () => {
      applyDateFilter(timeSelect.value);
    });
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


// Зареждане на sidebar.html (за новини) или channels.html (за видеа)
async function loadSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const file = MODE === 'news' ? './sidebar.html' : './channels.html';
    const html = await fetch(file).then(r=>r.text());
    sidebarEl.innerHTML = html;

    // Инжектиране на иконки (или default)
    sidebarEl.querySelectorAll('[data-url],[data-channel]').forEach(el=>{
      el.classList.add('cat');
      const labelText = (el.textContent||'').trim();
      el.innerHTML = '';
      const iconUrl = el.getAttribute('data-icon') || DEFAULT_ICON;
      const img = document.createElement('img');
      img.className='fav'; img.alt=''; img.referrerPolicy='no-referrer'; img.src = iconUrl;
      const span = document.createElement('span'); span.className='label'; span.textContent = labelText;
      el.append(img, span);
      el.title = labelText || el.getAttribute('data-url') || el.getAttribute('data-channel') || '';
    });

    // Клик поведение според режима
    sidebarEl.addEventListener('click', e=>{
      const btnNews   = e.target.closest('[data-url]');
      const btnVideo  = e.target.closest('[data-channel]');
      if (MODE === 'news' && btnNews){
        sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
        btnNews.classList.add('active');
        importURL(btnNews.dataset.url);
      } else if (MODE === 'videos' && btnVideo){
        sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
        btnVideo.classList.add('active');
        loadVideosFromChannel(btnVideo.dataset.channel);
      }
      // след избор затваря sidebar на мобилен
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-open');
      }
    });
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

// Превключване на режим от горните бутони
function wireModeSwitch(){
  const btnNews   = document.getElementById('modeNews');
  const btnVideos = document.getElementById('modeVideos');
  btnNews.addEventListener('click', ()=>{
    if (MODE==='news') return;
    MODE='news';
    btnNews.classList.add('active'); btnVideos.classList.remove('active');
    document.querySelector('.headline').textContent = 'Последни новини';
    document.getElementById('list').innerHTML = '<div class="placeholder">Използвай менюто, за да заредиш новини.</div>';
    loadSidebar();
  });
  btnVideos.addEventListener('click', ()=>{
    if (MODE==='videos') return;
    MODE='videos';
    btnVideos.classList.add('active'); btnNews.classList.remove('active');
    document.querySelector('.headline').textContent = 'Последни видеа';
    document.getElementById('list').innerHTML = '<div class="placeholder">Избери канал от менюто, за да заредиш видеа.</div>';
    loadSidebar();
  });
}

// Скрол hide за headline
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

// Collapse / toggle sidebar
const collapseBtn = document.getElementById('collapseToggle');
if (collapseBtn) {
  collapseBtn.textContent = '☰'; // показва се като hamburger
  collapseBtn.addEventListener('click', ()=>{
    if (window.innerWidth <= 768) {
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  });
}

// При мобилен – скрито по подразбиране
if (window.innerWidth <= 768) {
  document.body.classList.remove('sidebar-open');
  document.body.classList.add('sidebar-collapsed');
}

// Init
wireFilters();
wireModeSwitch();
wireScrollHide();
loadSidebar();
