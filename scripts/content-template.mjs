import {
  CATEGORY_KEYS,
  LOCALES,
  SITE_URL,
  articleIndexUrl,
  categoryUrl,
} from "./content-model.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMenuIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>`;
}

function renderChevronIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;
}

function navLink(href, label, active = false) {
  return `<a href="${escapeHtml(href)}"${active ? ' aria-current="page" class="is-active"' : ""}>${escapeHtml(label)}</a>`;
}

function renderLanguageMenu(locale, languageUrls) {
  const links = Object.values(LOCALES)
    .map((targetLocale) => navLink(languageUrls[targetLocale.key], targetLocale.key === "zh" ? "简体中文" : targetLocale.key === "kz" ? "Қазақша" : "قازاقشا", targetLocale.key === locale.key))
    .join("");

  return `<details class="content-language">
    <summary>${escapeHtml(locale.chooseLanguage)}${renderChevronIcon()}</summary>
    <div class="content-language__menu">${links}</div>
  </details>`;
}

function renderHeader({ locale, active, languageUrls }) {
  return `<header class="content-header">
    <div class="content-header__inner">
      <a class="content-brand" href="${locale.prefix}/">
        <img src="/images/logo.png" alt="${escapeHtml(locale.siteName)}" width="128" height="42">
        <span>${escapeHtml(locale.siteName)}</span>
      </a>
      <button class="content-menu-button" type="button" aria-expanded="false" aria-controls="content-navigation" title="Menu">
        ${renderMenuIcon()}<span class="sr-only">Menu</span>
      </button>
      <nav class="content-nav" id="content-navigation" aria-label="Primary navigation">
        ${navLink(`${locale.prefix || ""}/`, locale.home, active === "home")}
        ${navLink(articleIndexUrl(locale.key), locale.articles, active === "articles")}
        ${navLink(`${locale.prefix}/about/`, locale.about, active === "about")}
        ${renderLanguageMenu(locale, languageUrls)}
      </nav>
    </div>
  </header>`;
}

function renderDocument({ locale, title, description, canonicalPath, active, languageUrls, body, article = false }) {
  return `<!doctype html>
<html lang="${locale.htmlLang}" dir="${locale.dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | ${escapeHtml(locale.siteName)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${SITE_URL}${escapeHtml(canonicalPath)}">
    <link rel="icon" href="/images/logo.jpg">
    <link rel="stylesheet" href="/assets/css/0.styles.c08026f3.css">
    <link rel="stylesheet" href="/assets/css/rtl.css">
    <link rel="stylesheet" href="/assets/css/content-site.css">
  </head>
  <body class="content-site${article ? " content-site--article" : ""}">
    ${renderHeader({ locale, active, languageUrls })}
    ${body}
    <footer class="content-footer">
      <a href="${locale.prefix}/">${escapeHtml(locale.siteName)}</a>
      <span>© ${new Date().getUTCFullYear()} Sarmay</span>
    </footer>
    <script src="/assets/js/content-site.js" defer></script>
  </body>
</html>`;
}

