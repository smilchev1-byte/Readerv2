// ============================
// ✅ reader.js — фиксиран четец (новини + видеа)
// ============================

const reader = $('#reader');
const readerContent = $('#readerContent');
$('#readerClose').addEventListener('click', closeReader);
reader.addEventListener('click', e => { if (e.target.classList.contains('reader-backdrop')) closeReader(); });

function closeReader() {
  reader.style.display = 'none';
  reader.setAttribute('aria-hidden', 'true');
  readerContent.innerHTML = '';
}

// --- Новини (LD+JSON articleBody) ---
async function openReader(url) {
  if (!url) return setStatus('❌ Невалиден URL за статия.');
  setStatus('⏳ Зареждам статия...');
  try {
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(prox);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();
    const doc = parseHTML(html);

    // 1️⃣ Извличане на articleBody от LD+JSON
    const ldScripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    let articleText = '', dateText = '';
    for (let s of ldScripts) {
      try {
        const json = JSON.parse(s.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1]);
        if (Array.isArray(json)) {
          for (const obj of json) {
            if (obj.articleBody) { articleText = obj.articleBody; dateText = obj.datePublished || ''; break; }
          }
        } else if (json.articleBody) {
          articleText = json.articleBody; dateText = json.datePublished || '';
        }
      } catch {}
      if (articleText) break;
    }

    // 2️⃣ Ако няма LD+JSON, fallback към <article> елемент
    if (!articleText) {
      const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
      if (main) articleText = main.innerText.trim();
    }

    if (!articleText) throw new Error('Не е намерено съдържание.');

    // 3️⃣ Форматиране
    const grouped = articleText.split(/\n{2,}/).map((p, i) => `<p class="${i===0?'lead':''}">${p.trim()}</p>`).join('');
    const formattedDate = dateText ? new Date(dateText).toLocaleString('bg-BG', { dateStyle:'medium', timeStyle:'short' }) : '';

    readerContent.innerHTML = `${formattedDate?`<div class="reader-date">🕒 ${formattedDate}</div>`:''}${grouped}`;
    reader.style.display = 'block';
    reader.setAttribute('aria-hidden', 'false');
    setStatus('');
  } catch (e) {
    setStatus('❌ Грешка: ' + e.message);
  }
}

// --- Видеа (YouTube embed) ---
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
