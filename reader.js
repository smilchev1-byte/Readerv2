// JSON-LD extractor (вкл. @graph)
function extractArticleFromLdJson(html){
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const pickDate = o => o?.dateModified || o?.datePublished || null;

  const tryOne = obj => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj.articleBody) return { body: obj.articleBody, date: pickDate(obj) };
    if (Array.isArray(obj)) { for (const it of obj) { const r = tryOne(it); if (r) return r; } }
    if (obj['@graph']) return tryOne(obj['@graph']);
    if (obj.mainEntityOfPage) return tryOne(obj.mainEntityOfPage);
    return null;
  };

  for (const tag of scripts) {
    try {
      const jsonText = tag.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1];
      const data = JSON.parse(jsonText);
      const found = tryOne(data);
      if (found) return found;
    } catch {}
  }
  return null;
}

// Разбиване на текста на абзаци (по ~3 изречения)
function splitIntoSentenceParagraphs(text, groupSize = 3){
  const sentenceRegex = /[^.!?]+[.!?]+["']?\s*/g;
  const sentences = text.match(sentenceRegex) || [text];
  const groups = [];
  for (let i = 0; i < sentences.length; i += groupSize) {
    const group = sentences.slice(i, i + groupSize).join(' ').trim();
    if (group) groups.push(group);
  }
  return groups;
}

// Основен четец
const reader = $('#reader'), readerContent = $('#readerContent');
$('#readerClose').addEventListener('click', ()=>{ reader.style.display='none'; reader.setAttribute('aria-hidden','true'); readerContent.innerHTML=''; });
reader.addEventListener('click', e=>{ if(e.target.classList.contains('reader-backdrop')){ reader.style.display='none'; reader.setAttribute('aria-hidden','true'); readerContent.innerHTML=''; } });

function extractArticleFromMain(doc){
  const main = doc.querySelector('article, .article, .post-content, [itemprop="articleBody"]');
  if (main){ sanitize(main); return main.innerText.trim(); }
  return '';
}

async function openReader(url){
  if (!url) { setStatus('❌ Невалиден URL за статия.'); return; }
  setStatus('⏳ Зареждам статия…');
  try{
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res  = await fetch(prox, { mode:'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const doc  = parseHTML(html);

    const fromLd = extractArticleFromLdJson(html);
    let articleText = fromLd?.body || '';
    let dateText    = fromLd?.date || '';

    if (!articleText) articleText = extractArticleFromMain(doc);

    if (!dateText) {
      const t = doc.querySelector('time[datetime], meta[property="article:published_time"]');
      dateText = t ? (t.getAttribute?.('datetime') || t.content || '') : '';
    }
    let fDate = '';
    if (dateText) {
      const d = new Date(dateText);
      if (!isNaN(d)) fDate = d.toLocaleString('bg-BG',{dateStyle:'medium', timeStyle:'short'});
    }

    const pic = doc.querySelector('picture.img--title.landscape, article picture, .article picture, figure picture');
    const imgHTML = pic ? pic.outerHTML : '';

    if (articleText) {
      const paras = splitIntoSentenceParagraphs(articleText, 3);
      readerContent.innerHTML = `${imgHTML}${fDate?`<div class="reader-date">🕒 ${fDate}</div>`:''}${paras.map((p,i)=>`<p class="${i===0?'lead':''}">${p}</p>`).join('')}`;
      reader.style.display='block';
      reader.setAttribute('aria-hidden','false');
      setStatus('');
    } else {
      setStatus('❌ Не успях да извлека съдържанието на статията.');
    }
  }catch(e){
    setStatus('❌ Грешка при зареждане: '+e.message);
  }
}
