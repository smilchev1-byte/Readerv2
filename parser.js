// ============================
// ✅ parser.js — адаптиран към твоя layout
// ============================

async function fetchHTML(url) {
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
  const res = await fetch(proxy, { cache: "no-store", mode: "cors" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

// ===== Извличане на елементи от страницата =====
function extractFeedAnchors(doc, baseHref) {
  const anchors = Array.from(doc.querySelectorAll('a[class*="gtag-feed-statia"]'));
  return anchors.map(a => {
    const container = a.closest("article, div, li") || a.parentElement;
    const img = container?.querySelector("img")?.getAttribute("src") || "";
    const timeEl = container?.querySelector("time");
    const date = timeEl?.getAttribute("datetime") || timeEl?.textContent?.trim() || "";
    return {
      href: absURL(baseHref, a.getAttribute("href") || ""),
      title: (a.textContent || a.getAttribute("title") || "").trim(),
      img: img ? absURL(baseHref, img) : "",
      date
    };
  }).filter(x => x.href && x.title);
}

// ===== Импорт по URL (натискане в sidebar) =====
async function importURL(url) {
  if (!url) { setStatus('❌ Невалиден URL.'); return; }

  setStatus('⏳ Зареждам новини…');
  const listEl = $('#list');
  listEl.innerHTML = '';

  try {
    const html = await fetchHTML(url);
    const doc = parseHTML(html);
    const items = extractFeedAnchors(doc, url);

    if (!items.length) {
      listEl.innerHTML = '<div class="placeholder">Няма намерени статии.</div>';
      setStatus('');
      return;
    }

    const frag = document.createDocumentFragment();
    items.forEach((it, i) => frag.appendChild(toCardElement(it, i)));
    listEl.appendChild(frag);
    populateCategories();
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Грешка при зареждане: ' + e.message);
    $('#list').innerHTML = `<div class="placeholder">❌ Неуспешно зареждане.<br>${e.message}</div>`;
  }
}

// ===== Генерира карта за всяка статия =====
function toCardElement(item, i) {
  const card = document.createElement('div');
  card.className = 'card-row';
  card.dataset.href = item.href;

  const fDate = item.date
    ? (() => {
        const d = new Date(item.date);
        return isNaN(d) ? '' : d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });
      })()
    : '';

  card.innerHTML = `
    <div class="thumb">${item.img ? `<img src="${item.img}" alt="">` : `<span>${i + 1}</span>`}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${item.title}</a></h3>
        ${fDate ? `<div class="meta-date">🕒 ${fDate}</div>` : ''}
      </div>
      <div class="meta">${new URL(item.href).hostname.replace(/^www\./, '')}</div>
    </div>`;

  card.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    openReader(item.href, item.title);
  });

  return card;
}
