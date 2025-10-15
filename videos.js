// ============================
// ✅ videos.js — стабилно зареждане на YouTube видеа
// ============================

// YouTube RSS канал: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
async function fetchChannelRSS(channelId) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const prox = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

    const res = await fetch(prox, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const xml = await res.text();
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'application/xml');
  } catch (err) {
    throw new Error('RSS грешка: ' + err.message);
  }
}

// Създаване на карта за видео
function buildVideoCard(entry) {
  const title = entry.querySelector('title')?.textContent?.trim() || '(Видео)';
  const vid = entry.querySelector('yt\\:videoId, videoId')?.textContent || '';
  const pub = entry.querySelector('published')?.textContent || '';
  const iso = pub ? new Date(pub).toISOString() : '';
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '';

  const card = document.createElement('div');
  card.className = 'card-row video';
  if (iso) card.dataset.date = iso;
  if (vid) card.dataset.video = vid;

  card.innerHTML = `
    <div class="thumb">
      ${thumb ? `<img src="${thumb}" alt="thumb">` : '<span>no image</span>'}
    </div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title">
          <a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener noreferrer">${title}</a>
        </h3>
        ${iso ? `<div class="meta-date">🕒 ${new Date(iso).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })}</div>` : ''}
      </div>
      <div class="meta">YouTube</div>
    </div>`;

  // Отваряне в четеца (и за Safari)
  const open = () => {
    if (vid) openVideoInReader(vid, title, iso);
    else setStatus('❌ Липсва videoId.');
  };
  card.querySelector('a').addEventListener('click', e => { e.preventDefault(); open(); });
  card.addEventListener('click', open);

  return card;
}

// Зареждане на видеа от канал
async function loadVideosFromChannel(channelId) {
  const listEl = document.getElementById('list');
  setStatus('⏳ Зареждам видеа...');
  listEl.innerHTML = '<div class="placeholder">Зареждам...</div>';

  try {
    const xml = await fetchChannelRSS(channelId);
    const entries = Array.from(xml.querySelectorAll('entry'));
    if (!entries.length) {
      listEl.innerHTML = '<div class="placeholder">❌ Няма видеа за показване.</div>';
      setStatus('');
      return;
    }

    listEl.innerHTML = '';
    entries.forEach(entry => listEl.appendChild(buildVideoCard(entry)));
    setStatus('');
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<div class="placeholder">❌ Грешка: ${err.message}</div>`;
    setStatus('❌ Грешка при зареждане: ' + err.message);
  }
}
