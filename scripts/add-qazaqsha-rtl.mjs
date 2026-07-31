import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const qazaqshaLabel = "قازاقشا";
const qazaqshaRoutes = new Set([
  "/",
  "/about/",
  "/blog/backend/",
  "/blog/frontend/",
  "/blog/frontend/AutomatedDeployment.html",
  "/blog/server/",
  "/tags/",
]);

const transliteration = new Map(
  Object.entries({
    А: "ا", а: "ا", Ә: "ٴا", ә: "ٴا", Б: "ب", б: "ب", В: "ۆ", в: "ۆ",
    Г: "گ", г: "گ", Ғ: "ع", ғ: "ع", Д: "د", д: "د", Е: "ە", е: "ە",
    Ё: "يو", ё: "يو", Ж: "ج", ж: "ج", З: "ز", з: "ز", И: "ي", и: "ي",
    Й: "ي", й: "ي", К: "ك", к: "ك", Қ: "ق", қ: "ق", Л: "ل", л: "ل",
    М: "م", м: "م", Н: "ن", н: "ن", Ң: "ڭ", ң: "ڭ", О: "و", о: "و",
    Ө: "ٶ", ө: "ٶ", П: "پ", п: "پ", Р: "ر", р: "ر", С: "س", с: "س",
    Т: "ت", т: "ت", У: "ۋ", у: "ۋ", Ұ: "ۇ", ұ: "ۇ", Ү: "ٷ", ү: "ٷ",
    Ф: "ف", ф: "ف", Х: "ح", х: "ح", Һ: "ھ", һ: "ھ", Ц: "تس", ц: "تس",
    Ч: "چ", ч: "چ", Ш: "ش", ш: "ش", Щ: "شش", щ: "شش", Ъ: "ء", ъ: "ء",
    Ы: "ى", ы: "ى", І: "ٴى", і: "ٴى", Ь: "ء", ь: "ء", Э: "ە", э: "ە",
    Ю: "يۋ", ю: "يۋ", Я: "يا", я: "يا",
  }),
);

function toArabicScript(value) {
  return Array.from(value, (character) => transliteration.get(character) ?? character).join("");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countOccurrences(value, needle) {
  return value.split(needle).length - 1;
}

function replaceOnce(value, needle, replacement, description) {
  assert(countOccurrences(value, needle) === 1, `${description}: expected exactly one anchor`);
  return value.replace(needle, replacement);
}

function findMatching(value, start, openCharacter, closeCharacter) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
    } else if (character === openCharacter) {
      depth += 1;
    } else if (character === closeCharacter) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error(`No matching ${closeCharacter} found`);
}

function splitTopLevel(value) {
  const parts = [];
  let start = 0;
  let curlyDepth = 0;
  let squareDepth = 0;
  let parenthesisDepth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === "{") curlyDepth += 1;
    if (character === "}") curlyDepth -= 1;
    if (character === "[") squareDepth += 1;
    if (character === "]") squareDepth -= 1;
    if (character === "(") parenthesisDepth += 1;
    if (character === ")") parenthesisDepth -= 1;

    if (
      character === ","
      && curlyDepth === 0
      && squareDepth === 0
      && parenthesisDepth === 0
    ) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
}

function cloneLocaleObject(bundle, localesStart, localeKey) {
  const keyIndex = bundle.indexOf(`"${localeKey}":`, localesStart);
  assert(keyIndex >= 0, `Missing locale ${localeKey}`);
  const objectStart = bundle.indexOf("{", keyIndex);
  const objectEnd = findMatching(bundle, objectStart, "{", "}");
  return bundle.slice(objectStart, objectEnd + 1);
}

