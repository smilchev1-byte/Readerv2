// ============================
// reader.js — JSON-LD articleBody четец (+ заглавие от sidebar)
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

  async function fetchHTML(url){
    const api = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&t=${Date.now()}`;
    const res = await fetch(api, { cache: "no-store", mode: "cors", credentials: "omit" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  }

  // Глобална: openReader(url, optionalTitle)
  window.openReader = async function (url, forcedTitle){
    if(!url){ setStatus('❌ Невалиден URL.'); return; }
    setStatus('⏳ Зареждам статия…');

    try{
      const html = await fetchHTML(url);
      const doc = parseHTML(html);

      let articleText = '';
      let datePublished = '';
      let title = forcedTitle || doc.querySelector('h1')?.textContent?.trim() || '';

      // JSON-LD <script type="application/ld+json">
      const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
      for(const s of scripts){
        try{
          const json = JSON.parse(s.textContent.trim());
          const tryObj = (obj)=> {
            if(obj.headline && !title) title = obj.headline;
            if(obj.datePublished && !datePublished) datePublished = obj.datePublished;
            if(obj.articleBody && !articleText) articleText = obj.articleBody;
          };
          if (Array.isArray(json)) json.forEach(tryObj);
          else tryObj(json);
        }catch{/* ignore */}
        if (articleText) break;
      }

      // fallback: основен <article>
      if(!articleText){
        const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
        if (main) articleText = main.innerText.trim();
      }

      if(!articleText) articleText = '⚠️ Не е намерен articleBody в JSON-LD.';

      const fDate = datePublished ? (()=>{ const d=new Date(datePublished); return isNaN(d)?'':d.toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}) })() : '';

      const paras = articleText
        .split(/\n{1,}/)
        .map(s => s.trim())
        .filter(Boolean)
        .map((p,i)=> `<p class="${i===0?'lead':''}">${p}</p>`)
        .join('');

      readerContent.innerHTML = `
        ${fDate?`<div class="reader-date">🕒 ${fDate}</div>`:''}
        ${title?`<p class="lead">${title}</p>`:''}
        ${paras}
      `;

      reader.style.display = 'block';
      reader.setAttribute('aria-hidden', 'false');
      setStatus('');
    }catch(e){
      console.error(e);
      setStatus('❌ Грешка при зареждане: '+e.message);
    }
  };
});
