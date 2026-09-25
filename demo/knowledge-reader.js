(function () {
  const reader = document.getElementById("knowledge-reader");
  const topbarTitle = document.getElementById("knowledge-topbar-title");
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

  function renderBlock(block) {
    if (block.type === "paragraph") return `<p class="knowledge-paragraph">${escapeHtml(block.text)}</p>`;
    if (block.type === "heading") return `<h3>${escapeHtml(block.title)}</h3>`;
    if (block.type === "image") return `<figure class="knowledge-image"><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" loading="lazy" onerror="this.closest('figure').classList.add('image-unavailable'); this.remove();" /><figcaption>${escapeHtml(block.caption || block.alt)}</figcaption></figure>`;
    if (block.type === "factTable") return `<table class="knowledge-fact-table"><tbody>${block.rows.map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>`;
    if (block.type === "comparison") return `<table class="knowledge-comparison"><thead><tr>${block.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    if (block.type === "insight" || block.type === "risk") return `<aside class="knowledge-${block.type}"><div class="knowledge-callout-label">${escapeHtml(block.label)}</div><p>${escapeHtml(block.text)}</p></aside>`;
    if (block.type === "timeline") return `<div class="knowledge-timeline">${block.items.map(([year, text]) => `<div class="knowledge-timeline-item"><strong>${escapeHtml(year)}</strong><span>${escapeHtml(text)}</span></div>`).join("")}</div>`;
    if (block.type === "network") return `<div class="knowledge-network">${block.nodes.map((node, index) => `<div class="knowledge-network-node${index === 0 ? " primary" : ""}">${escapeHtml(node)}</div>`).join("")}</div>`;
    if (block.type === "sources") return `<ol class="knowledge-source-list">${block.items.map(([name, url]) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a></li>`).join("")}</ol>`;
    return "";
  }

  function render(article) {
    topbarTitle.textContent = article.title;
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

  function open(slug) {
    const article = articles[slug];
    if (!article) return false;
    render(article);
    closeToc();
    reader.hidden = false;
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
