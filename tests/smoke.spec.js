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

test('start hint shows and dismisses on first interaction', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  await expect(page.locator('#start-hint')).toBeVisible();
  await page.keyboard.press('n');
  await page.waitForTimeout(600);
  await expect(page.locator('#start-hint')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('app loads, core UI renders, no console errors', async ({ page }, testInfo) => {
  const errors = attachConsoleGuard(page);

  await page.goto('/');
  await page.keyboard.press('Escape').catch(() => {});
  await page.locator('#start-hint').evaluate((el) => el && el.remove()).catch(() => {});

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

test('? key opens help overlay, Esc closes', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  await page.locator('#start-hint').evaluate((el) => el && el.remove()).catch(() => {});
  await expect(page.locator('#keyhelp')).toBeHidden();
  await page.keyboard.press('Shift+/');
  await expect(page.locator('#keyhelp')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#keyhelp')).toBeHidden();
  expect(errors).toEqual([]);
});

test('haptic vibrate fires on key press (when API present)', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.addInitScript(() => {
    window.__vibrateCalls = [];
    navigator.vibrate = (p) => { window.__vibrateCalls.push(p); return true; };
  });
  await page.goto('/');
  await page.keyboard.press('n');
  await page.waitForTimeout(100);
  const calls = await page.evaluate(() => window.__vibrateCalls);
  expect(calls.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('record button toggles state', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  const btn = page.locator('#rec');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText(/녹음/);
  await btn.click();
  await expect(btn).toHaveClass(/recording/);
  await page.keyboard.press('n');
  await page.waitForTimeout(200);
  await btn.click();
  await expect(btn).not.toHaveClass(/recording/);
  expect(errors).toEqual([]);
});

test('touch key pads are rendered at touchable size', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('#keys .key').first();
  const box = await first.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(72);
});

test('tap tempo computes BPM after a few taps', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  const btn = page.locator('#tap');
  await expect(btn).toBeVisible();
  await expect(page.locator('#bpm-value')).toHaveText('— BPM');
  for (let i = 0; i < 4; i++) {
    await btn.click();
    await page.waitForTimeout(500); // ~120 BPM
  }
  const text = await page.locator('#bpm-value').textContent();
  expect(text).toMatch(/\d+ BPM/);
  const bpm = parseInt(text);
  expect(bpm).toBeGreaterThan(60);
  expect(bpm).toBeLessThan(200);
  expect(errors).toEqual([]);
});

test('share creates URL preset that reloads into app', async ({ page, context }) => {
  const errors = attachConsoleGuard(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.waitForSelector('select[data-slot="0"]');

  await page.selectOption('select[data-slot="0"]', 'reverse');
  await page.locator('#share').click();
  await expect(page.locator('#toast')).toBeVisible();
  const url = page.url();
  expect(url).toMatch(/#p=/);

  await page.goto(url);
  await page.waitForSelector('select[data-slot="0"]');
  const val = await page.locator('select[data-slot="0"]').inputValue();
  expect(val).toBe('reverse');
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
