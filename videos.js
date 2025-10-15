// ============================
// ✅ reader.js — финална версия (reader винаги се отваря)
// ============================

document.addEventListener('DOMContentLoaded', () => {
  const reader = document.getElementById('reader');
  const readerContent = document.getElementById('readerContent');
  const readerCloseBtn = document.getElementById('readerClose');

  readerCloseBtn?.addEventListener('click', closeReader);
  reader.addEventListener('click', e => {
    if (e.target.classList.contains('reader-backdrop')) closeReader();
  });

  function closeReader() {
    reader.style.display = 'none';
    reader.setAttribute('aria-hidden', 'true');
    readerContent.innerHTML = '';
  }

  // ГЛОБАЛНО достъпна функция за новини
  window.openReader = async function (url) {
    if (!url) return setStatus('❌ Невалиден URL.');
    setStatus('⏳ Зареждам статия…');

    try {
      const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(prox);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      // търсим "articleBody"
      let articleText = '';
      const match = html.match(/"articleBody"\s*:\s*"([^"]+)"/);
      if (match) articleText = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');

      if (!articleText) {
        const doc = parseHTML(html);
        const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
        if (main) articleText = main.innerText.trim();
      }

      if (!articleText) throw new Error('Не е намерено съдържание.');

      const grouped = articleText
        .split(/[\r\n]+/)
        .filter(p => p.trim().length > 2)
        .map((p, i) => `<p class="${i === 0 ? 'lead' : ''}">${p.trim()}</p>`)
        .join('');

      readerContent.innerHTML = grouped;
      reader.style.display = 'block';
      reader.setAttribute('aria-hidden', 'false');
      setStatus('');
    } catch (e) {
      console.error(e);
      setStatus('❌ Грешка: ' + e.message);
    }
  };

  // ГЛОБАЛНО достъпна функция за видеа
  window.openVideoInReader = function (videoId, title, publishedISO) {
    const fDate = publishedISO ? new Date(publishedISO).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    readerContent.innerHTML = `
      ${fDate ? `<div class="reader-date">🕒 ${fDate}</div>` : ''}
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
        <iframe src="https://www.youtube.com/embed/${videoId}" title="${title||'Video Player'}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
      </div>
      <p class="lead">${title||''}</p>`;
    reader.style.display = 'block';
    reader.setAttribute('aria-hidden', 'false');
  };
});
