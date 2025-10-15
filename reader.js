// ============================
// ✅ reader.js — четец с articleBody JSON-LD
// ============================

const reader = $('#reader');
const readerContent = $('#readerContent');
$('#readerClose').addEventListener('click', closeReader);
reader.addEventListener('click', e => {
  if (e.target.classList.contains('reader-backdrop')) closeReader();
});

function closeReader() {
  reader.style.display = 'none';
  reader.setAttribute('aria-hidden', 'true');
  readerContent.innerHTML = '';
}

async function fetchHTML(url) {
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
  const res = await fetch(proxy, { cache: "no-store", mode: "cors" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

// === Четец на статия ===
async function openReader(url, titleFromList) {
  if (!url) return setStatus('❌ Невалиден URL.');

  setStatus('⏳ Зареждам статия…');

  try {
    const html = await fetchHTML(url);
    const doc = parseHTML(html);

    let articleBody = '';
    let datePublished = '';
    let title = titleFromList || doc.querySelector('h1')?.textContent?.trim() || '';

    // Търси JSON-LD articleBody
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.textContent.trim());
        const extract = obj => {
          if (obj.articleBody && !articleBody) articleBody = obj.articleBody;
          if (obj.datePublished && !datePublished) datePublished = obj.datePublished;
          if (obj.headline && !title) title = obj.headline;
        };
        if (Array.isArray(data)) data.forEach(extract);
        else extract(data);
      } catch {}
      if (articleBody) break;
    }

    // fallback
    if (!articleBody) {
      const art = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
      articleBody = art ? art.innerText.trim() : '⚠️ Не е намерен articleBody в JSON-LD.';
    }

    const fDate = datePublished
      ? new Date(datePublished).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })
      : '';

    const paragraphs = articleBody
      .split(/\n{1,}/)
      .map(s => s.trim())
      .filter(Boolean)
      .map((p, i) => `<p class="${i === 0 ? 'lead' : ''}">${p}</p>`)
      .join('');

    readerContent.innerHTML = `
      ${fDate ? `<div class="reader-date">🕒 ${fDate}</div>` : ''}
      <p class="lead">${title}</p>
      ${paragraphs}
    `;

    reader.style.display = 'block';
    reader.setAttribute('aria-hidden', 'false');
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Грешка при зареждане: ' + e.message);
  }
}
