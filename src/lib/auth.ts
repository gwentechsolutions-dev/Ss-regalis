import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { db } from "./db";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const a = Buffer.from(key, "hex"),
    b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function session() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return getIronSession<{
    userId?: string;
    version?: number;
    expires?: number;
  }>(await cookies(), {
    password: secret,
    cookieName: "regalis-session",
    ttl: 28800,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 28800,
    },
  });
}
export async function currentUser() {
  if (!process.env.SESSION_SECRET) return null;
  const s = await session();
  if (!s.userId || !s.expires || s.expires < Date.now()) return null;
  const k = await db();
  const u = await k("users")
    .where({ id: s.userId, sessionVersion: s.version })
    .first();
  return u ? { id: u.id, email: u.email, role: u.role } : null;
}
export async function requireUser(owner = false) {
  const u = await currentUser();
  if (!u) throw new ApiError(401, "Sign in to continue.");
  if (owner && u.role !== "owner")
    throw new ApiError(403, "Owner access required.");
  return u;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.SITE_URL || new URL(request.url).origin;
  if (origin !== expected) throw new ApiError(403, "Invalid request origin.");
}
export function clientKey(request: Request) {
  return process.env.TRUST_PROXY === "true"
    ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "local";
}
export async function rateLimit(key: string, max: number, seconds: number) {
  const k = await db();
  const hash = createHash("sha256").update(key).digest("hex");
  const now = Date.now();
  await k("limits").where("expires", "<", now).delete();
  await k("limits")
    .insert({ key: hash, count: 0, expires: now + seconds * 1000 })
    .onConflict("key")
    .ignore();
  const n = await k("limits")
    .where({ key: hash })
    .where("count", "<", max)
    .increment("count", 1);
  if (!n) throw new ApiError(429, "Too many attempts. Please try again later.");
}