function extendAppBundle() {
  const appPath = join(root, "assets/js/app.eacb9a3b.js");
  let bundle = readFileSync(appPath, "utf8");
  const legacyKazakhAction = 'actionText:"Мен жайлы",actionLink:"/about/"';
  if (bundle.includes(legacyKazakhAction)) {
    bundle = bundle.replace(
      legacyKazakhAction,
      'actionText:"Мен жайлы",actionLink:"/kz/about/"',
    );
  }

  if (bundle.includes('"v-qaz-home"')) {
    writeFileSync(appPath, bundle);
    return;
  }

  const componentAnchor = '"v-6540fd46":function(){return n.e(24).then(n.bind(null,412))}};';
  const componentReplacement = '"v-6540fd46":function(){return n.e(24).then(n.bind(null,412))},"v-qaz-home":function(){return n.e(17).then(n.bind(null,405))},"v-qaz-about":function(){return n.e(18).then(n.bind(null,414))},"v-qaz-backend":function(){return n.e(19).then(n.bind(null,407))},"v-qaz-auto":function(){return n.e(20).then(n.bind(null,415))},"v-qaz-frontend":function(){return n.e(21).then(n.bind(null,409))},"v-qaz-server":function(){return n.e(22).then(n.bind(null,410))},"v-qaz-tags":function(){return n.e(23).then(n.bind(null,411))}};';
  bundle = replaceOnce(bundle, componentAnchor, componentReplacement, "component map");

  const rootTagsRoute = '{name:"v-6540fd46",path:"/tags/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-6540fd46").then(n)}}';
  const qazaqshaRoutes = '{name:"v-qaz-home",path:"/qaz/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-home").then(n)}},{path:"/qaz/index.html",redirect:"/qaz/"},{name:"v-qaz-about",path:"/qaz/about/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-about").then(n)}},{path:"/qaz/about/index.html",redirect:"/qaz/about/"},{name:"v-qaz-backend",path:"/qaz/blog/backend/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-backend").then(n)}},{path:"/qaz/blog/backend/index.html",redirect:"/qaz/blog/backend/"},{name:"v-qaz-auto",path:"/qaz/blog/frontend/AutomatedDeployment.html",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-auto").then(n)}},{name:"v-qaz-frontend",path:"/qaz/blog/frontend/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-frontend").then(n)}},{path:"/qaz/blog/frontend/index.html",redirect:"/qaz/blog/frontend/"},{name:"v-qaz-server",path:"/qaz/blog/server/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-server").then(n)}},{path:"/qaz/blog/server/index.html",redirect:"/qaz/blog/server/"},{name:"v-qaz-tags",path:"/qaz/tags/",component:hc,beforeEnter:function(t,e,n){Ga("Layout","v-qaz-tags").then(n)}},{path:"/qaz/tags/index.html",redirect:"/qaz/tags/"},';
  bundle = replaceOnce(bundle, rootTagsRoute, qazaqshaRoutes + rootTagsRoute, "router map");

  const siteDataStart = bundle.indexOf("vc={title:");
  assert(siteDataStart >= 0, "Missing VuePress site data");
  const pagesToken = bundle.indexOf("pages:[", siteDataStart);
  const pagesStart = pagesToken + "pages:".length;
  const pagesEnd = findMatching(bundle, pagesStart, "[", "]");
  const pages = splitTopLevel(bundle.slice(pagesStart + 1, pagesEnd));
  const pageSpecs = [
    ["/kz/", "v-qaz-home"],
    ["/kz/about/", "v-qaz-about"],
    ["/kz/blog/backend/", "v-qaz-backend"],
    ["/kz/blog/frontend/AutomatedDeployment.html", "v-qaz-auto"],
    ["/kz/blog/frontend/", "v-qaz-frontend"],
    ["/kz/blog/server/", "v-qaz-server"],
    ["/kz/tags/", "v-qaz-tags"],
  ];
  const qazaqshaPages = pageSpecs.map(([path, key]) => {
    const matches = pages.filter((page) => page.includes(`path:"${path}"`));
    assert(matches.length === 1, `Expected one page definition for ${path}`);
    let page = toArabicScript(matches[0]).replaceAll("kz/", "qaz/");
    page = page.replace(/key:"v-[^"]+"/, `key:"${key}"`);
    if (path === "/kz/") {
      page = page.replace('actionLink:"/about/"', 'actionLink:"/qaz/about/"');
      assert(
        page.includes('actionLink:"/qaz/about/"'),
        "Qazaqsha home page must link to /qaz/about/",
      );
    }
    return page;
  });
  bundle = `${bundle.slice(0, pagesEnd)},${qazaqshaPages.join(",")}${bundle.slice(pagesEnd)}`;

  const themeConfigStart = bundle.indexOf("themeConfig:{", pagesEnd);
  const themeLocalesToken = bundle.indexOf('locales:{"/":', themeConfigStart);
  const themeLocalesStart = themeLocalesToken + "locales:".length;
  const themeLocalesEnd = findMatching(bundle, themeLocalesStart, "{", "}");
  const kazakhThemeLocale = cloneLocaleObject(bundle, themeLocalesStart, "/kz/");
  const qazaqshaThemeLocale = toArabicScript(kazakhThemeLocale).replaceAll("kz/", "qaz/");
  bundle = `${bundle.slice(0, themeLocalesEnd)},"/qaz/":${qazaqshaThemeLocale}${bundle.slice(themeLocalesEnd)}`;

  const siteLocalesToken = bundle.indexOf('locales:{"/":', themeLocalesEnd + qazaqshaThemeLocale.length);
  const siteLocalesStart = siteLocalesToken + "locales:".length;
  const siteLocalesEnd = findMatching(bundle, siteLocalesStart, "{", "}");
  const kazakhSiteLocale = cloneLocaleObject(bundle, siteLocalesStart, "/kz/");
  const qazaqshaSiteLocale = toArabicScript(kazakhSiteLocale)
    .replaceAll("kz/", "qaz/")
    .replace(`lang:"${qazaqshaLabel}"`, 'lang:"kk-Arab"');
  bundle = `${bundle.slice(0, siteLocalesEnd)},"/qaz/":${qazaqshaSiteLocale}${bundle.slice(siteLocalesEnd)}`;

  writeFileSync(appPath, bundle);
}

