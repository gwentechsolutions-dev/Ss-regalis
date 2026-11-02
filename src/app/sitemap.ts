import type { MetadataRoute } from "next";
import { db, getSettings } from "@/lib/db";
import { databaseFreeDemo } from '@/lib/demo';
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL || "http://localhost:3000";
  if (databaseFreeDemo()) return ['', '/properties', '/about', '/contact'].map(p => ({url:origin+p}));
  const k = await db();
  const s = await getSettings();
  const query = k("properties")
    .where({ archived: false, demo: false })
    .whereNot("status", "Hidden");
  if (!s.showSold) query.whereNot("status", "Sold");
  const rows = await query.select("slug", "updatedAt");
  return [
    ...[
      "",
      "/properties",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms",
      "/disclaimer",
    ].map((p) => ({ url: origin + p })),
    ...rows.map((p) => ({
      url: `${origin}/properties/${p.slug}`,
      lastModified: new Date(p.updatedAt),
    })),
  ];
}
