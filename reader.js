// ============================
// ✅ reader.js — новини и видеа (финална версия)
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

// --- Новини: извличане на articleBody ---
async function openReader(url) {
  if (!url) return setStatus('❌ Невалиден URL.');
  setStatus('⏳ Зареждам статия…');

  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    let articleText = '', dateText = '';

    // 1️⃣ Търсим "articleBody" в HTML кода
    const match = html.match(/"articleBody"\s*:\s*"([^"]+)"/);
    if (match) articleText = match[1];

    // 2️⃣ Ако не е намерен директно, проверяваме JSON скриптовете
    if (!articleText) {
      const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
      for (let s of scripts) {
        try {
          const j = JSON.parse(s.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1]);
          if (Array.isArray(j)) {
            for (const o of j) if (o.articleBody) { articleText = o.articleBody; dateText = o.datePublished || ''; break; }
          } else if (j.articleBody) {
            articleText = j.articleBody; dateText = j.datePublished || '';
          }
        } catch {}
        if (articleText) break;
      }
    }

    // 3️⃣ Fallback: текст от <article>
    if (!articleText) {
      const doc = parseHTML(html);
      const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
      if (main) articleText = main.innerText.trim();
    }

    if (!articleText) throw new Error('Не е намерено съдържание.');

    const grouped = articleText
      .split(/[\r\n]+/)
      .filter(p => p.trim().length > 2)
      .map((p, i) => `<p class="${i===0?'lead':''}">${p.trim()}</p>`)
      .join('');

    const formattedDate = dateText ? new Date(dateText).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}) : '';
    readerContent.innerHTML = `${formattedDate?`<div class="reader-date">🕒 ${formattedDate}</div>`:''}${grouped}`;

    reader.style.display = 'block';
    reader.setAttribute('aria-hidden', 'false');
    setStatus('');
  } catch (e) {
    console.error(e);
    setStatus('❌ Грешка: ' + e.message);
  }
}

// --- Видеа: YouTube embed ---
function openVideoInReader(videoId, title, publishedISO) {
  const fDate = publishedISO ? new Date(publishedISO).toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}) : '';
  readerContent.innerHTML = `
    ${fDate?`<div class="reader-date">🕒 ${fDate}</div>`:''}
    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
      <iframe src="https://www.youtube.com/embed/${videoId}" title="${title||'Video Player'}" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
    </div>
    <p class="lead">${title||''}</p>`;
  reader.style.display = 'block';
  reader.setAttribute('aria-hidden', 'false');
}
