(function () {
  "use strict";

  var menuButton = document.querySelector(".content-menu-button");
  var navigation = document.querySelector(".content-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", function () {
      var isOpen = navigation.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      navigation.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.focus();
    });
  }

  var searchInput = document.querySelector("[data-article-search]");
  var articleRows = Array.prototype.slice.call(document.querySelectorAll("[data-article-row]"));
  var articleCount = document.querySelector("[data-article-count]");
  var emptyState = document.querySelector("[data-article-empty]");

  if (!searchInput || !articleCount || !emptyState) return;

  var countSuffix = articleCount.textContent.replace(/^\d+\s*/, "");

  function filterArticles() {
    var query = searchInput.value.trim().toLocaleLowerCase();
    var visibleCount = 0;

    articleRows.forEach(function (row) {
      var matches = !query || row.getAttribute("data-search").indexOf(query) >= 0;
      row.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    articleCount.textContent = visibleCount + " " + countSuffix;
    emptyState.hidden = visibleCount !== 0;
  }

  searchInput.addEventListener("input", filterArticles);
})();
