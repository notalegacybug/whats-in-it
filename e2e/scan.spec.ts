import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const ORIGIN = 'http://localhost:4173'

async function pasteAndSave(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ingredient Safety' })).toBeVisible()
  await page.getByRole('link', { name: 'Type or paste' }).click()
  await page.getByLabel('Paste a list').fill('Glycerin, Titanium Dioxide, Formaldehyde, Xyzzium')
  await page.getByRole('button', { name: 'Use this list' }).click()
  await page.getByRole('button', { name: 'Check ingredients' }).click()
  await page.getByLabel('Product name').fill('Test Lotion')
  await page.getByLabel('Brand').fill('Acme')
  await page.getByLabel('Cosmetic').check()
  await page.getByRole('button', { name: 'Save and see result' }).click()
}

test('paste, check, save, find again', async ({ page }) => {
  await pasteAndSave(page)
  await expect(page.getByRole('heading', { name: 'Watch for (strong evidence) (1)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No known concern on these lists (2)' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Not recognised (1)' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('link', { name: 'My scans' }).click()
  await expect(page.getByRole('link', { name: 'Acme Test Lotion' })).toBeVisible()

  // Same product again: the Details screen offers the saved one.
  await pasteAndSave(page)
  await expect(page.getByText('Is this the same as Acme Test Lotion?')).toBeVisible()
})

test('image scan stays on the device', async ({ page }) => {
  const urls: string[] = []
  page.on('request', (r) => urls.push(r.url()))

  await page.goto('/')
  await page.getByRole('link', { name: 'Choose an image' }).click()
  await page.getByLabel('Choose an image of the label').setInputFiles('e2e/fixtures/label.png')
  await expect(page.getByRole('heading', { name: 'Check the ingredients' })).toBeVisible({ timeout: 80_000 })
  await expect(page.locator('input[value="Formaldehyde"]')).toBeVisible()

  const real = urls.filter((u) => !u.startsWith('data:') && !u.startsWith('blob:'))
  const paths = [...new Set(real.map((u) => new URL(u).pathname))].sort()
  console.log('Distinct request paths:\n' + paths.join('\n'))
  expect(paths.some((p) => p.startsWith('/tesseract/'))).toBe(true)
  expect(real.filter((u) => new URL(u).origin !== ORIGIN)).toEqual([])
})

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' })

  test('reference and OCR worker are served offline after one online visit', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ingredient Safety' })).toBeVisible()
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    // Reload so the page is under the worker's control and runtime caching sees reference.json.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Ingredient Safety' })).toBeVisible()
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)

    // One online scan fills the OCR cache (the worker caches /tesseract/ at runtime).
    await page.getByRole('link', { name: 'Choose an image' }).click()
    await page.getByLabel('Choose an image of the label').setInputFiles('e2e/fixtures/label.png')
    await expect(page.locator('input[value="Formaldehyde"]')).toBeVisible({ timeout: 80_000 })

    await context.setOffline(true)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Ingredient Safety' })).toBeVisible()
    const served = await page.evaluate(async () => {
      const ok = async (u: string) => (await fetch(u)).ok
      return { reference: await ok('/reference.json'), worker: await ok('/tesseract/worker.min.js') }
    })
    expect(served).toEqual({ reference: true, worker: true })
  })
})
