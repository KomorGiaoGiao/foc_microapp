(function () {
  const reader = document.getElementById("knowledge-reader");
  const articleRoot = document.getElementById("knowledge-article");
  const tocRoot = document.getElementById("knowledge-toc");
  const asideRoot = document.getElementById("knowledge-aside");
  const progressBar = document.getElementById("knowledge-progress-bar");
  const layout = document.querySelector(".knowledge-layout");
  const tocToggle = document.getElementById("knowledge-toc-toggle");
  const tocBackdrop = document.getElementById("knowledge-toc-backdrop");
  const articles = window.KNOWLEDGE_ARTICLES || {};

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return /^https?:$/.test(url.protocol) ? url.href : "#";
    } catch {
      return "#";
    }
  }

  function renderInline(value) {
    const source = String(value || "").replace(/\\([\\`*_{}\[\]()#+.!|>])/g, "$1");
    let html = escapeHtml(source);
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noreferrer">${label}</a>`);
    return html;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let paragraph = [];
    let list = null;
    let quote = [];
    let table = null;
    let code = null;

    const flushParagraph = () => {
      if (paragraph.length) output.push(`<p class="knowledge-paragraph">${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list) return;
      output.push(`<${list.ordered ? "ol" : "ul"} class="knowledge-markdown-list">${list.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${list.ordered ? "ol" : "ul"}>`);
      list = null;
    };
    const flushQuote = () => {
      if (quote.length) output.push(`<aside class="knowledge-markdown-quote">${quote.map((line) => `<p>${renderInline(line)}</p>`).join("")}</aside>`);
      quote = [];
    };
    const flushTable = () => {
      if (!table) return;
      const [header, ...rows] = table;
      output.push(`<table class="knowledge-comparison"><thead><tr>${header.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      table = null;
    };

    const flushAll = () => { flushParagraph(); flushList(); flushQuote(); flushTable(); };
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^```/.test(line)) {
        flushAll();
        if (code === null) code = []; else { output.push(`<pre class="knowledge-code"><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = null; }
        continue;
      }
      if (code !== null) { code.push(line); continue; }
      if (!line.trim()) { flushAll(); continue; }
      const heading = line.match(/^(#{3,6})\s+(.+)$/);
      if (heading) { flushAll(); output.push(`<h3>${renderInline(heading[2])}</h3>`); continue; }
      if (/^---+$/.test(line.trim())) { flushAll(); output.push('<hr class="knowledge-divider" />'); continue; }
      const quoteLine = line.match(/^>\s?(.+)$/);
      if (quoteLine) { flushParagraph(); flushList(); flushTable(); quote.push(quoteLine[1]); continue; }
      if (quote.length) flushQuote();
      const listLine = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
      if (listLine) {
        flushParagraph(); flushTable();
        const ordered = /^\s*\d+\./.test(line);
        if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
        list.items.push(listLine[1]);
        continue;
      }
      if (list) flushList();
      const cells = line.trim().startsWith("|") ? line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()) : null;
      const separator = cells && cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
      if (cells && index + 1 < lines.length) {
        const nextLine = lines[index + 1].trim();
        const nextCells = nextLine.startsWith("|") ? nextLine.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()) : [];
        if (nextCells.length > 0 && nextCells.every((cell) => /^:?-{1,}:?$/.test(cell))) {
          flushParagraph(); flushQuote(); table = [cells]; index += 1; continue;
        }
      }
      if (table && cells) { table.push(cells); continue; }
      if (table) flushTable();
      paragraph.push(line.trim());
    }
    flushAll();
    return output.join("");
  }

  function renderBlock(block) {
    if (block.type === "paragraph") return `<p class="knowledge-paragraph">${escapeHtml(block.text)}</p>`;
    if (block.type === "markdown") return renderMarkdown(block.markdown);
    if (block.type === "heading") return `<h3>${escapeHtml(block.title)}</h3>`;
    if (block.type === "image") return `<figure class="knowledge-image"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" loading="lazy" onerror="this.closest('figure').classList.add('image-unavailable'); this.remove();" /><figcaption>${escapeHtml(block.caption || block.alt)}</figcaption></figure>`;
    if (block.type === "factTable") return `<table class="knowledge-fact-table"><tbody>${block.rows.map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`;
    if (block.type === "comparison") return `<table class="knowledge-comparison"><thead><tr>${block.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    if (block.type === "insight" || block.type === "risk") return `<aside class="knowledge-${block.type}"><div class="knowledge-callout-label">${escapeHtml(block.label)}</div><p>${escapeHtml(block.text)}</p></aside>`;
    if (block.type === "timeline") return `<div class="knowledge-timeline">${block.items.map(([year, text]) => `<div class="knowledge-timeline-item"><strong>${escapeHtml(year)}</strong><span>${escapeHtml(text)}</span></div>`).join("")}</div>`;
    if (block.type === "network") return "";
    if (block.type === "sources") return `<ol class="knowledge-source-list">${block.items.map(([name, url]) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a></li>`).join("")}</ol>`;
    return "";
  }

  function render(article) {
    articleRoot.innerHTML = `
      <header class="knowledge-hero" id="article-top">
        <div class="knowledge-eyebrow">${escapeHtml(article.eyebrow)}</div>
        <h1>${escapeHtml(article.title)}</h1>
        <div class="knowledge-meta"><span>${escapeHtml(article.location)}</span><span>${escapeHtml(article.type)}</span><span>整理时间：${escapeHtml(article.updatedAt)}</span><span class="knowledge-reading-label">${escapeHtml(article.readingTime)}</span></div>
        <p class="knowledge-summary">${escapeHtml(article.summary)}</p>
        <div class="knowledge-tags">${article.keywords.map((keyword) => `<span class="knowledge-tag">${escapeHtml(keyword)}</span>`).join("")}</div>
      </header>
      ${article.sections.map((section) => `<section class="knowledge-section" id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${section.blocks.map(renderBlock).join("")}</section>`).join("")}
    `;
    tocRoot.innerHTML = `<div class="knowledge-toc-title">文章目录</div><a href="#article-top">开篇摘要</a>${article.sections.map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`).join("")}`;
    tocRoot.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeToc));
    asideRoot.innerHTML = article.aside.map(([label, value]) => `<div class="knowledge-aside-block"><div class="knowledge-aside-label">${escapeHtml(label)}</div><div class="knowledge-aside-value">${escapeHtml(value)}</div></div>`).join("");
    layout.scrollTop = 0;
    progressBar.style.width = "0%";
  }

  function setTocOpen(isOpen) {
    tocRoot.classList.toggle("is-open", isOpen);
    tocBackdrop.hidden = !isOpen;
    tocToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function closeToc() {
    setTocOpen(false);
  }

  const loading = new Map();

  function loadArticle(slug) {
    const existing = articles[slug];
    if (existing?.sections) return Promise.resolve(existing);
    const meta = window.KNOWLEDGE_ARTICLE_INDEX?.[slug];
    if (!meta?.path) return Promise.resolve(null);
    if (loading.has(slug)) return loading.get(slug);
    const promise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = meta.path;
      script.onload = () => resolve(articles[slug]?.sections ? articles[slug] : null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
    loading.set(slug, promise);
    return promise;
  }

  async function open(slug) {
    const article = await loadArticle(slug);
    if (!article) return false;
    reader.hidden = false;
    render(article);
    closeToc();
    return true;
  }

  function close() {
    closeToc();
    reader.hidden = true;
    document.dispatchEvent(new CustomEvent("knowledge:closed"));
  }

  document.getElementById("knowledge-close").addEventListener("click", close);
  tocToggle.addEventListener("click", () => setTocOpen(tocToggle.getAttribute("aria-expanded") !== "true"));
  tocBackdrop.addEventListener("click", closeToc);
  layout.addEventListener("scroll", () => {
    const scrollable = layout.scrollHeight - layout.clientHeight;
    const progress = scrollable > 0 ? Math.min(100, (layout.scrollTop / scrollable) * 100) : 0;
    progressBar.style.width = `${progress}%`;
  });

  window.KnowledgeReader = { open, close };
})();