function formatDate(date, locale) {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale.htmlLang, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function searchableText(article) {
  return [article.title, article.description, article.category, ...article.tags].join(" ").toLocaleLowerCase();
}

function renderArticleRow(article, locale) {
  const date = formatDate(article.date, locale);
  const tags = article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const status = !article.published
    ? `<span class="article-status article-status--draft">${escapeHtml(locale.draft)}</span>`
    : article.legacy
      ? `<span class="article-status">${escapeHtml(locale.legacy)}</span>`
      : "";

  return `<article class="article-row" data-article-row data-search="${escapeHtml(searchableText(article))}">
    <div class="article-row__meta">
      ${date ? `<time datetime="${article.date}">${escapeHtml(date)}</time>` : ""}
      ${status}
      <span>${escapeHtml(locale.categories[article.category])}</span>
    </div>
    <h2><a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a></h2>
    <p>${escapeHtml(article.description)}</p>
    ${tags ? `<div class="article-tags" aria-label="Tags">${tags}</div>` : ""}
    <a class="article-row__link" href="${escapeHtml(article.url)}">${escapeHtml(locale.readArticle)}</a>
  </article>`;
}

function languageIndexUrls() {
  return Object.fromEntries(Object.keys(LOCALES).map((language) => [language, articleIndexUrl(language)]));
}

export function renderArticleIndex({ language, articles, category = "" }) {
  const locale = LOCALES[language];
  const visibleArticles = articles.filter((article) => article.language === language && (!category || article.category === category));
  const title = category ? locale.categories[category] : locale.articles;
  const languageUrls = category
    ? Object.fromEntries(Object.keys(LOCALES).map((targetLanguage) => [targetLanguage, categoryUrl(targetLanguage, category)]))
    : languageIndexUrls();
  const tabs = [
    navLink(articleIndexUrl(language), locale.articles, !category),
    ...CATEGORY_KEYS.map((categoryKey) => navLink(categoryUrl(language, categoryKey), locale.categories[categoryKey], category === categoryKey)),
  ].join("");
  const rows = visibleArticles.map((article) => renderArticleRow(article, locale)).join("");

  const body = `<main class="content-main content-main--index">
    <header class="article-index-header">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(visibleArticles.length)} ${escapeHtml(locale.result)}</p>
    </header>
    <nav class="article-category-tabs" aria-label="Categories">${tabs}</nav>
    <div class="article-search">
      <label for="article-search">${escapeHtml(locale.search)}</label>
      <input id="article-search" type="search" data-article-search placeholder="${escapeHtml(locale.searchPlaceholder)}" autocomplete="off">
    </div>
    <p class="article-count" data-article-count aria-live="polite">${escapeHtml(visibleArticles.length)} ${escapeHtml(locale.result)}</p>
    <section class="article-list" aria-label="${escapeHtml(title)}">
      ${rows}
      <p class="article-empty" data-article-empty${visibleArticles.length ? " hidden" : ""}>${escapeHtml(locale.empty)}</p>
    </section>
  </main>`;

  const canonicalPath = category ? categoryUrl(language, category) : articleIndexUrl(language);
  return renderDocument({
    locale,
    title,
    description: `${title} - ${locale.siteName}`,
    canonicalPath,
    active: "articles",
    languageUrls,
    body,
  });
}

function translationUrls(article, allArticles) {
  return Object.fromEntries(Object.keys(LOCALES).map((language) => {
    const translation = article.translationKey
      ? allArticles.find((candidate) => !candidate.legacy && candidate.language === language && candidate.translationKey === article.translationKey)
      : null;
    return [language, translation ? translation.url : articleIndexUrl(language)];
  }));
}

export function renderArticlePage({ article, allArticles, bodyHtml }) {
  const locale = LOCALES[article.language];
  const date = formatDate(article.date, locale);
  const tags = article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const cover = article.cover
    ? `<figure class="article-cover"><img src="${escapeHtml(article.cover)}" alt="" loading="eager"></figure>`
    : "";

  const body = `<main class="content-main content-main--article">
    <article>
      <header class="article-header">
        <a class="article-back" href="${articleIndexUrl(article.language)}">${escapeHtml(locale.backToArticles)}</a>
        <div class="article-header__meta">
          <span>${escapeHtml(locale.categories[article.category])}</span>
          ${!article.published ? `<span class="article-status article-status--draft">${escapeHtml(locale.draft)}</span>` : ""}
        </div>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.description)}</p>
        <div class="article-byline">
          <span>${escapeHtml(locale.publishedAt)}</span>
          <time datetime="${article.date}">${escapeHtml(date)}</time>
        </div>
        ${tags ? `<div class="article-tags" aria-label="Tags">${tags}</div>` : ""}
      </header>
      ${cover}
      <div class="article-body">${bodyHtml}</div>
    </article>
  </main>`;

  return renderDocument({
    locale,
    title: article.title,
    description: article.description,
    canonicalPath: article.url,
    active: "articles",
    languageUrls: translationUrls(article, allArticles),
    body,
    article: true,
  });
}
