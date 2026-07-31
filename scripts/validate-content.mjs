import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { loadArticles } from "./content-model.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const articles = loadArticles({
  contentDir: join(root, "content", "articles"),
  includeDrafts: true,
});

const cmsConfig = yaml.load(readFileSync(join(root, ".pages.yml"), "utf8"));
const workflowConfig = yaml.load(readFileSync(join(root, ".github", "workflows", "deploy-pages.yml"), "utf8"));
const articleCollection = cmsConfig?.content?.find((collection) => collection.name === "articles");
const fieldNames = new Set(articleCollection?.fields?.map((field) => field.name));

if (!articleCollection || articleCollection.path !== "content/articles") {
  throw new Error(".pages.yml must define the content/articles collection");
}

for (const requiredField of ["title", "slug", "description", "date", "language", "category", "published", "body"]) {
  if (!fieldNames.has(requiredField)) throw new Error(`.pages.yml is missing field: ${requiredField}`);
}

if (!workflowConfig?.jobs?.build || !workflowConfig?.jobs?.deploy) {
  throw new Error("deploy-pages.yml must define build and deploy jobs");
}

console.log(`Validated ${articles.length} CMS article${articles.length === 1 ? "" : "s"}, Pages CMS config, and deployment workflow.`);
