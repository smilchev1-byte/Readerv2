// ============================
// reader.js — стабилен четец (новини + видеа)
// ============================

// Изчакваме DOM, за да сме сигурни, че елементите са налични
document.addEventListener('DOMContentLoaded', () => {
  window.reader = $('#reader');
  window.readerContent = $('#readerContent');

  $('#readerClose')?.addEventListener('click', closeReader);
  reader?.addEventListener('click', e => {
    if (e.target.classList.contains('reader-backdrop')) closeReader();
  });
});

function closeReader() {
  if (!reader) return;
  reader.style.display = 'none';
  reader.setAttribute('aria-hidden', 'true');
  if (readerContent) readerContent.innerHTML = '';
}

// --- Новини (LD+JSON articleBody) ---
async function openReader(url) {
  if (!url) return setStatus('❌ Невалиден URL');
  setStatus('⏳ Зареждам статия…');

  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Опит 1: LD+JSON articleBody
    const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let articleText = '', dateText = '';
    for (let s of scripts) {
      try {
        const j = JSON.parse(s.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1]);
        if (Array.isArray(j)) {
          for (const o of j) {
            if (o.articleBody) { articleText = o.articleBody; dateText = o.datePublished || ''; break; }
          }
        } else if (j.articleBody) {
          articleText = j.articleBody; dateText = j.datePublished || '';
        }
      } catch {}
      if (articleText) break;
    }

    // Опит 2: <article>
    if (!articleText) {
      const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
      if (main) articleText = main.innerText.trim();
    }

    if (!articleText) throw new Error('Няма намерено съдържание.');

    const grouped = articleText
      .split(/\n{2,}/)
      .map((p, i) => `<p class="${i===0?'lead':''}">${p.trim()}</p>`)
      .join('');
    const formattedDate = dateText
      ? new Date(dateText).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})
      : '';

    // ✅ Проверка дали readerContent е наличен
    const rc = document.querySelector('#readerContent');
    if (!rc) throw new Error('readerContent не е намерен в DOM.');

    rc.innerHTML = `${formattedDate?`<div class="reader-date">🕒 ${formattedDate}</div>`:''}${grouped}`;
    reader.style.display = 'block';
    reader.setAttribute('aria-hidden','false');
    setStatus('');
  } catch (err) {
    console.error(err);
    setStatus('❌ ' + err.message);
  }
}

// --- YouTube embed ---
function openVideoInReader(videoId, title, publishedISO) {
  const rc = document.querySelector('#readerContent');
  const fDate = publishedISO
    ? new Date(publishedISO).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'})
    : '';
  if (!rc) return alert('readerContent липсва!');
  rc.innerHTML = `
    ${fDate?`<div class="reader-date">🕒 ${fDate}</div>`:''}
    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
      <iframe src="https://www.youtube.com/embed/${videoId}" 
        title="${title||'Video'}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        style="position:absolute;top:0;left:0;width:100%;height:100%">
      </iframe>
    </div>
    <p class="lead">${title||''}</p>`;
  reader.style.display = 'block';
  reader.setAttribute('aria-hidden','false');
}