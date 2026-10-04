// Renders docs/screenshot.png (desktop, full page) and docs/screenshot-mobile.png
// using playwright-core with a locally installed Chrome/Chromium.
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { startServer } from "./serve.mjs";

const executablePath = process.env.CHROME_PATH ?? ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p));
if (!executablePath) throw new Error("Chrome not found. Set CHROME_PATH to your Chrome/Chromium binary.");

const server = await startServer(5199, process.cwd());
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
mkdirSync("docs", { recursive: true });

async function shoot(path, viewport, fullPage) {
  // reducedMotion gives a deterministic frame: reveals shown, counters final, hero word fixed.
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.goto("http://localhost:5199/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Scroll through the page so scroll-triggered reveals and counters fire.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
    document.querySelector(".nav")?.classList.remove("hide");
    document.querySelectorAll("[data-count]").forEach((el) => { el.textContent = el.dataset.count; });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path, fullPage });
  await page.close();
  console.log(`✓ ${path}`);
}

await shoot("docs/screenshot.png", { width: 1440, height: 900 }, true);
await shoot("docs/screenshot-hero.png", { width: 1440, height: 900 }, false);
await shoot("docs/screenshot-mobile.png", { width: 390, height: 844 }, false);
await browser.close();
server.close();
