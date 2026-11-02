import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  propertySchema,
  enquirySchema,
  settingsSchema,
  defaults,
  units,
  whatsappUrl,
} from "../src/lib/domain";
import { db, record, queryProperties, getProperty } from "../src/lib/db";
import {
  hashPassword,
  verifyPassword,
  checkOrigin,
  rateLimit,
} from "../src/lib/auth";
process.env.SQLITE_PATH = join(
  mkdtempSync(join(tmpdir(), "regalis-test-")),
  "test.sqlite",
);
delete process.env.DATABASE_URL;
process.env.DEMO_MODE = "true";
process.env.SITE_URL = "http://localhost:3000";
const fixture = (n: number, extra = {}) =>
  propertySchema.parse({
    title: `Test property ${n}`,
    slug: `test-${n}`,
    category: "Residential Plot",
    description: "A fixture for automated property database testing.",
    price: 1000000 + n * 1000,
    area: 1,
    unit: "acre",
    location: "Kanchipuram",
    status: "Available",
    ...extra,
  });
test("measurement conversions and validation", () => {
  assert.equal(units.cent * 100, units.acre);
  assert.equal(units["sq ft"], 1);
  assert.equal(
    propertySchema.safeParse({ ...fixture(1), price: -1 }).success,
    false,
  );
  assert.equal(
    propertySchema.safeParse({ ...fixture(1), mapsUrl: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...defaults, instagram: "javascript:alert(1)" })
      .success,
    false,
  );
});
test("enquiry requires consent and rejects spam", () => {
  const e = {
    name: "Test Visitor",
    phone: "+919876543210",
    interest: "House",
    message: "Please provide more information.",
    consent: true,
  };
  assert.equal(enquirySchema.safeParse(e).success, true);
  assert.equal(
    enquirySchema.safeParse({ ...e, consent: false }).success,
    false,
  );
  assert.equal(
    enquirySchema.safeParse({ ...e, website: "spam" }).success,
    false,
  );
});
test("passwords salted and verified", () => {
  const a = hashPassword("correct-horse-battery"),
    b = hashPassword("correct-horse-battery");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("correct-horse-battery", a), true);
  assert.equal(verifyPassword("wrong", a), false);
});
test("WhatsApp links encode context", () => {
  const link = whatsappUrl({ ...defaults, whatsapp: "919876543210" });
  assert.match(link, /^https:\/\/wa.me\/919876543210\?text=/);
  assert.equal(
    new URL(link).searchParams.get("text"),
    "Hi SS Regalis Reality, I would like to know more about your available properties.",
  );
});
test("cross-origin writes rejected", () => {
  assert.throws(() =>
    checkOrigin(
      new Request("http://localhost:3000/api/admin/settings", {
        headers: { origin: "https://attacker.invalid" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3000/api/admin/settings", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
  );
});
test("database filtering, pagination, statuses, optimistic version and archive", async () => {
  const k = await db();
  for (let i = 0; i < 28; i++) {
    const p = fixture(i, {
      status:
        i === 0
          ? "Hidden"
          : i === 1
            ? "Sold"
            : i === 2
              ? "Reserved"
              : "Available",
      category: i % 2 ? "House" : "Residential Plot",
      bedrooms: i % 2 ? 3 : 0,
      water: i % 2 === 0,
      approvalVerified: i % 2 === 0,
      approvals: "DTCP",
    });
    await k("properties").insert({
      ...record(p),
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      archived: false,
      version: 1,
    });
  }
  const all = await queryProperties({});
  assert.equal(all.total, 27);
  assert.equal(all.properties.length, 12);
  assert.equal((await queryProperties({ page: "3" })).properties.length, 3);
  const available = await queryProperties({ status: "Available" });
  assert.equal(available.total, 25);
  assert.ok(available.properties.every((p) => p.status === "Available"));
  assert.equal(await getProperty("test-0"), null);
  assert.equal((await queryProperties({ q: "' OR 1=1 --" })).total, 0);
  assert.equal(
    (await queryProperties({ bedrooms: "3", category: "House" })).total,
    14,
  );
  assert.equal(
    (await queryProperties({ minArea: "101", unit: "cent" })).total,
    0,
  );
  assert.equal((await queryProperties({ water: "true" })).total, 13);
  assert.equal((await queryProperties({ approvals: "DTCP" })).total, 13);
  const asc = await queryProperties({ sort: "price_asc" });
  assert.ok(asc.properties[0].price < asc.properties[1].price);
  const p = asc.properties[0];
  assert.equal(
    await k("properties")
      .where({ id: p.id, version: 1 })
      .update({ version: 2, status: "Sold" }),
    1,
  );
  assert.equal(
    await k("properties")
      .where({ id: p.id, version: 1 })
      .update({ version: 2 }),
    0,
  );
  assert.equal((await getProperty(p.slug))?.status, "Sold");
  await k("properties").where({ id: p.id }).update({ archived: true });
  assert.equal(await getProperty(p.slug), null);
  assert.equal((await queryProperties({ archived: "true" }, true)).total, 1);
});
test("database rate limit rejects excess attempts", async () => {
  await rateLimit("test-limit", 2, 60);
  await rateLimit("test-limit", 2, 60);
  await assert.rejects(
    () => rateLimit("test-limit", 2, 60),
    /Too many attempts/,
  );
});
test("sample listings excluded in production mode", async () => {
  const k = await db();
  const p = fixture(100, { demo: true });
  await k("properties").insert({
    ...record(p),
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    archived: false,
    version: 1,
  });
  process.env.DEMO_MODE = "false";
  assert.equal(await getProperty(p.slug), null);
  assert.equal((await queryProperties({ q: "Test property 100" })).total, 0);
  process.env.DEMO_MODE = "true";
});
after(async () => {
  await (await db()).destroy();
});
test("a large inventory stays server-paginated", async () => {
  const k = await db();
  await k.transaction(async (tx) => {
    for (let batch = 0; batch < 10; batch++) {
      const rows = Array.from({ length: 100 }, (_, i) => {
        const p = fixture(1000 + batch * 100 + i);
        return {
          ...record(p),
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          archived: false,
          version: 1,
        };
      });
      await tx("properties").insert(rows);
    }
  });
  const result = await queryProperties({
    status: "Available",
    page: "50",
    sort: "price_asc",
  });
  assert.ok(result.total >= 1000);
  assert.equal(result.properties.length, 12);
  assert.equal(result.page, 50);
  assert.ok(JSON.stringify(result).length < 30000);
});
