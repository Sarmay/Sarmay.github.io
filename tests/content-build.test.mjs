import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
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
  const previewOutput = join(temporaryRoot, "preview");
  const productionOutput = join(temporaryRoot, "production");

  try {
    const preview = buildSite({
      siteRoot: root,
      outputDir: previewOutput,
      includeDrafts: true,
    });
    assert.equal(preview.articleCount, 1);
    assert.ok(preview.legacyArticleCount >= 4);

    const draftPage = join(previewOutput, "articles", "cms-example-draft", "index.html");
    assert.ok(existsSync(draftPage));
    assert.match(readFileSync(draftPage, "utf8"), /使用网页后台发布第一篇文章/);

    const qazaqshaIndex = readFileSync(join(previewOutput, "qaz", "articles", "index.html"), "utf8");
    assert.match(qazaqshaIndex, /<html lang="kk-Arab" dir="rtl">/);
    assert.match(qazaqshaIndex, /بارلىق ماقالالار/);

    const legacyHome = readFileSync(join(previewOutput, "index.html"), "utf8");
    assert.match(legacyHome, /assets\/js\/content-navigation\.js/);

    const frontendIndex = readFileSync(join(previewOutput, "blog", "frontend", "index.html"), "utf8");
    assert.match(frontendIndex, /自动化部署/);
    assert.doesNotMatch(frontendIndex, /assets\/js\/app\./);

    buildSite({
      siteRoot: root,
      outputDir: productionOutput,
      includeDrafts: false,
    });
    assert.equal(existsSync(join(productionOutput, "articles", "cms-example-draft")), false);
    assert.doesNotMatch(
      readFileSync(join(productionOutput, "articles", "index.html"), "utf8"),
      /使用网页后台发布第一篇文章/,
    );
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
