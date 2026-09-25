import { siteConfig } from "./config.js";

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const editionDate = document.querySelector("#edition-date");
if (editionDate) {
  editionDate.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  }).format(new Date());
}

const menuButton = document.querySelector(".menu-button");
const mainNav = document.querySelector("#main-nav");
menuButton?.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

const newsletterForm = document.querySelector("#newsletter-form");
newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#newsletter-feedback");
  if (feedback) feedback.textContent = "Obrigado. A lista de leitura será ativada em breve.";
  newsletterForm.reset();
});

const grid = document.querySelector("#news-grid");
const emptyState = document.querySelector("#hub-empty");
const hubLabel = document.querySelector("[data-hub-label]");
const hubStatus = document.querySelector("[data-hub-state]");
const retryButton = document.querySelector("#hub-retry");
const refreshButton = document.querySelector("#hub-refresh");
const filterBar = document.querySelector("#category-filter");
const categorySections = document.querySelector("#category-sections");
const heroImage = document.querySelector(".lead-image-wrap img");
const heroLabel = document.querySelector(".image-label");
const heroTitle = document.querySelector(".lead-copy h2");
const heroSummary = document.querySelector(".lead-copy .summary");
const heroLink = document.querySelector(".lead-copy .text-link");
const briefs = [...document.querySelectorAll(".side-briefs .brief")];

let hubArticles = [];
let activeCategory = "all";
let refreshTimer;

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

const safeUrl = (value) => {
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
};

const articleList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.articles)) return payload.articles;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const articleTitle = (article) => article.title || article.headline || article.name || "Matéria da redação";
const articleDescription = (article) => article.description || article.excerpt || article.summary || "Leia a matéria completa no Correio da Manhã.";
const articleCategory = (article) => article.category || article.section || "Barra";
const articleDate = (article) => article.published_at || article.publishedAt || article.created_at || article.updated_at;
const articleHref = (article) => safeUrl(article.canonical_url || article.article_url || article.source_url || article.url || "#");
const articleImage = (article) => article.image_url || article.image || "";
const formattedDate = (date) => {
  if (!date) return "Atualizado agora";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Atualizado agora" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(parsed);
};

const articleCard = (article, index = 0, compact = false) => {
  const title = articleTitle(article);
  const description = articleDescription(article);
  const category = articleCategory(article);
  const href = articleHref(article);
  const image = articleImage(article);
  const imageMarkup = image ? `<img src="${escapeHtml(safeUrl(image))}" alt="" loading="lazy" />` : "";
  return `<article class="news-card hub-card ${index === 0 && !compact ? "featured-card" : ""}">
    ${imageMarkup}
    <p class="eyebrow">${escapeHtml(category)}</p>
    <h3><a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h3>
    <p>${escapeHtml(description)}</p>
    <span class="card-meta">${escapeHtml(formattedDate(articleDate(article)))}</span>
    <span class="article-source">Correio da Manhã</span>
  </article>`;
};

const sectionCard = (article) => {
  const title = articleTitle(article);
  const image = articleImage(article);
  const imageMarkup = image ? `<img src="${escapeHtml(safeUrl(image))}" alt="" loading="lazy" />` : "";
  return `<article class="section-card">
    ${imageMarkup}
    <div><p class="eyebrow">${escapeHtml(articleCategory(article))}</p>
    <h3><a href="${escapeHtml(articleHref(article))}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h3>
    <p>${escapeHtml(formattedDate(articleDate(article)))}</p></div>
  </article>`;
};

const filteredArticles = () => activeCategory === "all"
  ? hubArticles
  : hubArticles.filter((article) => articleCategory(article).toLowerCase() === activeCategory);

const updateStatus = (label, loading = false) => {
  if (hubLabel) hubLabel.textContent = label;
  hubStatus?.classList.toggle("is-loading", loading);
};

