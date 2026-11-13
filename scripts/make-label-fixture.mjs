// Renders e2e/fixtures/label.png with Playwright's Chromium (no canvas dependency).
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../e2e/fixtures/label.png')
mkdirSync(dirname(out), { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 300 } })
await page.setContent(`<body style="margin:0;background:#fff;color:#000;font:bold 72px Arial,Helvetica,sans-serif;
  display:flex;align-items:center;justify-content:center;height:300px">
  Ingredients: Glycerin, Formaldehyde, Titanium Dioxide</body>`)
await page.screenshot({ path: out })
await browser.close()
console.log('wrote', out)
