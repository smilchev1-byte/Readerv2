// ===========================
// utils.js (автоматично избира селектори по сайт)
// ===========================

// 📰 Икона по подразбиране
const DEFAULT_ICON = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/1f4f0.svg';

// Базови помощни функции
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function setStatus(msg){ const el = $('#status'); if (el) el.textContent = msg || ''; }

function parseHTML(html){ return new DOMParser().parseFromString(html, 'text/html'); }
function parseXML(xml){ return new DOMParser().parseFromString(xml, 'application/xml'); }
function sanitize(node){ node.querySelectorAll('script,style,iframe,object,embed,noscript').forEach(n=>n.remove()); return node; }
function absURL(base, rel){ try { return new URL(rel, base).href } catch { return rel } }

function fixRelativeURLs(node, baseHref){
  node.querySelectorAll('[href]').forEach(a => a.setAttribute('href', absURL(baseHref, a.getAttribute('href'))));
  node.querySelectorAll('[src]').forEach(el => el.setAttribute('src', absURL(baseHref, el.getAttribute('src'))));
  node.querySelectorAll('[srcset]').forEach(el=>{
    const parts=(el.getAttribute('srcset')||'').split(',').map(s=>s.trim()).filter(Boolean);
    el.setAttribute('srcset', parts.map(p=>{const [u,d]=p.split(/\s+/); return absURL(baseHref,u)+(d?(' '+d):'')}).join(', '));
  });
  return node;
}

// =============================================
// 🧩 Автоматичен избор на селектори по hostname
// =============================================

function getSelectorsForHost(baseHref) {
  let host = '';
  try { host = new URL(baseHref).hostname.replace(/^www\./, ''); } catch {}

  // Избира селектори според домейна
  switch (true) {
    case /dariknews\.bg/.test(host):
      return '.article__item, .article-item, article.news';
    case /btvnovinite\.bg/.test(host):
      return '.article-item, article.teaser, article.news';
    case /dnevnik\.bg/.test(host):
      return '.article-item, .media-object, article.article-preview';
    case /offnews\.bg/.test(host):
      return 'article, .news-item, .story';
    case /mediapool\.bg/.test(host):
      return 'article, .article, .article-item';
    case /capital\.bg/.test(host):
      return '.article-item, article.article-preview, .news-item';
    default:
      // fallback — запазваме оригиналния ти селектор
      return 'div.card.pt-4.pb-4.ad0, div.card.pt-4.pb-4.ad3, article, .article-item, .story';
  }
}

// Главна функция за избор на блокове
function selectRawBlocks(doc, baseHref){
  const selectors = getSelectorsForHost(baseHref);
  const nodes = Array.from(doc.querySelectorAll(selectors));
  console.log('🌐 Избран селектор:', selectors, '| намерени елементи:', nodes.length);
  return nodes;
}

// =============================================
// Времеви филтри
// =============================================

function applyDateFilter(filter){
  const now = new Date();
  $$('.card-row').forEach(card=>{
    const dStr = card.dataset.date;
    if(!dStr){ card.style.display=''; return; }
    const d = new Date(dStr);
    let show = true;
    if(filter === 'today') show = d.toDateString() === now.toDateString();
    else if(filter === 'week') show = (now - d)/(1000*60*60*24) <= 7;
    else if(filter === 'month') show = (now - d)/(1000*60*60*24) <= 31;
    card.style.display = show ? '' : 'none';
  });
}

// =============================================
// Категории за новини
// =============================================

function populateCategories(){
  const select = $('#categorySelect'); if(!select) return;
  const cats = new Set();
  $$('.card-row[data-category]').forEach(c=>{ if(c.dataset.category) cats.add(c.dataset.category); });
  select.innerHTML = '<option value="all">Всички</option>' + [...cats].sort().map(c=>`<option>${c}</option>`).join('');
}