// Static site checks (no dependencies): local assets exist, in-page anchors resolve,
// key SEO/accessibility tags are present, external links are safe.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const file = process.argv[2] ?? "index.html";
const html = readFileSync(file, "utf8");
const base = dirname(file);
const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. local assets
for (const [, attr, url] of html.matchAll(/\s(src|href)="([^"]+)"/g)) {
  if (/^(https?:|mailto:|tel:|#|data:)/.test(url)) continue;
  ok(existsSync(join(base, url.split(/[?#]/)[0])), `missing local ${attr}: ${url}`);
}
// 2. in-page anchors
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) ok(ids.has(id), `broken anchor: #${id}`);
// 3. duplicate ids
const all = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
for (const id of new Set(all.filter((id, i) => all.indexOf(id) !== i))) errors.push(`duplicate id: ${id}`);
// 4. head essentials
ok(/<html[^>]+lang="/.test(html), "<html> needs a lang attribute");
ok(/<meta name="viewport"/.test(html), "missing viewport meta");
ok(/<title>[^<]{10,}<\/title>/.test(html), "missing/short <title>");
ok(/<meta name="description" content="[^"]{50,}"/.test(html), "missing/short meta description");
ok((html.match(/<h1[\s>]/g) ?? []).length === 1, "page should have exactly one <h1>");
// 5. images need alt text
for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) ok(/\salt="/.test(tag), `img without alt: ${tag.slice(0, 60)}`);
// 6. target=_blank links need rel=noopener
for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) ok(/rel="[^"]*noopener/.test(tag), `target=_blank without rel=noopener: ${tag.slice(0, 70)}`);
// 7. JSON-LD parses
for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
  try { JSON.parse(json); } catch { errors.push("invalid JSON-LD block"); }
}

if (errors.length) {
  console.error(`✗ ${file}: ${errors.length} problem(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ ${file}: assets, anchors, SEO and a11y checks passed (${ids.size} ids, ${html.length} bytes)`);
