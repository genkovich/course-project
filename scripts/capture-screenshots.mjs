#!/usr/bin/env node
// capture-screenshots.mjs — render the app's key screens to PNGs for the user
// guide. NO LLM. This is the deterministic CLI screenshotter the
// `generate-user-docs` skill (and the gate-1 workflow) call before writing the
// guide: a rule renders the picture, the agent writes the words around it.
//
// It does NOT boot the app — it only probes a server it expects to already be
// running (npm run dev, or build && start). Set BASE_URL to point elsewhere.
//
// Shots (written to docs/user-guide/img/):
//   /                 → generator.png        (after clicking Generate)
//   /gallery          → gallery.png
//   /gallery?tag=dev  → gallery-filtered.png (the headline frame of the feature)
//
// Prints the files it wrote; exits non-zero if the server is not up.
//
// Usage:  BASE_URL=http://localhost:3000 node scripts/capture-screenshots.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "docs/user-guide/img";

// Each shot: where to go, an optional action before the snap, and the file name.
const SHOTS = [
  {
    file: "generator.png",
    url: "/",
    async prepare(page) {
      // Click Generate and wait for a meme to render onto the canvas.
      await page.getByRole("button", { name: "Generate" }).click();
      await page.getByText("Template:").waitFor({ timeout: 15000 });
      // Let the template image finish drawing on the canvas.
      await page.waitForTimeout(800);
    },
  },
  { file: "gallery.png", url: "/gallery" },
  { file: "gallery-filtered.png", url: "/gallery?tag=dev" },
];

async function serverIsUp(url) {
  // Don't start anything — just confirm a server is already answering.
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await serverIsUp(BASE_URL))) {
    console.error(
      `✗ no server at ${BASE_URL} — start it first (npm run dev, or npm run build && npm start), then re-run.`
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const written = [];
  try {
    for (const shot of SHOTS) {
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${shot.url}`, { waitUntil: "networkidle" });
      if (shot.prepare) await shot.prepare(page);
      const out = path.join(OUT_DIR, shot.file);
      await page.screenshot({ path: out, fullPage: true });
      written.push(out);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("wrote:");
  for (const f of written) console.log(`  ${f}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
