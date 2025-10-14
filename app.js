(() => {
  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const $sidebar = qs('#sidebar');
  const $sidebarToggle = qs('#sidebarToggle');
  const $tabs = qsa('.tab');
  const $panels = qsa('.panel');

  // State
  const state = {
    tab: 'news',
    topics: ['Tech', 'Economy', 'Sports', 'BG', 'World', 'Science', 'Auto', 'Crypto'],
  };

  // Render topics
  const topicsList = qs('#topicsList');
  state.topics.forEach(t => {
    const li = document.createElement('li'); li.textContent = t;
    topicsList.appendChild(li);
  });

  // Sidebar toggle (works on iPhone)
  const openSidebar = () => {
    $sidebar.classList.add('is-open');
    $sidebarToggle.setAttribute('aria-expanded', 'true');
    // prevent background scroll on iOS
    document.body.style.overflow = 'hidden';
  };
  const closeSidebar = () => {
    $sidebar.classList.remove('is-open');
    $sidebarToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  $sidebarToggle.addEventListener('click', () => {
    const isOpen = $sidebar.classList.contains('is-open');
    isOpen ? closeSidebar() : openSidebar();
  });
  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', (e) => {
    const isOpen = $sidebar.classList.contains('is-open');
    if (!isOpen) return;
    const within = e.target.closest('#sidebar') || e.target.closest('#sidebarToggle');
    if (!within) closeSidebar();
  });

  // Tabs
  $tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (state.tab === target) return;
      state.tab = target;
      $tabs.forEach(b => b.classList.toggle('is-active', b === btn));
      $tabs.forEach(b => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));
      $panels.forEach(p => p.classList.toggle('is-visible', p.id === target));
    });
  });

  // Sample data loader (replace with your feed pipeline)
  const newsData = [
    { title: 'ЕЦБ остави лихвите без промяна', date: '2025-10-10', src: 'Bloom', img: 'https://i.ytimg.com/vi/2vjPBrBU-TM/hqdefault.jpg', url: 'https://example.com/news1', snippet: 'Централната банка сигнализира за по-дълъг период на стабилни лихви.' },
    { title: 'Нов завод за батерии в Пловдив', date: '2025-10-12', src: 'Local', img: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg', url: 'https://example.com/news2', snippet: 'Инвестиция от 200 млн. евро и 1200 работни места.' },
  ];
  const videoData = [
    { title: 'Tech обзор седмицата', date: '2025-10-13', channel: 'TechBG', ytId: 'dQw4w9WgXcQ', img: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
    { title: 'Финанси на прост език', date: '2025-10-11', channel: 'Finance101', ytId: 'kXYiU_JCYtU', img: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg' },
  ];

  // Renderers
  const newsTpl = qs('#newsCardTpl');
  const newsList = qs('#newsList');
  newsData.forEach(n => {
    const node = newsTpl.content.cloneNode(true);
    qs('.thumb', node).src = n.img;
    qs('.title', node).textContent = n.title;
    qs('.meta', node).textContent = `${n.src} • ${new Date(n.date).toLocaleDateString()}`;
    qs('.snippet', node).textContent = n.snippet;
    const link = qs('.read-more', node);
    link.href = n.url;
    newsList.appendChild(node);
  });

  const videoTpl = qs('#videoCardTpl');
  const videosList = qs('#videosList');
  videoData.forEach(v => {
    const node = videoTpl.content.cloneNode(true);
    qs('.thumb', node).src = v.img;
    qs('.title', node).textContent = v.title;
    qs('.meta', node).textContent = `${v.channel} • ${new Date(v.date).toLocaleDateString()}`;
    const btn = qs('.play-btn', node);
    const a = qs('.open-youtube', node);
    const webUrl = `https://www.youtube.com/watch?v=${v.ytId}`;
    a.href = webUrl; a.target = '_blank'; a.rel = 'noopener noreferrer';
    const openInApp = () => openYouTubeDeep(v.ytId, webUrl);
    btn.addEventListener('click', openInApp);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openInApp();
    });
    videosList.appendChild(node);
  });

  // Deep link to YouTube app with graceful fallback
  function openYouTubeDeep(ytId, fallbackUrl) {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    let deepLink = `vnd.youtube://watch?v=${ytId}`;
    if (isIOS) deepLink = `youtube://www.youtube.com/watch?v=${ytId}`;
    if (isAndroid) deepLink = `vnd.youtube://watch?v=${ytId}`;

    // Try opening the app
    const timeout = setTimeout(() => {
      // Fallback to web if app not available
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }, 700);

    // On iOS, changing location works best for deep links
    if (isIOS) {
      window.location.href = deepLink;
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1500);
    }

    // Clear timeout if page becomes hidden (app opened)
    const onHidden = () => { clearTimeout(timeout); document.removeEventListener('visibilitychange', onHidden); };
    document.addEventListener('visibilitychange', onHidden);
  }

  // Ensure panels toggle visibility with CSS class
  qsa('.panel').forEach(p => {
    if (!p.classList.contains('is-visible')) p.style.display = 'none';
  });
  const updatePanels = () => {
    qsa('.panel').forEach(p => {
      const show = p.classList.contains('is-visible');
      p.style.display = show ? '' : 'none';
    });
  };
  const observer = new MutationObserver(updatePanels);
  qsa('.panel').forEach(p => observer.observe(p, { attributes: true, attributeFilter: ['class'] }));
  updatePanels();
})();
