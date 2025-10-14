// Зареждане на sidebar.html + иконки + кликове
async function loadSidebar(){
  const sidebarEl = $('#sidebar');
  try{
    const html = await fetch('sidebar.html').then(r=>r.text());
    sidebarEl.innerHTML = html;

    // Инжектиране на favicon (или default)
    sidebarEl.querySelectorAll('[data-url]').forEach(el=>{
      el.classList.add('cat');
      const labelText = (el.textContent||'').trim();
      el.innerHTML = '';
      const iconUrl = el.getAttribute('data-icon') || DEFAULT_ICON;
      const img = document.createElement('img'); img.className='fav'; img.alt=''; img.referrerPolicy='no-referrer'; img.src = iconUrl;
      const span = document.createElement('span'); span.className='label'; span.textContent = labelText;
      el.append(img, span);
      el.title = labelText || el.getAttribute('data-url') || '';
    });

    sidebarEl.addEventListener('click', e=>{
      const btn = e.target.closest('[data-url]');
      if(!btn) return;
      importURL(btn.dataset.url);
      // маркирай активния
      sidebarEl.querySelectorAll('.cat').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
    });
  }catch{
    sidebarEl.innerHTML = '<div class="placeholder">❌ Не успях да заредя sidebar.html</div>';
  }
}
loadSidebar();

// Филтри по време
$$('.chip').forEach(b=>b.addEventListener('click',()=>{
  $$('.chip').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); applyDateFilter(b.dataset.filter);
}));

// Филтър по категория
const catSel = $('#categorySelect');
catSel.addEventListener('change', ()=>{
  const sel = catSel.value;
  $$('.card-row').forEach(c=>{
    c.style.display = (sel==='all' || c.dataset.category===sel) ? '' : 'none';
  });
});

// Скрий „Последни новини“ при скрол надолу
let lastScrollTop = 0;
const mainEl = $('#main');
mainEl.addEventListener('scroll', ()=>{
  const st = mainEl.scrollTop;
  if (st > lastScrollTop && st > 30) document.body.classList.add('scrolling-down');
  else document.body.classList.remove('scrolling-down');
  lastScrollTop = st <= 0 ? 0 : st;
});

// Collapse sidebar (десктоп)
const collapseBtn = $('#collapseToggle');
if (collapseBtn) {
  collapseBtn.addEventListener('click', ()=>{
    document.body.classList.toggle('sidebar-collapsed');
  });
}
