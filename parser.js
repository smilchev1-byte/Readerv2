// ============================
// ✅ parser.js — базиран на логиката gtag-feed-statia*
// ============================

// универсален селектор — само за визуализация, при нужда може да се разшири
const SELECTORS = 'a[class*="gtag-feed-statia"]';

// Основен импорт на URL
async function importURL(url){
  if(!url){ setStatus('❌ Невалиден URL.'); return; }
  setStatus('⏳ Зареждам новини…');
  const listEl = $('#list');
  listEl.innerHTML = '';

  try {
    // стабилен proxy (AllOrigins)
    const api = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url) + "&t=" + Date.now();
    const res = await fetch(api, { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const html = await res.text();

    const doc = parseHTML(html);
    const anchors = extractFeedAnchors(doc, url);

    if(!anchors.length){
      listEl.innerHTML = '<div class="placeholder">Няма намерени статии (gtag-feed-statia*).</div>';
      setStatus('');
      return;
    }

    anchors.forEach((item, i) => listEl.appendChild(toCardElement(item, i)));
    populateCategories();
    setStatus('');
  } catch(e){
    console.error(e);
    setStatus('❌ Грешка при зареждане: ' + e.message);
    $('#list').innerHTML = '<div class="placeholder">❌ Неуспешно зареждане на новини.</div>';
  }
}

// Извличане на статии от <a class="gtag-feed-statia*">
function extractFeedAnchors(doc, baseHref){
  const anchors = Array.from(doc.querySelectorAll(SELECTORS));
  return anchors.map(a => ({
    href: absURL(baseHref, a.getAttribute("href") || ''),
    title: (a.textContent || a.getAttribute("title") || '').trim(),
  })).filter(x => x.href && x.title);
}

// Генерира карта за всяка статия
function toCardElement(item, i){
  const card = document.createElement('div');
  card.className = 'card-row';
  card.dataset.href = item.href;

  card.innerHTML = `
    <div class="thumb"><span>${i+1}</span></div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${item.title}</a></h3>
      </div>
      <div class="meta">${new URL(item.href).hostname.replace(/^www\./,'')}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    openReader(item.href);
  });

  return card;
}
