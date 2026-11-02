import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { db } from "../../src/lib/db";
import { hashPassword } from "../../src/lib/auth";
import { propertySchema } from "../../src/lib/domain";
const email = `qa-${randomUUID()}@example.invalid`;
const password = randomBytes(24).toString("hex");
const userId = randomUUID();
const slug = `qa-${randomUUID()}`;
let propertyId = "";
let enquiryId = "";
let imagePath = "";
let originalSettings: any;
test.beforeAll(async () => {
  const k = await db();
  // This suite targets only the seeded localhost development database.
  await k("limits")
    .whereIn(
      "key",
      ["login:local", "enquiry:local"].map((key) =>
        createHash("sha256").update(key).digest("hex"),
      ),
    )
    .delete();
  await k("users").insert({
    id: userId,
    email,
    hash: hashPassword(password),
    role: "owner",
    sessionVersion: 1,
  });
});
test.afterAll(async () => {
  const k = await db();
  if (originalSettings)
    await k("settings")
      .where({ id: 1 })
      .update({ data: JSON.stringify(originalSettings) });
  if (propertyId) await k("properties").where({ id: propertyId }).delete();
  await k("properties").where({ slug }).delete();
  if (enquiryId) await k("enquiries").where({ id: enquiryId }).delete();
  await k("audit").where({ userId }).delete();
  await k("users").where({ id: userId }).delete();
  if (imagePath) {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const target = path.resolve("public", imagePath.replace(/^\//, ""));
    if (target.startsWith(path.resolve("public/uploads") + path.sep))
      await fs.unlink(target).catch(() => {});
  }
  await k.destroy();
});
test("authenticated property lifecycle, upload, enquiries, settings and session invalidation", async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  await page.goto("/admin/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Sign in", exact: false })
    .first()
    .click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to your workspace." }),
  ).toBeVisible();
  const headers = { Origin: "http://localhost:3000" };
  const auth = page.request;
  await page.getByRole("link", { name: "+ Add property" }).click();
  await expect(
    page.getByRole("heading", { name: "Add a property", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Property title *").fill("QA lifecycle property");
  await page.getByLabel("URL slug").fill(slug);
  await page.getByLabel("Total asking price").fill("3500000");
  await page.getByLabel("Land / property area").fill("1800");
  await page.getByLabel("Locality / village").fill("QA locality");
  await page
    .getByLabel("Description *")
    .fill("Automated test fixture. Not a real property offered for sale.");
  await page.getByRole("button", { name: "Save as draft" }).click();
  await expect(page).toHaveURL(/\/admin\/properties$/);
  const k = await db();
  const row = await k("properties").where({ slug }).first();
  expect(row.status).toBe("Hidden");
  propertyId = row.id;
  expect(await (await request.get(`/properties/${slug}`)).text()).toContain(
    "This space isn",
  );
  const invalidUpload = await auth.post("/api/admin/upload", {
    headers,
    multipart: {
      file: {
        name: "attack.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
    },
  });
  expect(invalidUpload.status()).toBe(400);
  const sharp = (await import("sharp")).default;
  const png = await sharp({
    create: { width: 30, height: 30, channels: 3, background: "#a99966" },
  })
    .png()
    .toBuffer();
  const upload = await auth.post("/api/admin/upload", {
    headers,
    multipart: {
      file: { name: "test.png", mimeType: "image/png", buffer: png },
    },
  });
  expect(upload.ok(), await upload.text()).toBe(true);
  imagePath = (await upload.json()).url;
  expect(imagePath).toMatch(/^\/uploads\/.*\.webp$/);
  expect((await request.get(imagePath)).ok()).toBe(true);
  const original = JSON.parse(row.data);
  const updated = propertySchema.parse({
    ...original,
    status: "Available",
    images: [{ url: imagePath, alt: "Test image for lifecycle verification" }],
    version: 1,
  });
  const edit = await auth.put(`/api/admin/properties/${propertyId}`, {
    headers,
    data: updated,
  });
  expect(edit.status()).toBe(200);
  const conflict = await auth.put(`/api/admin/properties/${propertyId}`, {
    headers,
    data: updated,
  });
  expect(conflict.status()).toBe(409);
  await page.goto(`/properties/${slug}`);
  await expect(
    page.getByRole("heading", { name: "QA lifecycle property", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Full name *").fill("QA Enquiry Visitor");
  await page.getByLabel("Mobile number *").fill("+919999999999");
  await page
    .getByLabel("Your message *")
    .fill("This is an automated test enquiry. Please ignore.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("received");
  const enq = await k("enquiries")
    .where({ name: "QA Enquiry Visitor", propertyId })
    .first();
  expect(enq).toBeTruthy();
  enquiryId = enq.id;
  await page.goto("/admin/enquiries");
  await page.getByText("QA Enquiry Visitor", { exact: true }).click();
  await page.getByLabel("Private notes").fill("QA follow-up note");
  await page
    .locator(".enquiry-body")
    .locator('select[name="status"]')
    .selectOption("Follow-up");
  await page.getByRole("button", { name: "Save enquiry" }).click();
  await expect(page.getByRole("status")).toContainText("updated");
  expect((await k("enquiries").where({ id: enquiryId }).first()).status).toBe(
    "Follow-up",
  );
  await auth.post("/api/admin/properties/bulk", {
    headers,
    data: { ids: [propertyId], action: "Sold" },
  });
  const available = await request.get(
    "/api/properties?status=Available&q=QA%20lifecycle",
  );
  expect((await available.json()).total).toBe(0);
  const sold = await request.get(`/properties/${slug}`);
  expect(await sold.text()).toContain("Sold");
  await auth.post("/api/admin/properties/bulk", {
    headers,
    data: { ids: [propertyId], action: "archive" },
  });
  expect(await (await request.get(`/properties/${slug}`)).text()).toContain(
    "This space isn",
  );
  await auth.post("/api/admin/properties/bulk", {
    headers,
    data: { ids: [propertyId], action: "restore" },
  });
  expect((await request.get(`/properties/${slug}`)).status()).toBe(200);
  originalSettings = JSON.parse(
    (await k("settings").where({ id: 1 }).first()).data,
  );
  await page.goto("/admin/settings");
  await page
    .getByLabel("Tagline", { exact: true })
    .fill("QA verified settings synchronization");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status")).toContainText("saved");
  expect(await (await request.get("/")).text()).toContain(
    "QA verified settings synchronization",
  );
  await k("settings")
    .where({ id: 1 })
    .update({ data: JSON.stringify(originalSettings) });
  originalSettings = undefined;
  await k("users").where({ id: userId }).update({ role: "editor" });
  const forbidden = await auth.put("/api/admin/settings", {
    headers,
    data: {},
  });
  expect(forbidden.status()).toBe(403);
  await k("users").where({ id: userId }).increment("sessionVersion", 1);
  const expired = await auth.post("/api/admin/properties/bulk", {
    headers,
    data: { ids: [propertyId], action: "Hidden" },
  });
  expect(expired.status()).toBe(401);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
