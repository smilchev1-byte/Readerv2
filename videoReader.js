// ============================
// 🎬 videoReader.js — отделен четец само за видеа
// ============================

document.addEventListener('DOMContentLoaded', () => {
  const videoReader = document.createElement('div');
  videoReader.id = 'videoReader';
  videoReader.className = 'reader';
  videoReader.style.display = 'none';
  videoReader.innerHTML = `
    <div class="reader-backdrop"></div>
    <div class="reader-panel">
      <div class="reader-bar">
        <div class="reader-title">🎥 Видео</div>
        <button id="videoReaderClose" class="btn">Затвори</button>
      </div>
      <div id="videoReaderContent" class="reader-content"></div>
    </div>`;
  document.body.appendChild(videoReader);

  const videoReaderContent = document.getElementById('videoReaderContent');
  const videoReaderCloseBtn = document.getElementById('videoReaderClose');

  videoReaderCloseBtn?.addEventListener('click', closeVideoReader);
  videoReader.addEventListener('click', e => {
    if (e.target.classList.contains('reader-backdrop')) closeVideoReader();
  });

  function closeVideoReader() {
    videoReader.style.display = 'none';
    videoReader.setAttribute('aria-hidden', 'true');
    videoReaderContent.innerHTML = '';
  }

  // --- Глобално достъпна функция за видеа ---
  window.openVideoInReader = function (videoId, title, publishedISO) {
    if (!videoId) return setStatus('❌ Невалиден videoId.');

    const fDate = publishedISO
      ? new Date(publishedISO).toLocaleString('bg-BG', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : '';

    videoReaderContent.innerHTML = `
      ${fDate ? `<div class="reader-date">🕒 ${fDate}</div>` : ''}
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px">
        <iframe src="https://www.youtube.com/embed/${videoId}" title="${title||'Video Player'}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe>
      </div>
      <p class="lead">${title||''}</p>`;

    videoReader.style.display = 'block';
    videoReader.setAttribute('aria-hidden', 'false');
    setStatus('');
  };
});
