// RSS от YouTube канал: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
async function fetchChannelRSS(channelId){
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const prox   = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(prox, {mode:'cors'});
  if(!res.ok) throw new Error('HTTP '+res.status);
  const xml = await res.text();
  return parseXML(xml);
}

function buildVideoCard(entry){
  const title = entry.querySelector('title')?.textContent?.trim() || '(video)';
  const link  = entry.querySelector('link')?.getAttribute('href') || '';
  const vid   = entry.querySelector('yt\\:videoId, videoId')?.textContent || '';
  const pub   = entry.querySelector('published')?.textContent || '';
  const iso   = pub ? new Date(pub).toISOString() : '';
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '';

  const card = document.createElement('div');
  card.className = 'card-row video';
  if (iso) card.dataset.date = iso;

  card.innerHTML = `
    <div class="thumb">${thumb?`<img src="${thumb}" alt="">`:'<span>no image</span>'}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title"><a href="#">${title}</a></h3>
        ${iso?`<div class="meta-date">🕒 ${new Date(iso).toLocaleString('bg-BG',{dateStyle:'medium', timeStyle:'short'})}</div>`:''}
      </div>
      <div class="meta">YouTube • ${vid}</div>
    </div>
  `;
  card.querySelector('a').addEventListener('click', e=>{
    e.preventDefault();
    if(!vid) return;
    openVideoInReader(vid, title, iso);
  });
  return card;
}

async function loadVideosFromChannel(channelId){
  setStatus('⏳ Зареждам видеа…');
  try{
    const listEl = $('#list'); listEl.innerHTML = '';
    const xml = await fetchChannelRSS(channelId);
    const entries = Array.from(xml.querySelectorAll('entry'));
    if(!entries.length){
      listEl.innerHTML = '<div class="placeholder">Няма видеа.</div>';
      setStatus('');
      return;
    }
    entries.forEach(en => listEl.appendChild(buildVideoCard(en)));
    setStatus('');
  }catch(e){
    setStatus('❌ Грешка при зареждане: '+e.message);
  }
}