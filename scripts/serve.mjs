// Zero-dependency static file server for local development.
// Usage: node scripts/serve.mjs [port] [dir]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.argv[2] ?? process.env.PORT ?? 5173);
const root = resolve(process.argv[3] ?? ".");
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".ico": "image/x-icon", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json",
};

export function startServer(p = port, dir = root) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let file = normalize(join(dir, decodeURIComponent(url.pathname)));
      if (!file.startsWith(dir)) throw Object.assign(new Error("forbidden"), { code: "EACCES" });
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");
      const body = await readFile(file);
      res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(body);
    } catch (err) {
      res.writeHead(err.code === "EACCES" ? 403 : 404, { "Content-Type": "text/plain" });
      res.end(err.code === "EACCES" ? "403" : "404 Not found");
    }
  });
  return new Promise((ok) => server.listen(p, () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await startServer();
  console.log(`\n  ▲ serving ${root}\n  → http://localhost:${port}\n`);
}
