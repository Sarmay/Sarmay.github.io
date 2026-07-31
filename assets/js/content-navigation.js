(function () {
  "use strict";

  var categoryPattern = /^\/(?:kz\/|qaz\/)?blog\/(frontend|backend|server)\/$/;

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

  addArticleLinks();
  new MutationObserver(addArticleLinks).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
