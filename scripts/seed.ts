import { db, record } from "../src/lib/db";
import { propertySchema } from "../src/lib/domain";
import { randomUUID } from "node:crypto";
import { demoPhotos } from '../src/lib/demo-photos';
async function main() {
  if (process.env.DEMO_MODE !== "true")
    throw new Error(
      "Set DEMO_MODE=true to explicitly seed demonstration listings.",
    );
  const k = await db();
  const fixtures = [
    [
      "The Courtyard House",
      "House",
      "Kanchipuram",
      8500000,
      2100,
      "sq ft",
      3,
      "photo-1600596542815-ffad4c1539a9",
    ],
    [
      "A Place to Grow",
      "Residential Plot",
      "Around Kanchipuram",
      2850000,
      1800,
      "sq ft",
      0,
      "photo-1500382017468-9049fed747ef",
    ],
    [
      "The Garden Villa",
      "Villa",
      "Kanchipuram",
      12500000,
      2850,
      "sq ft",
      4,
      "photo-1600607687920-4e2a09cf159d",
    ],
    [
      "Open Fields",
      "Farmland",
      "Kanchipuram district",
      6500000,
      2.5,
      "acre",
      0,
      "photo-1472396961693-142e6e269027",
    ],
    [
      "An Urban Retreat",
      "Apartment",
      "Kanchipuram",
      5200000,
      1250,
      "sq ft",
      2,
      "photo-1600566753086-00f18fb6b3ea",
    ],
    [
      "Space for Your Vision",
      "Commercial",
      "Kanchipuram",
      9500000,
      2400,
      "sq ft",
      0,
      "photo-1486406146926-c627a92ad1ab",
    ],
  ];
  for (const [i, f] of fixtures.entries()) {
    const [title, category, location, price, area, unit, bedrooms, img] = f;
    const slug = `sample-${String(title).toLowerCase().replaceAll(" ", "-")}`;
    if (await k("properties").where({ slug }).first()) continue;
    const p = propertySchema.parse({
      title,
      slug,
      category,
      location,
      price,
      area,
      unit,
      bedrooms,
      bathrooms: Number(bedrooms) ? 2 : 0,
      description:
        "DEMONSTRATION LISTING — This is sample content showing how a property will appear. The photographs are architectural inspiration, not photographs of a property offered for sale. Price, area and features are fictional examples. Contact the team for verified current listings.",
      demo: true,
      featured: i < 3,
      status: i === 4 ? "Sold" : i === 5 ? "Reserved" : "Available",
      images: demoPhotos[String(category)] || [],
    });
    await k("properties").insert({
      ...record(p),
      id: randomUUID(),
      version: 1,
      archived: false,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  console.log("Six clearly labelled sample listings are ready.");
  await k.destroy();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
