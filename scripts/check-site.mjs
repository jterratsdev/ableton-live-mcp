import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const siteRoot = resolve(root, "site");
const html = await readFile(resolve(siteRoot, "index.html"), "utf8");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));

for (const content of [
  "Ableton Live MCP",
  "Open-source music production connector",
  "Architecture",
  "Capabilities",
  "Install the connector",
  "Safety & recovery",
  "Current boundaries",
  "https://github.com/jterratsdev/ableton-live-mcp",
]) {
  assert.ok(html.includes(content), `Missing required site content: ${content}`);
}

assert.match(html, /<main\s+id="main">/);
assert.match(html, /<nav\b[^>]*\baria-label="Primary navigation"[^>]*>/);
assert.match(html, /<nav\b[^>]*\baria-label="Mobile navigation"[^>]*>/);
assert.match(html, /<summary\s+aria-label="Toggle navigation">/);
assert.match(html, /<meta\s+name="description"/);
assert.match(html, /<link\s+rel="canonical"\s+href="https:\/\//);
assert.match(
  html,
  /<link\s+rel="stylesheet"\s+href="https:\/\/jterrats\.dev\/tokens\.css"\s*\/>/,
);
assert.match(html, /<img[\s\S]+alt="[^"]+"[\s\S]+width="\d+"[\s\S]+height="\d+"/);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const [, href] of html.matchAll(/href="#([^"]+)"/g)) {
  assert.ok(ids.has(href), `Internal link has no matching id: #${href}`);
}

for (const [, href] of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
  assert.ok(href.startsWith("https://"), `External link must use HTTPS: ${href}`);
}

for (const [, source] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) {
  await access(resolve(siteRoot, source), constants.R_OK);
}

assert.ok(
  !packageJson.files.some((entry) => entry === "site" || entry.startsWith("site/")),
  "site/ must remain excluded from the npm package contents",
);

console.log("site contract ok");
