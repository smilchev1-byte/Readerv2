// ==========================
// main.js — три режима: Новини / Видеа / Пазари
// ==========================

let MODE = 'news';

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

async function loadSidebar(){
  const sidebarEl = document.getElementById('sidebar');
  try{
    const file = MODE === 'news' ? './sidebar.html' : (MODE === 'videos' ? './channels.html' : '');
    if (!file){ sidebarEl.innerHTML = ''; return; }

    const html = await fetch(file).then(r=>r.text());
    sidebarEl.innerHTML = html;

    sidebarEl.querySelectorAll('[data-url],[data-channel]').forEach(el=>{
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
      el.title = labelText || el.getAttribute('data-url') || el.getAttribute('data-channel') || '';
    });

    sidebarEl.addEventListener('click', e=>{
      const btnNews = e.target.closest('[data-url]');
      const btnVideo = e.target.closest('[data-channel]');
      sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
      if (MODE === 'news' && btnNews){
        btnNews.classList.add('active');
        importURL(btnNews.dataset.url);
      } else if (MODE === 'videos' && btnVideo){
        btnVideo.classList.add('active');
        loadVideosFromChannel(btnVideo.dataset.channel);
      }
    });
  }catch(err){
    sidebarEl.innerHTML = `<div class="placeholder">❌ Не успях да заредя меню<br>${err.message}</div>`;
  }
}

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

  btnNews.addEventListener('click', ()=>{
    if (MODE==='news') return;
    MODE='news';
    deactivateAll();
    btnNews.classList.add('active'); btnNews.setAttribute('aria-selected','true');
    document.querySelector('.headline').textContent = 'Последни новини';
    document.querySelector('.filters').style.display = 'flex';
    document.getElementById('list').innerHTML = '<div class="placeholder">Използвай менюто, за да заредиш новини.</div>';
    loadSidebar();
  });

  btnVideos.addEventListener('click', ()=>{
    if (MODE==='videos') return;
    MODE='videos';
    deactivateAll();
    btnVideos.classList.add('active'); btnVideos.setAttribute('aria-selected','true');
    document.querySelector('.headline').textContent = 'Последни видеа';
    document.querySelector('.filters').style.display = 'none';
    document.getElementById('list').innerHTML = '<div class="placeholder">Избери канал от менюто, за да заредиш видеа.</div>';
    loadSidebar();
  });

  btnMarkets.addEventListener('click', ()=>{
  if (MODE==='markets') return;
  MODE='markets';
  deactivateAll();
  btnMarkets.classList.add('active');
  btnMarkets.setAttribute('aria-selected','true');
  document.querySelector('.headline').textContent = 'Пазарни индекси и активи';
  document.querySelector('.filters').style.display = 'none';
  document.getElementById('list').innerHTML = '<div class="placeholder">Зареждам пазари...</div>';
  loadMarketsSidebar(); // 🔹 ново!
});
}

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

const collapseBtn = document.getElementById('collapseToggle');
if (collapseBtn) {
  collapseBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('sidebar-collapsed');
  });
}

wireFilters();
wireModeSwitch();
wireScrollHide();
loadSidebar();