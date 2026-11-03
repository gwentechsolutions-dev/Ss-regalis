import knex, { type Knex } from "knex";
import { postgresConnection } from './postgres';
import { databaseFreeDemo, demoSettings, demoProperties } from './demo';
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  defaults,
  type Property,
  type PropertyInput,
  type Settings,
  units,
} from "./domain";
const globalDb = globalThis as unknown as {
  regalisDb?: Knex;
  regalisReady?: Promise<void>;
};
export function connection() {
  if (!globalDb.regalisDb) {
    const pg = !!process.env.DATABASE_URL;
    const filename = process.env.SQLITE_PATH || "./data/regalis.sqlite";
    if (!pg) fs.mkdirSync(path.dirname(filename), { recursive: true });
    globalDb.regalisDb = knex(
      pg
        ? {
            client: "pg",
            connection: postgresConnection(),
            pool: { min: 0, max: 10 },
          }
        : {
            client: "better-sqlite3",
            connection: { filename },
            useNullAsDefault: true,
            pool: {
              min: 1,
              max: 1,
              afterCreate: (c: any, done: any) => {
                c.pragma("journal_mode = WAL");
                c.pragma("busy_timeout = 5000");
                done(null, c);
              },
            },
          },
    );
  }
  return globalDb.regalisDb;
}
export async function db() {
  const k = connection();
  globalDb.regalisReady ??= migrate(k);
  await globalDb.regalisReady;
  return k;
}
async function migrate(k: Knex) {
  if (!(await k.schema.hasTable("schema_versions")))
    await k.schema.createTable("schema_versions", (t) => {
      t.integer("version").primary();
      t.string("appliedAt");
    });
  if (await k("schema_versions").where({ version: 1 }).first()) return;
  await k.transaction(async (tx) => {
    await tx.schema.createTable("properties", (t) => {
      t.string("id").primary();
      t.string("slug").unique();
      t.string("title");
      t.string("category").index();
      t.string("location").index();
      t.string("status").index();
      t.double("price").index();
      t.double("areaSqft").index();
      t.integer("bedrooms").defaultTo(0);
      t.integer("bathrooms").defaultTo(0);
      t.boolean("featured").defaultTo(false);
      t.boolean("archived").defaultTo(false);
      t.boolean("demo").defaultTo(false);
      t.integer("version").defaultTo(1);
      t.text("data");
      t.string("createdAt").index();
      t.string("updatedAt");
      t.index(["archived", "status", "category"]);
    });
    await tx.schema.createTable("settings", (t) => {
      t.integer("id").primary();
      t.text("data");
    });
    await tx("settings").insert({ id: 1, data: JSON.stringify(defaults) });
    await tx.schema.createTable("users", (t) => {
      t.string("id").primary();
      t.string("email").unique();
      t.string("hash");
      t.string("role");
      t.integer("sessionVersion").defaultTo(1);
    });
    await tx.schema.createTable("enquiries", (t) => {
      t.string("id").primary();
      t.string("name");
      t.string("phone");
      t.string("email");
      t.string("interest");
      t.string("location");
      t.text("message");
      t.string("propertyId");
      t.string("visitDate");
      t.string("status").defaultTo("New").index();
      t.text("notes").defaultTo("");
      t.string("createdAt").index();
    });
    await tx.schema.createTable("audit", (t) => {
      t.string("id").primary();
      t.string("userId");
      t.string("action");
      t.string("target");
      t.string("createdAt");
    });
    await tx.schema.createTable("limits", (t) => {
      t.string("key").primary();
      t.integer("count");
      t.bigInteger("expires");
    });
    await tx.schema.createTable("resets", (t) => {
      t.string("hash").primary();
      t.string("userId");
      t.bigInteger("expires");
    });
    await tx.schema.createTable("events", (t) => {
      t.string("id").primary();
      t.string("kind").index();
      t.string("propertyId");
      t.string("day").index();
    });
    await tx("schema_versions").insert({
      version: 1,
      appliedAt: new Date().toISOString(),
    });
  });
}
export async function getSettings(): Promise<Settings> {
  if (databaseFreeDemo()) return demoSettings();
  const k = await db();
  const r = await k("settings").where({ id: 1 }).first();
  return { ...defaults, ...JSON.parse(r.data) };
}
export function decode(row: any): Property {
  return {
    ...JSON.parse(row.data),
    ...Object.fromEntries(Object.entries(row).filter(([k]) => k !== "data")),
    featured: !!row.featured,
    archived: !!row.archived,
    demo: !!row.demo,
  };
}
export function record(p: PropertyInput) {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category,
    location: p.location,
    status: p.status,
    price: p.price,
    areaSqft: p.area * units[p.unit],
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    featured: p.featured,
    demo: p.demo,
    data: JSON.stringify(p),
    updatedAt: new Date().toISOString(),
  };
}
export async function audit(
  userId: string,
  action: string,
  target: string,
  k?: Knex | Knex.Transaction,
) {
  await (k || (await db()))("audit").insert({
    id: randomUUID(),
    userId,
    action,
    target,
    createdAt: new Date().toISOString(),
  });
}
export async function queryProperties(
  params: Record<string, string | undefined>,
  admin = false,
) {
  if (databaseFreeDemo()) return demoProperties(params);
  const k = await db();
  const q = k("properties").where(
    "archived",
    params.archived === "true" && admin,
  );
  if (!admin) {
    q.whereNot("status", "Hidden");
    if (process.env.DEMO_MODE !== "true") q.where("demo", false);
    if (!(await getSettings()).showSold) q.whereNot("status", "Sold");
  }
  for (const key of ["category", "status"])
    if (params[key]) q.where(key, params[key]!);
  if (params.featured === "true") q.where("featured", true);
  if (params.q)
    q.where((b) =>
      b
        .whereLike("title", `%${params.q!.slice(0, 100)}%`)
        .orWhereLike("location", `%${params.q!.slice(0, 100)}%`),
    );
  if (params.location)
    q.whereLike("location", `%${params.location.slice(0, 100)}%`);
  for (const [key, col, op] of [
    ["minPrice", "price", ">="],
    ["maxPrice", "price", "<="],
    ["minArea", "areaSqft", ">="],
    ["maxArea", "areaSqft", "<="],
    ["bedrooms", "bedrooms", ">="],
    ["bathrooms", "bathrooms", ">="],
  ])
    if (params[key] && Number.isFinite(Number(params[key])))
      q.where(
        col,
        op,
        Number(params[key]) *
          (key.includes("Area")
            ? units[params.unit as keyof typeof units] || 1
            : 1),
      );
  // JSON extraction uses bound paths and values, with a PostgreSQL equivalent.
  for (const key of [
    "facing",
    "furnishing",
    "construction",
    "parking",
    "water",
    "electricity",
    "approvalVerified",
    "road",
    "approvals",
    "amenities",
  ])
    if (params[key]) {
      const pg = !!process.env.DATABASE_URL;
      const expression = pg ? "data::jsonb ->> ?" : "json_extract(data, ?)";
      const jsonKey = pg ? key : `$.${key}`;
      const bool = [
        "parking",
        "water",
        "electricity",
        "approvalVerified",
      ].includes(key);
      const value = bool
        ? pg
          ? params[key]
          : params[key] === "true"
            ? 1
            : 0
        : params[key];
      if (["road", "amenities", "approvals"].includes(key))
        q.whereRaw(`${expression} LIKE ?`, [jsonKey, `%${value}%`]);
      else q.whereRaw(`${expression} = ?`, [jsonKey, value!]);
      if (key === "approvals")
        q.whereRaw(`${expression} = ?`, [
          pg ? "approvalVerified" : "$.approvalVerified",
          pg ? "true" : 1,
        ]);
    }
  const [{ count }] = await q.clone().count("* as count");
  const total = Number(count);
  const page = Math.max(
    1,
    Math.min(Number(params.page) || 1, Math.max(1, Math.ceil(total / 12))),
  );
  const sorts: Record<string, [string, "asc" | "desc"]> = {
    newest: ["createdAt", "desc"],
    oldest: ["createdAt", "asc"],
    price_asc: ["price", "asc"],
    price_desc: ["price", "desc"],
    area_asc: ["areaSqft", "asc"],
    area_desc: ["areaSqft", "desc"],
    bedrooms: ["bedrooms", "desc"],
  };
  const [col, dir] = sorts[params.sort || "newest"] || sorts.newest;
  const rows = await q
    .orderBy(col, dir)
    .orderBy("id")
    .limit(12)
    .offset((page - 1) * 12);
  return {
    properties: rows.map(decode),
    total,
    page,
    pages: Math.ceil(total / 12),
  };
}
export async function getProperty(slug: string, admin = false) {
  if (databaseFreeDemo()) return demoProperties({}).properties.find(p => admin ? p.id === slug : p.slug === slug) || null;
  const k = await db();
  const row = await k("properties")
    .where(admin ? { id: slug } : { slug, archived: false })
    .first();
  if (
    !row ||
    (!admin &&
      (row.status === "Hidden" ||
        (row.demo && process.env.DEMO_MODE !== "true") ||
        (!(await getSettings()).showSold && row.status === "Sold")))
  )
    return null;
  return decode(row);
}
