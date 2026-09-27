// render.js <in.svg> <out.png> [scale]  — rasterise an SVG with headless Chromium.
// Needs Playwright (NODE_PATH=$(npm root -g) works with a global install).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const [inp, outp, scale = '1'] = process.argv.slice(2);
  const svg = fs.readFileSync(inp, 'utf8');
  const w = +svg.match(/width="(\d+)"/)[1], h = +svg.match(/height="(\d+)"/)[1];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +scale });
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.resolve(outp), clip: { x: 0, y: 0, width: w, height: h } });
  await browser.close();
})();
