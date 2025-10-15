// ============================
// ✅ parser.js — универсален, работещ и в Safari
// ============================

const SELECTORS = [
  'article',
  '.article-item',
  '.post',
  '.news-item',
  '.story',
  '.c-article',
  '.l-article'
].join(',');

let __newsReqId = 0;

// ====== Функция за извличане на HTML чрез няколко проксита ======
async function fetchHTMLwithFallback(url) {
  const urls = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  ];
  let lastErr;
  for (const prox of urls) {
    try {
      const res = await fetch(`${prox}&t=${Date.now()}`, { cache: "no-store", mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text && text.length > 100) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Всички proxy опити неуспешни");
}

// ====== Избор на блокове със статии ======
function selectRawBlocks(doc) {
  return Array.from(doc.querySelectorAll(SELECTORS));
}

// ====== Генериране на карта ======
function toCardElement(rawHTML, baseHref) {
  const fragDoc = parseHTML("<div id='wrap'>" + rawHTML + "</div>");
  const wrap = fragDoc.getElementById("wrap");
  sanitize(wrap);
  fixRelativeURLs(wrap, baseHref);

  const img = wrap.querySelector("img");
  const imgSrc = img?.getAttribute("src") || "";

  const h = wrap.querySelector("h1,h2,h3,h4");
  const title = (h?.textContent || wrap.querySelector("a[href]")?.textContent || "(без заглавие)").trim();

  const rawLink =
    h?.querySelector("a[href]")?.getAttribute("href") ||
    wrap.querySelector("a[href]")?.getAttribute("href") ||
    "";
  const linkAbs = rawLink ? absURL(baseHref, rawLink) : "";

  let isoDate = "",
    formattedDate = "";
  const t = wrap.querySelector("time[datetime]") || wrap.querySelector('meta[property="article:published_time"]');
  const dateText = t ? t.getAttribute("datetime") || t.content || "" : "";
  if (dateText) {
    const d = new Date(dateText);
    if (!isNaN(d)) {
      isoDate = d.toISOString();
      formattedDate = d.toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" });
    }
  }

  const breadcrumb = wrap.querySelector("li.breadcrumb-item, .category, .news-category");
  const category = breadcrumb ? breadcrumb.textContent.trim() : "";

  let source = "";
  try {
    source = new URL(baseHref).hostname.replace(/^www\./, "");
  } catch {}

  const card = document.createElement("div");
  card.className = "card-row";
  if (isoDate) card.dataset.date = isoDate;
  if (category) card.dataset.category = category;
  if (linkAbs) card.dataset.href = linkAbs;

  card.innerHTML = `
    <div class="thumb">${imgSrc ? `<img src="${imgSrc}" alt="">` : "<span>no image</span>"}</div>
    <div class="right-side">
      <div class="header-row">
        <h3 class="title">
          <a href="${linkAbs || "#"}" target="_blank" rel="noopener noreferrer">${title}</a>
        </h3>
        ${formattedDate ? `<div class="meta-date">🕒 ${formattedDate}</div>` : ""}
      </div>
      <div class="meta">${source}${category ? ` • ${category}` : ""}</div>
    </div>`;

  card.querySelector("a").addEventListener("click", (e) => {
    e.preventDefault();
    const href = card.dataset.href || "";
    if (!href) return setStatus("❌ Липсва линк към статия.");
    openReader(href);
  });

  return card;
}

// ====== Импорт на URL ======
async function importURL(url) {
  if (!url) return setStatus("Невалиден URL.");
  const reqId = ++__newsReqId;
  setStatus("⏳ Зареждам новини…");

  try {
    const html = await fetchHTMLwithFallback(url);
    if (reqId !== __newsReqId) return; // игнорирай старите заявки
    const doc = parseHTML(html);
    renderCardsFromDoc(doc, url);
    setStatus("");
  } catch (e) {
    console.error(e);
    setStatus("❌ CORS/HTTP грешка: " + e.message);
    const listEl = $("#list");
    listEl.innerHTML = `<div class="placeholder">❌ Неуспешно зареждане на новини.<br>${e.message}</div>`;
  }
}

// ====== Визуализиране на картите ======
function renderCardsFromDoc(doc, baseHref) {
  const listEl = $("#list");
  listEl.innerHTML = "";
  const raw = selectRawBlocks(doc);
  if (!raw.length) {
    listEl.innerHTML = '<div class="placeholder">Няма намерени елементи.</div>';
    return;
  }
  raw.forEach((node) => listEl.appendChild(toCardElement(node.outerHTML, baseHref)));
  populateCategories();
}
