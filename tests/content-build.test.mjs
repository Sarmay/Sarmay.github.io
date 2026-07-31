import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildSite } from "../scripts/build-site.mjs";
import { loadArticles, normalizeTags } from "../scripts/content-model.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function writeArticleFixture(contentDir, { slug, title, published }) {
  writeFileSync(join(contentDir, `${slug}.md`), `---
title: ${title}
slug: ${slug}
description: A stable article fixture used by the content build tests.
date: 2026-07-31
language: zh
category: frontend
published: ${published}
---

Fixture body for ${title}.
`);
}

test("normalizes comma-separated and repeated tags", () => {
  assert.deepEqual(normalizeTags("CMS, GitHub Pages, CMS"), ["CMS", "GitHub Pages"]);
});

test("rejects unsafe article slugs", () => {
  const contentDir = mkdtempSync(join(tmpdir(), "sarmay-invalid-content-"));
  writeFileSync(join(contentDir, "invalid.md"), `---
title: Invalid
slug: Invalid Slug
description: This description is long enough.
date: 2026-07-31
language: zh
category: frontend
published: true
---

Body
`);

  try {
    assert.throws(
      () => loadArticles({ contentDir, includeDrafts: true }),
      /slug must contain lowercase letters, numbers, and hyphens only/,
    );
  } finally {
    rmSync(contentDir, { recursive: true, force: true });
  }
});

test("builds legacy pages plus CMS articles and excludes drafts in production", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "sarmay-content-build-"));
  const contentDir = join(temporaryRoot, "content");
  const previewOutput = join(temporaryRoot, "preview");
  const productionOutput = join(temporaryRoot, "production");

  try {
    mkdirSync(contentDir);
    writeArticleFixture(contentDir, {
      slug: "fixture-published",
      title: "Published fixture article",
      published: true,
    });
    writeArticleFixture(contentDir, {
      slug: "fixture-draft",
      title: "Draft fixture article",
      published: false,
    });

    const preview = buildSite({
      siteRoot: root,
      outputDir: previewOutput,
      contentDir,
      includeDrafts: true,
    });
    assert.equal(preview.articleCount, 2);
    assert.ok(preview.legacyArticleCount >= 4);

    const draftPage = join(previewOutput, "articles", "fixture-draft", "index.html");
    assert.ok(existsSync(draftPage));
    assert.match(readFileSync(draftPage, "utf8"), /Draft fixture article/);

    const qazaqshaIndex = readFileSync(join(previewOutput, "qaz", "articles", "index.html"), "utf8");
    assert.match(qazaqshaIndex, /<html lang="kk-Arab" dir="rtl">/);
    assert.match(qazaqshaIndex, /بارلىق ماقالالار/);

    const legacyHome = readFileSync(join(previewOutput, "index.html"), "utf8");
    assert.match(legacyHome, /assets\/js\/content-navigation\.js/);
    assert.match(legacyHome, /assets\/css\/content-site\.css\?v=/);

    const frontendIndex = readFileSync(join(previewOutput, "blog", "frontend", "index.html"), "utf8");
    assert.match(frontendIndex, /自动化部署/);
    assert.doesNotMatch(frontendIndex, /assets\/js\/app\./);

    const production = buildSite({
      siteRoot: root,
      outputDir: productionOutput,
      contentDir,
      includeDrafts: false,
    });
    assert.equal(production.articleCount, 1);
    assert.ok(existsSync(join(productionOutput, "articles", "fixture-published", "index.html")));
    assert.equal(existsSync(join(productionOutput, "articles", "fixture-draft")), false);
    const articleFeed = JSON.parse(readFileSync(join(productionOutput, "articles.json"), "utf8"));
    assert.deepEqual(
      articleFeed.filter((article) => !article.legacy).map((article) => article.slug),
      ["fixture-published"],
    );
    assert.doesNotMatch(
      readFileSync(join(productionOutput, "articles", "index.html"), "utf8"),
      /Draft fixture article/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
