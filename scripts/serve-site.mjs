import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".eot": "application/vnd.ms-fontobject",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
};

const argumentsList = process.argv.slice(2);
const rootArgument = argumentsList[0] && !argumentsList[0].startsWith("--") ? argumentsList.shift() : "dist";
let port = 4173;

for (let index = 0; index < argumentsList.length; index += 1) {
  if (argumentsList[index] !== "--port" || !argumentsList[index + 1]) {
    throw new Error(`Unknown argument: ${argumentsList[index]}`);
  }
  port = Number(argumentsList[index + 1]);
  index += 1;
}

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port");

const siteRoot = resolve(rootArgument);
if (!existsSync(siteRoot) || !statSync(siteRoot).isDirectory()) {
  throw new Error(`Site directory does not exist: ${siteRoot}`);
}

function fileForRequest(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const normalizedPath = normalize(pathname).replace(/^([/\\])+/, "");
  const candidate = resolve(siteRoot, normalizedPath);
  if (candidate !== siteRoot && !candidate.startsWith(`${siteRoot}${sep}`)) return null;

  if (existsSync(candidate) && statSync(candidate).isDirectory()) return join(candidate, "index.html");
  return candidate;
}

const server = createServer((request, response) => {
  const filePath = fileForRequest(request.url || "/");
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Previewing ${siteRoot} at http://127.0.0.1:${port}`);
});
