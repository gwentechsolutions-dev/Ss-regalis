import { test, expect } from "@playwright/test";
test("public routes, filters, detail gallery, responsive layouts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Rooted in heritage/ }),
  ).toBeVisible();
  for (const width of [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator("body")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/properties");
  await expect(
    page.getByRole("heading", { name: "Find your place." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Farmland", exact: true }).click();
  await expect(page).toHaveURL(/category=Farmland/);
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "All properties", exact: true })
    .click();
  await expect(page).not.toHaveURL(/category=Farmland/);
  await page.getByLabel("Search properties").fill("Courtyard");
  await expect(page).toHaveURL(/q=Courtyard/);
  await expect(page.locator(".property-card")).toHaveCount(1);
  await page.getByRole("link", { name: "View property", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The Courtyard House", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open fullscreen gallery" }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).not.toBeVisible();
  for (const route of [
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
});
test("intro skip, persistence, reduced motion and mobile fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const skip = page.getByRole("button", { name: /Skip intro/ });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(skip).not.toBeVisible();
  await page.reload();
  await expect(skip).not.toBeVisible();
});
test("public API rejects unauthorized writes and invalid enquiries", async ({
  request,
}) => {
  const headers = { Origin: "http://localhost:3000" };
  const unauthorized = await request.post("/api/admin/properties", {
    headers,
    data: {},
  });
  expect(unauthorized.status()).toBe(401);
  const cross = await request.post("/api/admin/settings", {
    headers: { Origin: "https://attacker.invalid" },
    data: {},
  });
  expect(cross.status()).toBe(403);
  const invalid = await request.post("/api/enquiries", {
    headers,
    data: { name: "X" },
  });
  expect(invalid.status()).toBe(400);
  const leak = await request.get("/api/admin/enquiries");
  expect(leak.status()).toBe(401);
});
test("mobile filters, URL history, list layout and contact responsiveness", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/properties");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.getByLabel("Minimum budget").fill("3000000");
  await page.getByRole("button", { name: "Show properties" }).click();
  await expect(page).toHaveURL(/minPrice=3000000/);
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(page).toHaveURL(/view=list/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page).not.toHaveURL(/view=list/);
  await expect(page).toHaveURL(/minPrice=3000000/);
  await page.screenshot({
    path: "test-results/properties-mobile.png",
    fullPage: true,
  });
  await page.goto("/contact");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/contact-mobile.png",
    fullPage: true,
  });
  await expect(page.locator(".temple-intro")).toHaveCount(0);
});
test("intro completes and unsupported WebGL leaves the homepage usable", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Skip intro/ })).toBeVisible();
  await expect(page.locator(".temple-intro")).toHaveCount(0, { timeout: 10000 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const fallback = await context.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return (original as any).call(this, type, ...args);
    } as typeof original;
  });
  await fallback.goto("/");
  await expect(
    fallback.getByRole("heading", { name: /Rooted in heritage/ }),
  ).toBeVisible();
  await expect(fallback.locator(".temple-intro")).toHaveCount(0, { timeout: 10000 });
  await context.close();
});


