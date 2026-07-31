import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import matter from "gray-matter";

export const SITE_URL = "https://sarmay.github.io";

export const CATEGORY_KEYS = ["frontend", "backend", "server"];

export const LOCALES = {
  zh: {
    key: "zh",
    htmlLang: "zh-CN",
    dir: "ltr",
    prefix: "",
    siteName: "Sarmay的个人博客",
    home: "主页",
    articles: "全部文章",
    about: "关于我",
    chooseLanguage: "选择语言",
    search: "搜索文章",
    searchPlaceholder: "搜索标题、摘要或标签",
    empty: "暂时没有符合条件的文章。",
    result: "篇文章",
    draft: "草稿",
    legacy: "历史文章",
    readArticle: "阅读全文",
    backToArticles: "返回文章列表",
    publishedAt: "发布于",
    categories: {
      frontend: "前端",
      backend: "后端",
      server: "服务器",
    },
  },
  kz: {
    key: "kz",
    htmlLang: "kk-Cyrl",
    dir: "ltr",
    prefix: "/kz",
    siteName: "Sarmay-дың жеке блогы",
    home: "Бас бет",
    articles: "Барлық мақалалар",
    about: "Мен жайлы",
    chooseLanguage: "Тілді таңдаңыз",
    search: "Мақала іздеу",
    searchPlaceholder: "Тақырып, сипаттама немесе тег",
    empty: "Сәйкес мақала табылмады.",
    result: "мақала",
    draft: "Жоба",
    legacy: "Бұрынғы мақала",
    readArticle: "Толық оқу",
    backToArticles: "Мақалаларға оралу",
    publishedAt: "Жарияланған күні",
    categories: {
      frontend: "Фронтенд",
      backend: "Бэкенд",
      server: "Сервер",
    },
  },
  qaz: {
    key: "qaz",
    htmlLang: "kk-Arab",
    dir: "rtl",
    prefix: "/qaz",
    siteName: "سارمايدىڭ جەكەلٴىك بٴىلٶگٴى",
    home: "باس بەت",
    articles: "بارلىق ماقالالار",
    about: "مەن جايلى",
    chooseLanguage: "تٴىلٴىن تالداڭىز",
    search: "ماقالا ٴىزدەۋ",
    searchPlaceholder: "تاقىرىپ، تانىستىرۋ ياكي بەلگٴى",
    empty: "سايكەس ماقالا تابىلمادى.",
    result: "ماقالا",
    draft: "جوبا",
    legacy: "بۇرىنعى ماقالا",
    readArticle: "تولىق وقۋ",
    backToArticles: "ماقالالارعا قايتۋ",
    publishedAt: "جاريالانعان كٷنٴى",
    categories: {
      frontend: "فرونتەند",
      backend: "بەكەند",
      server: "سەرۆەر",
    },
  },
};

function assertField(condition, filePath, message) {
  if (!condition) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function normalizeDate(value, filePath) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }

  const stringValue = String(value ?? "").trim();
  assertField(/^\d{4}-\d{2}-\d{2}$/.test(stringValue), filePath, "date must use YYYY-MM-DD");
  assertField(!Number.isNaN(Date.parse(`${stringValue}T00:00:00Z`)), filePath, "date is invalid");
  return stringValue;
}

export function normalizeTags(value) {
  const tags = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
}

export function articleUrl(article) {
  const locale = LOCALES[article.language];
  return `${locale.prefix}/articles/${article.slug}/`;
}

export function articleIndexUrl(language) {
  return `${LOCALES[language].prefix}/articles/`;
}

export function categoryUrl(language, category) {
  return `${LOCALES[language].prefix}/blog/${category}/`;
}

function parseArticle(filePath) {
  const source = readFileSync(filePath, "utf8");
  const parsed = matter(source);
  const data = parsed.data;

  assertField(typeof data.title === "string" && data.title.trim(), filePath, "title is required");
  assertField(typeof data.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug), filePath, "slug must contain lowercase letters, numbers, and hyphens only");
  assertField(typeof data.description === "string" && data.description.trim().length >= 10, filePath, "description must contain at least 10 characters");
  assertField(Object.hasOwn(LOCALES, data.language), filePath, `unsupported language: ${data.language}`);
  assertField(CATEGORY_KEYS.includes(data.category), filePath, `unsupported category: ${data.category}`);
  assertField(data.published === undefined || typeof data.published === "boolean", filePath, "published must be true or false");
  assertField(parsed.content.trim(), filePath, "body is required");

  const article = {
    title: data.title.trim(),
    slug: data.slug,
    description: data.description.trim(),
    date: normalizeDate(data.date, filePath),
    language: data.language,
    category: data.category,
    tags: normalizeTags(data.tags),
    cover: typeof data.cover === "string" ? data.cover.trim() : "",
    translationKey: typeof data.translation_key === "string" ? data.translation_key.trim() : "",
    published: data.published !== false,
    body: parsed.content.trim(),
    sourcePath: filePath,
    legacy: false,
  };

  article.url = articleUrl(article);
  return article;
}

export function loadArticles({ contentDir, includeDrafts = false }) {
  if (!existsSync(contentDir)) return [];

  const articles = readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
    .map((entry) => parseArticle(join(contentDir, entry.name)));

  const urls = new Set();
  const translations = new Set();
  for (const article of articles) {
    assertField(!urls.has(article.url), article.sourcePath, `duplicate article URL: ${article.url}`);
    urls.add(article.url);

    if (article.translationKey) {
      const translationIdentity = `${article.language}:${article.translationKey}`;
      assertField(!translations.has(translationIdentity), article.sourcePath, `duplicate translation_key for ${article.language}`);
      translations.add(translationIdentity);
    }
  }

  return sortArticles(articles.filter((article) => includeDrafts || article.published));
}

function decodeTitle(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function collectLegacyArticles(siteRoot) {
  const articles = [];

  for (const [language, locale] of Object.entries(LOCALES)) {
    for (const category of CATEGORY_KEYS) {
      const relativeBase = locale.prefix.replace(/^\//, "");
      const directory = join(siteRoot, relativeBase, "blog", category);
      if (!existsSync(directory)) continue;

      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (!entry.isFile() || entry.name === "index.html" || extname(entry.name).toLowerCase() !== ".html") continue;

        const filePath = join(directory, entry.name);
        const html = readFileSync(filePath, "utf8");
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const fullTitle = titleMatch ? decodeTitle(titleMatch[1].trim()) : basename(entry.name, ".html");
        const title = fullTitle.split(" | ")[0].trim();
        const slug = basename(entry.name, ".html");

        articles.push({
          title,
          slug,
          description: locale.legacy,
          date: "",
          language,
          category,
          tags: [],
          cover: "",
          translationKey: slug,
          published: true,
          body: "",
          sourcePath: filePath,
          legacy: true,
          url: `${locale.prefix}/blog/${category}/${entry.name}`,
        });
      }
    }
  }

  return sortArticles(articles);
}

export function sortArticles(articles) {
  return [...articles].sort((left, right) => {
    if (left.date !== right.date) return right.date.localeCompare(left.date);
    if (left.legacy !== right.legacy) return left.legacy ? 1 : -1;
    return left.title.localeCompare(right.title);
  });
}