function duplicateTranslatedModule(relativePath, sourceModuleId, targetModuleId) {
  const filePath = join(root, relativePath);
  const source = readFileSync(filePath, "utf8");
  if (source.includes(`,${targetModuleId}:function`)) {
    return;
  }

  const moduleMarker = `{${sourceModuleId}:`;
  const moduleStart = source.indexOf(moduleMarker) + moduleMarker.length;
  const moduleEnd = source.lastIndexOf("}}]);");
  assert(moduleStart >= moduleMarker.length, `Missing module ${sourceModuleId} in ${relativePath}`);
  assert(moduleEnd > moduleStart, `Missing module terminator in ${relativePath}`);
  const moduleFunction = source.slice(moduleStart, moduleEnd + 1);
  const translatedModule = toArabicScript(moduleFunction);
  const output = `${source.slice(0, moduleEnd + 1)},${targetModuleId}:${translatedModule}${source.slice(moduleEnd + 1)}`;
  writeFileSync(filePath, output);
}

function isolateQazaqshaContactValues() {
  const chunkPath = join(root, "assets/js/18.1cbdefb1.js");
  let chunk = readFileSync(chunkPath, "utf8");
  const targetMarker = ",414:";
  const targetStart = chunk.indexOf(targetMarker);
  assert(targetStart >= 0, "Missing Qazaqsha about module 414");

  let sourceModule = chunk.slice(0, targetStart);
  let targetModule = chunk.slice(targetStart);
  sourceModule = sourceModule.replace(
    'r("p",[r("bdi",{attrs:{dir:"ltr"}},[t._v("QQ：282387881")])])',
    'r("p",[t._v("QQ：282387881")])',
  );
  targetModule = targetModule
    .replace(
      'r("p",[t._v("QQ：282387881")])',
      'r("p",[r("bdi",{attrs:{dir:"ltr"}},[t._v("QQ：282387881")])])',
    )
    .replace(
      'r("p",[t._v("حات ساندىق：282387881@qq.com")])',
      'r("p",[t._v("حات ساندىق："),r("bdi",{attrs:{dir:"ltr"}},[t._v("282387881@qq.com")])])',
    )
    .replace(
      'r("p",[t._v("ٷنحات تەكشەسٴى：Sarmay 科技")])',
      'r("p",[t._v("ٷنحات تەكشەسٴى："),r("bdi",{attrs:{dir:"ltr"}},[t._v("Sarmay 科技")])])',
    );
  chunk = sourceModule + targetModule;
  writeFileSync(chunkPath, chunk);
}

function listHtmlFiles(directory) {
  const result = [];
  for (const entry of readdirSync(directory)) {
    if (entry === ".git" || entry === "qaz") continue;
    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      result.push(...listHtmlFiles(fullPath));
    } else if (entry.endsWith(".html")) {
      result.push(fullPath);
    }
  }
  return result;
}

