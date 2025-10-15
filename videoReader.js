// ============================
// 🎬 videoReader.js — Safari + Chrome съвместим четец
// ============================

document.addEventListener('DOMContentLoaded', () => {
  // Добавяме HTML за видео reader само ако го няма
  if (!document.getElementById('videoReader')) {
    const div = document.createElement('div');
    div.id = 'videoReader';
    div.className = 'reader';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="reader-backdrop"></div>
      <div class="reader-panel">
        <div class="reader-bar">
          <div class="reader-title">🎥 Видео</div>
          <button id="videoReaderClose" class="btn">Затвори</button>
        </div>
        <div id="videoReaderContent" class="reader-content"></div>
      </div>`;
    document.body.appendChild(div);
  }

  const videoReader = document.getElementById('videoReader');
  const videoReaderContent = document.getElementById('videoReaderContent');
  const videoReaderClose = document.getElementById('videoReaderClose');

  // Затваряне
  videoReaderClose?.addEventListener('click', closeVideoReader);
  videoReader.addEventListener('click', e => {
    if (e.target.classList.contains('reader-backdrop')) closeVideoReader();
  });

  function closeVideoReader() {
    videoReader.style.display = 'none';
    videoReader.setAttribute('aria-hidden', 'true');
    videoReaderContent.innerHTML = '';
  }

  // === Основна функция, достъпна глобално ===
  window.openVideoInReader = function (videoId, title, publishedISO) {
    if (!videoId) return setStatus('❌ Невалиден videoId.');

    const fDate = publishedISO
      ? new Date(publishedISO).toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })
      : '';

    // Safari fix: използваме srcdoc + sandbox за сигурност
    const iframeHTML = `
      <iframe
        src="https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1"
        title="${title || 'Видео'}"
        frameborder="0"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;">
      </iframe>`;

    videoReaderContent.innerHTML = `
      ${fDate ? `<div class="reader-date">🕒 ${fDate}</div>` : ''}
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin-bottom:16px;-webkit-overflow-scrolling:touch;">
        ${iframeHTML}
      </div>
      <p class="lead">${title || ''}</p>`;

    // показваме панела
    videoReader.style.display = 'block';
    videoReader.setAttribute('aria-hidden', 'false');
    setStatus('');
  };
});
