import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SHOTS_DIR = resolve(process.cwd(), 'specs/screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

function attachConsoleGuard(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

test('app loads, core UI renders, no console errors', async ({ page }, testInfo) => {
  const errors = attachConsoleGuard(page);

  await page.goto('/');

  await expect(page.locator('#waveform')).toBeVisible();
  await expect(page.locator('#active-bar')).toBeVisible();
  await expect(page.locator('#segments .seg')).toHaveCount(5);
  await expect(page.locator('#keys .key')).toHaveCount(5);
  await expect(page.locator('#dj-slots .dj-slot')).toHaveCount(9);

  await page.waitForFunction(() => {
    const c = document.querySelector('#waveform');
    return c && c.width > 0 && c.height > 0;
  });

  await page.screenshot({ path: `${SHOTS_DIR}/smoke-${testInfo.project.name}.png`, fullPage: true });

  expect(errors, `\n${errors.join('\n')}`).toEqual([]);
});

test('press ㅜ (KeyN) triggers burst FX', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  await page.locator('#waveform').click();
  await page.keyboard.press('n');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS_DIR}/press-n.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('DJ slot 1 triggers drop', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  await page.locator('#waveform').click();
  await page.keyboard.press('1');
  await page.waitForTimeout(300);
  await expect(page.locator('body.fx-shake')).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/dj-1.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('A key spawns a cat', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  await page.locator('#waveform').click();
  await page.keyboard.press('a');
  await expect(page.locator('.cat-layer .cat-pop')).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/cat-a.png`, fullPage: true });
  expect(errors).toEqual([]);
});
