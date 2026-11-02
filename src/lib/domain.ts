import { z } from "zod";
export const categories = [
  "Residential Plot",
  "Farmland",
  "House",
  "Villa",
  "Apartment",
  "Commercial",
  "Other",
] as const;
export const statuses = ["Available", "Reserved", "Sold", "Hidden"] as const;
export const units = {
  "sq ft": 1,
  cent: 435.6,
  acre: 43560,
  "sq m": 10.7639104,
};
export const imageSchema = z.object({
  url: z
    .string()
    .max(1500)
    .refine(
      (v) => v.startsWith("/uploads/") || /^\/images\/demo\/reference-\d+\.webp$/.test(v) || /^https:\/\//.test(v),
      "Use an uploaded image or HTTPS URL",
    ),
  alt: z.string().min(3).max(250),
});
export const propertySchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(180),
  category: z.enum(categories),
  description: z.string().trim().min(20).max(15000),
  price: z.coerce.number().min(0).max(1e12),
  area: z.coerce.number().positive().max(1e10),
  unit: z.enum(["sq ft", "cent", "acre", "sq m"]),
  location: z.string().trim().min(2).max(200),
  city: z.string().max(100).default(""),
  district: z.string().max(100).default(""),
  address: z.string().max(500).default(""),
  status: z.enum(statuses).default("Hidden"),
  featured: z.boolean().default(false),
  demo: z.boolean().default(false),
  negotiable: z.boolean().default(false),
  bedrooms: z.coerce.number().int().min(0).max(100).default(0),
  bathrooms: z.coerce.number().int().min(0).max(100).default(0),
  builtUp: z.coerce.number().min(0).default(0),
  facing: z.string().max(40).default(""),
  furnishing: z.string().max(60).default(""),
  construction: z.string().max(80).default(""),
  parking: z.boolean().default(false),
  water: z.boolean().default(false),
  electricity: z.boolean().default(false),
  road: z.string().max(150).default(""),
  approvals: z.string().max(1000).default(""),
  approvalVerified: z.boolean().default(false),
  landmarks: z.string().max(2000).default(""),
  amenities: z.string().max(2000).default(""),
  specifications: z.string().max(10000).default(""),
  advantages: z.string().max(10000).default(""),
  floorPlans: z.array(z.object({
    type: z.string().trim().min(1).max(100),
    area: z.coerce.number().positive().max(1e10),
    price: z.coerce.number().min(0).max(1e12),
    url: z.string().max(1500).refine(v => !v || /^https:\/\//.test(v) || v.startsWith('/uploads/'), 'Use an HTTPS or uploaded plan URL').default(''),
  })).max(40).default([]),
  mapsUrl: z
    .string()
    .max(1500)
    .default("")
    .refine(
      (v) =>
        !v ||
        /^https:\/\/(www\.google\.com\/maps|maps\.google\.com\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/)/.test(
          v,
        ),
      "Use a Google Maps HTTPS link",
    ),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  images: z.array(imageSchema).max(30).default([]),
  version: z.number().int().min(1).optional(),
});
export type PropertyInput = z.infer<typeof propertySchema>;
export type Property = PropertyInput & {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  areaSqft: number;
};
const optionalUrl = z
  .string()
  .max(1500)
  .refine((v) => !v || /^https:\/\//.test(v), "Use an HTTPS URL");
export const settingsSchema = z.object({
  name: z.string().min(2).max(120),
  tagline: z.string().max(200),
  description: z.string().max(3000),
  phone: z.string().regex(/^(\+?[1-9]\d{7,14})?$/),
  whatsapp: z.string().regex(/^([1-9]\d{7,14})?$/),
  email: z.union([z.literal(""), z.email()]),
  address: z.string().max(600),
  hours: z.string().max(300),
  mapsUrl: propertySchema.shape.mapsUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  logo: z
    .string()
    .max(1500)
    .refine((v) => !v || v.startsWith("/uploads/") || /^https:\/\//.test(v)),
  seoTitle: z.string().max(150),
  seoDescription: z.string().max(300),
  whatsappMessage: z.string().max(1000),
  about: z.string().max(10000),
  showSold: z.boolean(),
  templeModel: optionalUrl,
});
export type Settings = z.infer<typeof settingsSchema>;
export const defaults: Settings = {
  name: "SS Regalis Reality",
  tagline: "Building Trust, Creating Value.",
  description:
    "Based in Kanchipuram, connecting people with land, homes, and new beginnings across Tamil Nadu.",
  phone: "",
  whatsapp: "919080164771",
  email: "ssregaladvisory@gmail.com",
  address: "",
  hours: "",
  mapsUrl: "",
  instagram: "",
  facebook: "",
  twitter: "",
  youtube: "",
  logo: "",
  seoTitle: "SS Regalis Reality | Properties across Tamil Nadu",
  seoDescription:
    "Explore residential plots, homes, villas and farmland across Tamil Nadu with SS Regalis Reality, based in Kanchipuram.",
  whatsappMessage:
    "Hi {business}, I would like to know more about your available properties.",
  about:
    "A place to put down roots. A space to build your future. Based in Kanchipuram, SS Regalis Reality brings a considered, personal approach to finding property across Tamil Nadu. Tell us what matters to you, and let’s explore the possibilities together.",
  showSold: true,
  templeModel: "",
};
export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^\+?[0-9 ()-]{8,20}$/),
  email: z.union([z.literal(""), z.email()]).default(""),
  interest: z.string().max(160),
  location: z.string().max(200).default(""),
  message: z.string().trim().min(10).max(3000),
  consent: z.literal(true),
  website: z.string().max(0).default(""),
  propertyId: z.string().max(80).default(""),
  visitDate: z.string().max(30).default(""),
});
export function isHome(category: string) {
  return ["House", "Villa", "Apartment"].includes(category);
}
export function money(value: number) {
  return value >= 1e7
    ? `₹${(value / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`
    : value >= 1e5
      ? `₹${(value / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lac`
      : `₹${value.toLocaleString("en-IN")}`;
}
export function whatsappUrl(
  settings: Settings,
  property?: Property,
  origin = "",
) {
  const message = property
    ? `Hi ${settings.name}, I'm interested in ${property.title} located at ${property.location}. Please share more details. ${origin}/properties/${property.slug}`
    : settings.whatsappMessage.replaceAll("{business}", settings.name);
  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;
}
