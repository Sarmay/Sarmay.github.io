(function () {
  "use strict";

  var qazaqshaPrefix = "/qaz/";

  function syncDocumentLocale() {
    var pathname = window.location.pathname;
    var isQazaqsha = pathname === "/qaz" || pathname.indexOf(qazaqshaPrefix) === 0;
    var isKazakhCyrillic = pathname === "/kz" || pathname.indexOf("/kz/") === 0;

    document.documentElement.dir = isQazaqsha ? "rtl" : "ltr";
    document.documentElement.lang = isQazaqsha
      ? "kk-Arab"
      : isKazakhCyrillic
        ? "kk-Cyrl"
        : "zh-CN";
  }

  function wrapHistoryMethod(methodName) {
    var original = window.history[methodName];

    window.history[methodName] = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(syncDocumentLocale, 0);
      return result;
    };
  }

  syncDocumentLocale();
  wrapHistoryMethod("pushState");
  wrapHistoryMethod("replaceState");
  window.addEventListener("popstate", syncDocumentLocale);
})();