function routeForFile(filePath, localeDirectory = null) {
  let path = relative(root, filePath).split(sep).join("/");
  if (localeDirectory && path.startsWith(`${localeDirectory}/`)) {
    path = path.slice(localeDirectory.length + 1);
  }
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

function localeItem(href, label, current = false) {
  const currentAttributes = current
    ? ' aria-current="page" class="nav-link router-link-exact-active router-link-active"'
    : ' class="nav-link"';
  return `<li class="dropdown-item"><!----> <a href="${href}"${currentAttributes}><!---->\n${label}</a></li>`;
}

function addEnhancementAssets(html) {
  if (!html.includes('/assets/css/rtl.css')) {
    const stylesheet = '<link rel="stylesheet" href="/assets/css/0.styles.c08026f3.css">';
    html = html.replace(stylesheet, `${stylesheet}<link rel="stylesheet" href="/assets/css/rtl.css">`);
  }
  if (!html.includes('/assets/js/locale-direction.js')) {
    const appScript = '<script src="/assets/js/app.eacb9a3b.js" defer></script>';
    html = html.replace(appScript, `<script src="/assets/js/locale-direction.js" defer></script>${appScript}`);
  }
  return html;
}

function prioritizeTranslatedChunk(html, chunkName) {
  const plainScript = `<script src="/assets/js/${chunkName}" defer></script>`;
  const versionedScript = `<script src="/assets/js/${chunkName}?v=qazaqsha-rtl-1" defer></script>`;
  html = html.replace(plainScript, "");
  const localeScript = '<script src="/assets/js/locale-direction.js" defer></script>';
  const appScript = '<script src="/assets/js/app.eacb9a3b.js" defer></script>';
  const anchor = html.includes(localeScript) ? localeScript : appScript;
  return html.replace(anchor, `${versionedScript}${anchor}`);
}

function generateQazaqshaPages() {
  const kazakhRoot = join(root, "kz");
  const sourceFiles = listHtmlFiles(kazakhRoot);

  for (const sourcePath of sourceFiles) {
    const route = routeForFile(sourcePath, "kz");
    const kazakhPath = `/kz${route}`;
    const qazaqshaPath = `/qaz${route}`;
    let source = readFileSync(sourcePath, "utf8");
    source = source.replaceAll(localeItem(qazaqshaPath, qazaqshaLabel), "");

    let html = toArabicScript(source).replaceAll("/kz/", "/qaz/");
    html = replaceOnce(
      html,
      '<html lang="قازاقشا">',
      '<html lang="kk-Arab" dir="rtl">',
      `document locale for ${qazaqshaPath}`,
    );

    const currentQazaqshaItem = localeItem(qazaqshaPath, qazaqshaLabel, true);
    assert(
      countOccurrences(html, currentQazaqshaItem) === 2,
      `Expected two current locale items in ${qazaqshaPath}`,
    );
    html = html.replaceAll(
      currentQazaqshaItem,
      localeItem(kazakhPath, "Қазақша") + currentQazaqshaItem,
    );

    if (route === "/") {
      const legacyAction = 'href="/about/" class="nav-link action-button"';
      if (html.includes(legacyAction)) {
        html = replaceOnce(
          html,
          legacyAction,
          'href="/qaz/about/" class="nav-link action-button"',
          "Qazaqsha home action",
        );
      }
      assert(
        html.includes('href="/qaz/about/" class="nav-link action-button"'),
        "Qazaqsha home HTML must link to /qaz/about/",
      );
    }

    if (route === "/about/") {
      html = html
        .replace(
          "<p>QQ：282387881</p>",
          '<p><bdi dir="ltr">QQ：282387881</bdi></p>',
        )
        .replace(
          "<p>حات ساندىق：282387881@qq.com</p>",
          '<p>حات ساندىق：<bdi dir="ltr">282387881@qq.com</bdi></p>',
        )
        .replace(
          "<p>ٷنحات تەكشەسٴى：Sarmay 科技</p>",
          '<p>ٷنحات تەكشەسٴى：<bdi dir="ltr">Sarmay 科技</bdi></p>',
        );
      html = prioritizeTranslatedChunk(html, "18.1cbdefb1.js");
    }

    if (route === "/blog/frontend/AutomatedDeployment.html") {
      html = prioritizeTranslatedChunk(html, "20.c20236b7.js");
    }

    html = addEnhancementAssets(html);
    const outputPath = join(root, "qaz", relative(kazakhRoot, sourcePath));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, html);
  }
}

function updateExistingHtmlPages() {
  for (const filePath of listHtmlFiles(root)) {
    let html = readFileSync(filePath, "utf8");
    const localeDirectory = relative(root, filePath).startsWith(`kz${sep}`) ? "kz" : null;
    const route = routeForFile(filePath, localeDirectory);
    const qazaqshaPath = qazaqshaRoutes.has(route) ? `/qaz${route}` : "/qaz/";
    const item = localeItem(qazaqshaPath, qazaqshaLabel);

    html = html.replace(
      /<li class="dropdown-item"><!----> <a href="\/qaz[^"]*" class="nav-link"><!---->\nقازاقشا<\/a><\/li>/g,
      "",
    );

    if (html.includes("Қазақша</a></li></ul>")) {
      html = html.replaceAll(
        "Қазақша</a></li></ul>",
        `Қазақша</a></li>${item}</ul>`,
      );
    }

    html = addEnhancementAssets(html);
    writeFileSync(filePath, html);
  }
}

extendAppBundle();
duplicateTranslatedModule("assets/js/18.1cbdefb1.js", 406, 414);
duplicateTranslatedModule("assets/js/20.c20236b7.js", 408, 415);
isolateQazaqshaContactValues();
generateQazaqshaPages();
updateExistingHtmlPages();

console.log("Qazaqsha RTL locale generated successfully.");
