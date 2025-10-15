// videoReader.js — Safari/Chrome стабилен (използва статичния #videoReader от index.html)
document.addEventListener('DOMContentLoaded', () => {
  const videoReader = document.getElementById('videoReader');
  const content = document.getElementById('videoReaderContent');
  const btnClose = document.getElementById('videoReaderClose');

  function closeVideoReader() {
    // спираме видеото в Safari, като чистим src
    const iframe = content.querySelector('iframe');
    if (iframe) iframe.src = 'about:blank';
    content.innerHTML = '';
    videoReader.style.display = 'none';
    videoReader.setAttribute('aria-hidden', 'true');
  }

  btnClose?.addEventListener('click', closeVideoReader);
  videoReader.addEventListener('click', (e) => {
    if (e.target.classList.contains('reader-backdrop')) closeVideoReader();
  });

  // Глобална функция за отваряне (извиква се от videos.js)
  window.openVideoInReader = function openVideoInReader(videoId, title = '', publishedISO = '') {
    if (!videoId) return;

    // дати
    let dateHTML = '';
    if (publishedISO) {
      const d = new Date(publishedISO);
      if (!isNaN(+d)) {
        dateHTML = `<div class="reader-date">🕒 ${d.toLocaleString('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })}</div>`;
      }
    }

    // контейнер за 16:9
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.paddingBottom = '56.25%';
    wrap.style.height = '0';
    wrap.style.overflow = 'hidden';
    wrap.style.borderRadius = '12px';
    wrap.style.marginBottom = '16px';
    wrap.style.WebkitOverflowScrolling = 'touch';

    // Създаваме iframe чрез DOM API (по-надеждно в Safari)
    const iframe = document.createElement('iframe');
    const src = `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&enablejsapi=1`;
    iframe.setAttribute('src', src);
    iframe.setAttribute('title', title || 'Video Player');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('webkitallowfullscreen', '');
    iframe.setAttribute('mozallowfullscreen', '');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    wrap.appendChild(iframe);

    content.innerHTML = `${dateHTML}<p class="lead">${title}</p>`;
    content.insertBefore(wrap, content.firstChild);

    // показване
    videoReader.style.display = 'block';
    videoReader.setAttribute('aria-hidden', 'false');
  };
});