const renderFilters = () => {
  if (!filterBar) return;
  const categories = [...new Set(hubArticles.map(articleCategory).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  filterBar.innerHTML = [
    { label: "Todas", value: "all" },
    ...categories.map((category) => ({ label: category, value: category.toLowerCase() }))
  ].map(({ label, value }) => `<button type="button" class="filter-chip ${value === activeCategory ? "active" : ""}" data-category="${escapeHtml(value)}" role="tab" aria-selected="${value === activeCategory}">${escapeHtml(label)}</button>`).join("");
  filterBar.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";
      renderFilters();
      renderGrid();
    });
  });
};

const renderGrid = () => {
  if (!grid) return;
  const articles = filteredArticles().slice(0, siteConfig.maxArticles || 12);
  grid.innerHTML = articles.length
    ? articles.map((article, index) => articleCard(article, index)).join("")
    : "";
  if (emptyState) emptyState.hidden = articles.length > 0;
};

const renderCategorySections = () => {
  if (!categorySections) return;
  const groups = [...new Map(hubArticles.map((article) => [articleCategory(article), articleCategory(article)])).keys()]
    .filter(Boolean).slice(0, 4);
  categorySections.innerHTML = groups.map((category) => {
    const articles = hubArticles.filter((article) => articleCategory(article) === category).slice(0, 4);
    return `<section class="category-section">
      <div class="category-section-heading"><span class="eyebrow">${escapeHtml(category)}</span><span class="category-count">${articles.length} matérias</span></div>
      <div class="category-section-grid">${articles.map(sectionCard).join("")}</div>
    </section>`;
  }).join("");
};

const updateHero = () => {
  const [lead, ...rest] = hubArticles;
  if (!lead) return;
  const image = articleImage(lead);
  if (image && heroImage) {
    heroImage.src = safeUrl(image);
    heroImage.alt = escapeHtml(articleTitle(lead));
  }
  if (heroLabel) heroLabel.textContent = articleCategory(lead);
  if (heroTitle) heroTitle.textContent = articleTitle(lead);
  if (heroSummary) heroSummary.textContent = articleDescription(lead);
  if (heroLink) {
    heroLink.href = articleHref(lead);
    heroLink.target = "_blank";
    heroLink.rel = "noopener";
    heroLink.innerHTML = 'Ler no Correio da Manhã <span aria-hidden="true">↗</span>';
  }
  briefs.forEach((brief, index) => {
    const article = rest[index];
    if (!article) return;
    const title = brief.querySelector("h3");
    const eyebrow = brief.querySelector(".eyebrow");
    const meta = brief.querySelector(".brief-meta");
    if (eyebrow) eyebrow.textContent = articleCategory(article);
    if (title) title.innerHTML = `<a href="${escapeHtml(articleHref(article))}" target="_blank" rel="noopener">${escapeHtml(articleTitle(article))}</a>`;
    if (meta) meta.textContent = `Correio da Manhã · ${formattedDate(articleDate(article))}`;
  });
};

async function loadHubNews({ quiet = false } = {}) {
  if (!siteConfig.hubEnabled || !grid) return;
  if (!quiet) updateStatus("Buscando atualização", true);
  const url = new URL(siteConfig.hubEndpoint, siteConfig.hubOrigin);
  url.searchParams.set("domain", siteConfig.domain);
  url.searchParams.set("refresh", String(Date.now()));
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Hub respondeu ${response.status}`);
    const articles = articleList(await response.json()).filter(Boolean);
    hubArticles = articles;
    if (!articles.length) {
      updateStatus("Hub conectado, aguardando matérias");
      renderGrid();
      renderCategorySections();
      return;
    }
    activeCategory = "all";
    renderFilters();
    renderGrid();
    renderCategorySections();
    updateHero();
    updateStatus(`Atualizado pelo Hub · ${articles.length} matérias`);
  } catch (error) {
    console.warn("Não foi possível atualizar pelo Content Hub:", error);
    updateStatus("Edição local · Hub indisponível");
  } finally {
    hubStatus?.classList.remove("is-loading");
  }
}

retryButton?.addEventListener("click", () => loadHubNews());
refreshButton?.addEventListener("click", () => loadHubNews());
loadHubNews();
refreshTimer = window.setInterval(() => loadHubNews({ quiet: true }), siteConfig.refreshIntervalMs || 300000);
window.addEventListener("focus", () => loadHubNews({ quiet: true }));
