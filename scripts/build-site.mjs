import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import {
  CATEGORY_KEYS,
  LOCALES,
  collectLegacyArticles,
  loadArticles,
  sortArticles,
} from "./content-model.mjs";
import {
  renderArticleIndex,
  renderArticlePage,
} from "./content-template.mjs";

const scriptRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skippedRootEntries = new Set([
  ".git",
  ".github",
  ".pages.yml",
  ".gitignore",
  ".DS_Store",
  "content",
  "dist",
  "dist-preview",
  "node_modules",
  "package-lock.json",
  "package.json",
  "README.md",
  "scripts",
  "tests",
]);

function assertSafeOutput(siteRoot, outputDir) {
  const resolvedRoot = resolve(siteRoot);
  const resolvedOutput = resolve(outputDir);
  if (resolvedOutput === resolvedRoot || resolvedOutput === "/") {
    throw new Error(`Refusing to replace unsafe output directory: ${resolvedOutput}`);
  }
}

function copyPublishedAssets(siteRoot, outputDir) {
  for (const entry of readdirSync(siteRoot, { withFileTypes: true })) {
    if (skippedRootEntries.has(entry.name)) continue;

    const sourcePath = join(siteRoot, entry.name);
    if (resolve(sourcePath) === resolve(outputDir)) continue;
    cpSync(sourcePath, join(outputDir, entry.name), {
      recursive: entry.isDirectory(),
      force: true,
    });
  }
}

function walkFiles(directory, callback) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(entryPath, callback);
    else callback(entryPath);
  }
}

function injectLegacyNavigation(outputDir) {
  walkFiles(outputDir, (filePath) => {
    if (!filePath.endsWith(".html")) return;

    const html = readFileSync(filePath, "utf8");
    if (!html.includes('/assets/js/app.') || html.includes('/assets/js/content-navigation.js')) return;

    const enhanced = html.replace(
      "</body>",
      '    <script src="/assets/js/content-navigation.js" defer></script>\n  </body>',
    );
    writeFileSync(filePath, enhanced);
  });
}

function outputPathForUrl(outputDir, url) {
  const relativeUrl = url.replace(/^\//, "").replace(/\/$/, "");
  return join(outputDir, relativeUrl, "index.html");
}

function writePage(outputDir, url, html) {
  const filePath = outputPathForUrl(outputDir, url);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html);
}

function publicArticleData(article) {
  return {
    title: article.title,
    slug: article.slug,
    description: article.description,
    date: article.date,
    language: article.language,
    category: article.category,
    tags: article.tags,
    cover: article.cover,
    translationKey: article.translationKey,
    published: article.published,
    legacy: article.legacy,
    url: article.url,
  };
}

export function buildSite({
  siteRoot = scriptRoot,
  outputDir = join(scriptRoot, "dist"),
  contentDir,
  includeDrafts = false,
} = {}) {
  const root = resolve(siteRoot);
  const output = resolve(outputDir);
  const articlesDirectory = resolve(contentDir ?? join(root, "content", "articles"));
  assertSafeOutput(root, output);

  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  copyPublishedAssets(root, output);
  injectLegacyNavigation(output);

  const articles = loadArticles({
    contentDir: articlesDirectory,
    includeDrafts,
  });
  const legacyArticles = collectLegacyArticles(root);
  const allArticles = sortArticles([...articles, ...legacyArticles]);
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
  });

  for (const language of Object.keys(LOCALES)) {
    writePage(output, `${LOCALES[language].prefix}/articles/`, renderArticleIndex({
      language,
      articles: allArticles,
    }));

    for (const category of CATEGORY_KEYS) {
      writePage(output, `${LOCALES[language].prefix}/blog/${category}/`, renderArticleIndex({
        language,
        articles: allArticles,
        category,
      }));
    }
  }

  for (const article of articles) {
    writePage(output, article.url, renderArticlePage({
      article,
      allArticles: articles,
      bodyHtml: markdown.render(article.body),
    }));
  }

  writeFileSync(join(output, "articles.json"), `${JSON.stringify(allArticles.map(publicArticleData), null, 2)}\n`);
  writeFileSync(join(output, ".nojekyll"), "");

  return {
    outputDir: output,
    articleCount: articles.length,
    legacyArticleCount: legacyArticles.length,
    includeDrafts,
  };
}

function parseArguments(argumentsList) {
  const options = {
    outputDir: join(scriptRoot, "dist"),
    includeDrafts: false,
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--include-drafts") {
      options.includeDrafts = true;
    } else if (argument === "--output") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error("--output requires a directory");
      options.outputDir = resolve(scriptRoot, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  const result = buildSite(parseArguments(process.argv.slice(2)));
  const mode = result.includeDrafts ? "including drafts" : "published only";
  console.log(`Built ${result.articleCount} CMS articles and ${result.legacyArticleCount} legacy articles (${mode}) into ${relative(scriptRoot, result.outputDir) || basename(result.outputDir)}.`);
}
