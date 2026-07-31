(function () {
  "use strict";

  var categoryPattern = /^\/(?:kz\/|qaz\/)?blog\/(frontend|backend|server)\/$/;
  var homeArticlesPromise = null;

  function currentLocale() {
    var pathname = window.location.pathname;
    if (pathname === "/qaz" || pathname.indexOf("/qaz/") === 0) return "qaz";
    if (pathname === "/kz" || pathname.indexOf("/kz/") === 0) return "kz";
    return "zh";
  }

  function articleIndex(locale) {
    if (locale === "qaz") return "/qaz/articles/";
    if (locale === "kz") return "/kz/articles/";
    return "/articles/";
  }

  function articleLabel(locale) {
    if (locale === "qaz") return "بارلىق ماقالالار";
    if (locale === "kz") return "Барлық мақалалар";
    return "全部文章";
  }

  function homeLabels(locale) {
    if (locale === "qaz") {
      return {
        htmlLang: "kk-Arab",
        latest: "سوڭعى ماقالالار",
        viewAll: "بارلىعىن كۆرۋ",
        readArticle: "تولىق وقۋ",
        legacy: "بۇرىنعى ماقالا",
        categories: {
          frontend: "فرونتەند",
          backend: "بەكەند",
          server: "سەرۆەر",
        },
      };
    }

    if (locale === "kz") {
      return {
        htmlLang: "kk-Cyrl",
        latest: "Соңғы мақалалар",
        viewAll: "Барлығын көру",
        readArticle: "Толық оқу",
        legacy: "Бұрынғы мақала",
        categories: {
          frontend: "Фронтенд",
          backend: "Бэкенд",
          server: "Сервер",
        },
      };
    }

    return {
      htmlLang: "zh-CN",
      latest: "最新文章",
      viewAll: "查看全部",
      readArticle: "阅读全文",
      legacy: "历史文章",
      categories: {
        frontend: "前端",
        backend: "后端",
        server: "服务器",
      },
    };
  }

  function isHomePage(locale) {
    var pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    if (locale === "qaz") return pathname === "/qaz";
    if (locale === "kz") return pathname === "/kz";
    return pathname === "/";
  }

  function formatDate(date, htmlLang) {
    if (!date) return "";

    try {
      return new Intl.DateTimeFormat(htmlLang, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(date + "T00:00:00Z"));
    } catch (error) {
      return date;
    }
  }

  function appendTextElement(parent, tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function renderHomeArticles(articles) {
    var locale = currentLocale();
    if (!isHomePage(locale)) return;

    var home = document.querySelector("main.home");
    if (!home || home.querySelector("[data-home-articles]")) return;

    var visibleArticles = articles
      .filter(function (article) {
        return article.language === locale && article.published !== false;
      })
      .slice(0, 3);
    if (!visibleArticles.length) return;

    var labels = homeLabels(locale);
    var section = document.createElement("section");
    var headingId = "latest-articles-" + locale;
    section.className = "legacy-home-articles";
    section.setAttribute("data-home-articles", "");
    section.setAttribute("aria-labelledby", headingId);

    var header = document.createElement("div");
    header.className = "legacy-home-articles__header";
    var heading = appendTextElement(header, "h2", "", labels.latest);
    heading.id = headingId;
    var allArticlesLink = appendTextElement(header, "a", "legacy-home-articles__all", labels.viewAll);
    allArticlesLink.href = articleIndex(locale);
    section.appendChild(header);

    var list = document.createElement("div");
    list.className = "legacy-home-articles__list";

    visibleArticles.forEach(function (article) {
      var item = document.createElement("article");
      item.className = "legacy-home-article";

      var meta = document.createElement("div");
      meta.className = "legacy-home-article__meta";
      var date = formatDate(article.date, labels.htmlLang);
      if (date) {
        var time = appendTextElement(meta, "time", "", date);
        time.dateTime = article.date;
      }
      if (article.legacy) appendTextElement(meta, "span", "", labels.legacy);
      appendTextElement(meta, "span", "", labels.categories[article.category] || article.category);
      item.appendChild(meta);

      var title = document.createElement("h3");
      var titleLink = appendTextElement(title, "a", "", article.title);
      titleLink.href = article.url;
      item.appendChild(title);
      appendTextElement(item, "p", "", article.description);

      var readLink = appendTextElement(item, "a", "legacy-home-article__link", labels.readArticle);
      readLink.href = article.url;
      list.appendChild(item);
    });

    section.appendChild(list);
    var features = home.querySelector(".features");
    home.insertBefore(section, features || null);
  }

  function addHomeArticles() {
    var locale = currentLocale();
    if (!isHomePage(locale) || !document.querySelector("main.home")) return;
    if (document.querySelector("[data-home-articles]")) return;

    if (!homeArticlesPromise) {
      homeArticlesPromise = window.fetch("/articles.json?refresh=" + Date.now(), {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Unable to load articles");
          return response.json();
        })
        .then(function (articles) {
          return Array.isArray(articles) ? articles : [];
        })
        .catch(function () {
          return [];
        });
    }

    homeArticlesPromise.then(renderHomeArticles);
  }

  function blogDropdown(wrapper) {
    var categories = new Set();
    wrapper.querySelectorAll("a[href]").forEach(function (link) {
      var match = new URL(link.href, window.location.origin).pathname.match(categoryPattern);
      if (match) categories.add(match[1]);
    });
    return categories.size >= 2;
  }

  function addArticleLinks() {
    var locale = currentLocale();

    document.querySelectorAll(".nav-links .dropdown-wrapper").forEach(function (wrapper) {
      if (!blogDropdown(wrapper)) return;
      var menu = wrapper.querySelector(".nav-dropdown");
      if (!menu || menu.querySelector("[data-content-index-link]")) return;

      var item = document.createElement("li");
      item.className = "dropdown-item";
      item.setAttribute("data-content-index-link", "");

      var link = document.createElement("a");
      link.className = "nav-link";
      link.href = articleIndex(locale);
      link.textContent = articleLabel(locale);
      item.appendChild(link);
      menu.appendChild(item);
    });
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;

    var target = new URL(link.href, window.location.origin);
    if (target.origin !== window.location.origin || !categoryPattern.test(target.pathname)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(target.href);
  }, true);

  function enhancePage() {
    addArticleLinks();
    addHomeArticles();
  }

  enhancePage();
  new MutationObserver(enhancePage).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
