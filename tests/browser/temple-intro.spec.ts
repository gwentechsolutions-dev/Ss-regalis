import { test, expect } from '@playwright/test';
test('video plays automatically on desktop and mobile, then stays dismissed', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    const intro = page.locator('.temple-intro');
    await expect(intro).toHaveClass(/intro-playing/);
    const video = page.locator('.temple-video');
    const info = await video.evaluate((v: HTMLVideoElement) => ({ duration:v.duration, width:v.videoWidth, height:v.videoHeight, muted:v.muted, paused:v.paused }));
    console.log('Video metadata', width, info);
    expect(info.muted).toBe(true); expect(info.paused).toBe(false);
    await page.screenshot({path:`test-results/temple-video-${width}.png`});
    await expect(intro).toHaveCount(0, { timeout: Math.ceil(info.duration * 1000) + 3000 });
    await page.reload();
    await expect(intro).toHaveCount(0);
    await expect(page.getByRole('heading', { name:/Rooted in heritage/ })).toBeVisible();
    await context.close();
  }
});
test('skip during loading cannot restart, reduced motion and failed video fall back', async ({browser}) => {
  const context = await browser.newContext(); const page = await context.newPage();
  await page.route('**/videos/temple-entrance.mp4', async route => { await new Promise(r=>setTimeout(r, 1200)); await route.continue(); });
  await page.goto('/', {waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Skip Intro'}).click();
  await page.waitForTimeout(1500);
  await expect(page.locator('.temple-intro')).toHaveCount(0);
  await context.close();
  const reduced = await browser.newContext({reducedMotion:'reduce'}); const quiet = await reduced.newPage();
  await quiet.goto('/'); await expect(quiet.locator('.temple-intro')).toHaveCount(0); await reduced.close();
  const broken = await browser.newContext(); const fallback = await broken.newPage();
  await fallback.route('**/videos/temple-entrance.mp4',route=>route.abort());
  await fallback.goto('/'); await expect(fallback.locator('.temple-intro')).toHaveCount(0,{timeout:6000});
  await expect(fallback.getByRole('link',{name:'Explore properties',exact:true})).toBeVisible(); await broken.close();
});

test('first visit is covered before hydration, returning visit is not', async ({ browser }) => {
  for (const returning of [false, true]) {
    const context = await browser.newContext();
    if (returning) await context.addInitScript(() => localStorage.setItem('regalis-intro', 'seen'));
    const page = await context.newPage();
    await page.route('**/_next/static/**/*.js', async route => {
      await new Promise(resolve => setTimeout(resolve, 1800));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'commit' });
    await page.waitForSelector('body', { state: 'attached' });
    const cover = await page.evaluate(() => ({
      pending: document.documentElement.dataset.introPending,
      position: getComputedStyle(document.documentElement, '::after').position,
      background: getComputedStyle(document.documentElement, '::after').backgroundColor,
    }));
    if (!returning) {
      expect(cover.pending).toBe('true');
      expect(cover.position).toBe('fixed');
      expect(cover.background).toBe('rgb(16, 12, 8)');
      await expect(page.locator('.temple-intro')).toHaveClass(/intro-playing/, {timeout:10000});
      await expect(page.locator('html')).not.toHaveAttribute('data-intro-pending');
    } else {
      expect(cover.pending).toBeUndefined();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.temple-intro')).toHaveCount(0);
    }
    await context.close();
  }
});
