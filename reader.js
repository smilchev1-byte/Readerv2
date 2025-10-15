// ============================
// ✅ reader.js — работеща логика за articleBody + видеа
// ============================

document.addEventListener('DOMContentLoaded', () => {
  const reader = document.getElementById('reader');
  const readerContent = document.getElementById('readerContent');
  const readerCloseBtn = document.getElementById('readerClose');

  if (!reader || !readerContent) {
    console.error('❌ reader или readerContent липсва в DOM.');
    return;
  }

  readerCloseBtn?.addEventListener('click', closeReader);
  reader.addEventListener('click', e => {
    if (e.target.classList.contains('reader-backdrop')) closeReader();
  });

  function closeReader() {
    reader.style.display = 'none';
    reader.setAttribute('aria-hidden', 'true');
    readerContent.innerHTML = '';
  }

  // === Новини: извличане на articleBody директно от HTML ===
  window.openReader = async function (url) {
    if (!url) return setStatus('❌ Невалиден URL.');
    setStatus('⏳ Зареждам статия…');

    try {
      const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(prox);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      // 1️⃣ директно търсим "articleBody":
      let articleText = '';
      const match = html.match(/"articleBody"\s*:\s*"([^"]+)"/);
      if (match) articleText = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"');

      // 2️⃣ fallback към JSON блокове
      if (!articleText) {
        const ldScripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (let s of ldScripts) {
          try {
            const json = JSON.parse(s.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1]);
            if (Array.isArray(json)) {
              for (const j of json) if (j.articleBody) { articleText = j.articleBody; break; }
            } else if (json.articleBody) {
              articleText = json.articleBody;
            }
          } catch {}
          if (articleText) break;
        }
      }

      // 3️⃣ fallback към <article>
      if (!articleText) {
        const doc = parseHTML(html);
        const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
        if (main) articleText = main.innerText.trim();
      }

      if (!articleText) throw new Error('Не е намерено съдържание.');

      // 4️⃣ разделяме на параграфи
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

  // === Видеа: YouTube embed ===
  window.openVideoInReader = function (videoId, title, publishedISO) {
    const fDate = publishedISO ? new Date(publishedISO).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    readerContent.innerHTML = `
      ${fDate ? `<div class="reader-date">🕒 ${fDate}</div>` : ''}
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
        <iframe src="https://www.youtube.com/embed/${videoId}" title="${title || 'Video Player'}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
      </div>
      <p class="lead">${title || ''}</p>`;
    reader.style.display = 'block';
    reader.setAttribute('aria-hidden', 'false');
  };
});
