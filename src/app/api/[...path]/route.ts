import { readJson, boundedBody } from "@/lib/request";
import { NextResponse } from "next/server";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { db, getSettings, record, audit, queryProperties } from "@/lib/db";
import {
  ApiError,
  checkOrigin,
  clientKey,
  rateLimit,
  requireUser,
  session,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { propertySchema, settingsSchema, enquirySchema } from "@/lib/domain";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const parts = (await params).path;
    const route = parts.join("/");
    const k = await db();
    const method = req.method;
    const url = new URL(req.url);
    if (method !== "GET") checkOrigin(req);
    if (route === "properties" && method === "GET")
      return NextResponse.json(
        await queryProperties(Object.fromEntries(url.searchParams)),
      );
    if (route === "auth/logout" && method === "POST") {
      const s = await session();
      s.destroy();
      return NextResponse.json({ ok: true });
    }
    if (route === "auth/login" && method === "POST") {
      await rateLimit(`login:${clientKey(req)}`, 10, 900);
      const b = z
        .object({
          email: z.email().max(254),
          password: z.string().min(1).max(200),
        })
        .parse(await readJson(req));
      await rateLimit(`account:${b.email.toLowerCase()}`, 10, 900);
      const user = await k("users")
        .where({ email: b.email.toLowerCase() })
        .first();
      const dummy = "0".repeat(32) + ":" + "0".repeat(128);
      const valid = verifyPassword(b.password, user?.hash || dummy);
      if (!user || !valid)
        throw new ApiError(401, "Email or password is incorrect.");
      const s = await session();
      s.userId = user.id;
      s.version = user.sessionVersion;
      s.expires = Date.now() + 28800000;
      await s.save();
      await audit(user.id, "login", user.id);
      return NextResponse.json({ ok: true });
    }
    if (route === "auth/forgot" && method === "POST") {
      await rateLimit(`reset:${clientKey(req)}`, 3, 900);
      const { email } = z
        .object({ email: z.email() })
        .parse(await readJson(req));
      if (!process.env.SMTP_HOST)
        throw new ApiError(
          503,
          "Email recovery is not configured. Contact your site owner.",
        );
      const user = await k("users")
        .where({ email: email.toLowerCase() })
        .first();
      if (user) {
        const token = randomBytes(32).toString("hex");
        await k("resets").where({ userId: user.id }).delete();
        await k("resets").insert({
          hash: createHash("sha256").update(token).digest("hex"),
          userId: user.id,
          expires: Date.now() + 1800000,
        });
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: "Reset your SS Regalis admin password",
          text: `Reset your password within 30 minutes: ${process.env.SITE_URL}/admin/login?reset=${token}\nIf you did not request this, ignore this email.`,
        });
      }
      return NextResponse.json({
        message: "If this email is registered, a recovery link has been sent.",
      });
    }
    if (route === "auth/reset" && method === "POST") {
      await rateLimit(`reset-use:${clientKey(req)}`, 5, 900);
      const b = z
        .object({
          token: z.string().length(64),
          password: z.string().min(12).max(200),
        })
        .parse(await readJson(req));
      await k.transaction(async (tx) => {
        const hash = createHash("sha256").update(b.token).digest("hex");
        const r = await tx("resets")
          .where({ hash })
          .where("expires", ">", Date.now())
          .first();
        if (!r) throw new ApiError(400, "Recovery link expired or invalid.");
        const removed = await tx("resets").where({ hash }).delete();
        if (!removed) throw new ApiError(400, "Recovery link already used.");
        await tx("users")
          .where({ id: r.userId })
          .update({
            hash: hashPassword(b.password),
            sessionVersion: tx.raw("?? + 1", ["sessionVersion"]),
          });
      });
      return NextResponse.json({ ok: true });
    }
    if (route === "enquiries" && method === "POST") {
      await rateLimit(`enquiry:${clientKey(req)}`, 5, 3600);
      const { consent, website, ...b } = enquirySchema.parse(
        await readJson(req),
      );
      if (
        b.visitDate &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(b.visitDate) ||
          b.visitDate < new Date().toISOString().slice(0, 10))
      )
        throw new ApiError(400, "Select a future date.");
      if (
        b.propertyId &&
        !(await k("properties")
          .where({ id: b.propertyId, archived: false })
          .whereNot("status", "Hidden")
          .first())
      )
        throw new ApiError(400, "Property is no longer available.");
      await k("enquiries").insert({
        ...b,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        status: "New",
        notes: "",
      });
      return NextResponse.json(
        {
          message:
            "Your enquiry has been received. A site visit is only confirmed after our team contacts you.",
        },
        { status: 201 },
      );
    }
    if (route === "events" && method === "POST") {
      await rateLimit(`event:${clientKey(req)}`, 60, 3600);
      const b = z
        .object({
          kind: z.enum(["view", "phone", "whatsapp"]),
          propertyId: z.string().max(80).default(""),
        })
        .parse(await readJson(req));
      await k("events").insert({
        ...b,
        id: randomUUID(),
        day: new Date().toISOString().slice(0, 10),
      });
      return NextResponse.json({ ok: true });
    }
    if (!route.startsWith("admin/")) throw new ApiError(404, "Not found.");
    const u = await requireUser(
      route === "admin/settings" || route === "admin/enquiries/purge",
    );
    if (route === "admin/settings" && method === "PUT") {
      const b = settingsSchema.parse(await readJson(req));
      await k.transaction(async (tx) => {
        await tx("settings")
          .where({ id: 1 })
          .update({ data: JSON.stringify(b) });
        await audit(u.id, "settings.update", "1", tx);
      });
      return NextResponse.json({ ok: true });
    }
    if (route === "admin/upload" && method === "POST") {
      await rateLimit(`upload:${u.id}`, 100, 3600);
      if (Number(req.headers.get("content-length") || 0) > 12 * 1024 * 1024)
        throw new ApiError(413, "Image must be less than 10 MB.");
      const bytes = await boundedBody(req, 12 * 1024 * 1024);
      const form = await new Response(bytes, {
        headers: { "Content-Type": req.headers.get("content-type") || "" },
      }).formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        file.size > 10 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new ApiError(
          400,
          "Choose a JPEG, PNG or WebP image under 10 MB.",
        );
      const sharp = (await import("sharp")).default;
      let image: Buffer;
      try {
        image = await sharp(Buffer.from(await file.arrayBuffer()), {
          limitInputPixels: 40000000,
        })
          .rotate()
          .resize({ width: 2200, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
      } catch (error) {
        console.error(
          "Image processing failed:",
          error instanceof Error ? error.message : "unknown",
        );
        throw new ApiError(400, "This image cannot be processed.");
      }
      const name = `${randomUUID()}.webp`;
      let imageUrl: string;
      if (process.env.S3_BUCKET) {
        const { S3Client, PutObjectCommand } =
          await import("@aws-sdk/client-s3");
        const client = new S3Client({
          region: process.env.S3_REGION,
          endpoint: process.env.S3_ENDPOINT || undefined,
        });
        if (!process.env.S3_PUBLIC_URL)
          throw new ApiError(503, "Image CDN is not configured.");
        await client.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: `properties/${name}`,
            Body: image,
            ContentType: "image/webp",
          }),
        );
        imageUrl = `${process.env.S3_PUBLIC_URL}/properties/${name}`;
      } else {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const dir = process.env.UPLOAD_DIR || "./public/uploads";
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, name), image);
        imageUrl = `/uploads/${name}`;
      }
      await audit(u.id, "image.upload", name);
      return NextResponse.json({ url: imageUrl });
    }
    if (route === "admin/properties" && method === "POST") {
      const p = propertySchema.parse(await readJson(req));
      const id = randomUUID();
      await k.transaction(async (tx) => {
        await tx("properties").insert({
          ...record(p),
          id,
          version: 1,
          archived: false,
          createdAt: new Date().toISOString(),
        });
        await audit(u.id, "property.create", id, tx);
      });
      return NextResponse.json({ id }, { status: 201 });
    }
    if (route === "admin/properties/bulk" && method === "POST") {
      const b = z
        .object({
          ids: z.array(z.string()).min(1).max(100),
          action: z.enum([
            "Available",
            "Reserved",
            "Sold",
            "Hidden",
            "archive",
            "restore",
          ]),
        })
        .parse(await readJson(req));
      await k.transaction(async (tx) => {
        await tx("properties")
          .whereIn("id", b.ids)
          .update({
            ...(["archive", "restore"].includes(b.action)
              ? { archived: b.action === "archive" }
              : { status: b.action }),
            version: tx.raw("version + 1"),
            updatedAt: new Date().toISOString(),
          });
        await audit(
          u.id,
          `property.bulk.${b.action}`,
          b.ids.join(",").slice(0, 250),
          tx,
        );
      });
      return NextResponse.json({ ok: true });
    }
    if (parts[1] === "properties" && parts.length === 3 && method === "PUT") {
      const p = propertySchema.parse(await readJson(req));
      if (!p.version) throw new ApiError(400, "Property version required.");
      await k.transaction(async (tx) => {
        const n = await tx("properties")
          .where({ id: parts[2], version: p.version })
          .update({ ...record(p), version: p.version! + 1 });
        if (!n)
          throw new ApiError(
            409,
            "This listing changed in another session. Reload before saving.",
          );
        await audit(u.id, "property.update", parts[2], tx);
      });
      return NextResponse.json({ ok: true });
    }
    if (route === "admin/enquiries/purge" && method === "POST") {
      const { before } = z
        .object({ before: z.iso.date() })
        .parse(await readJson(req));
      if (
        before > new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      )
        throw new ApiError(400, "Retain at least 30 days.");
      const count = await k.transaction(async (tx) => {
        const n = await tx("enquiries")
          .where("createdAt", "<", before)
          .where("status", "Closed")
          .delete();
        await audit(u.id, "enquiries.purge", `${before}:${n}`, tx);
        return n;
      });
      return NextResponse.json({
        message: `Deleted ${count} closed enquiries.`,
      });
    }
    if (parts[1] === "enquiries" && parts.length === 3 && method === "PUT") {
      const b = z
        .object({
          status: z.enum(["New", "Contacted", "Follow-up", "Closed"]),
          notes: z.string().max(10000),
        })
        .parse(await readJson(req));
      const n = await k("enquiries").where({ id: parts[2] }).update(b);
      if (!n) throw new ApiError(404, "Enquiry not found.");
      await audit(u.id, "enquiry.update", parts[2]);
      return NextResponse.json({ ok: true });
    }
    throw new ApiError(404, "Not found.");
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (e instanceof ApiError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    if (
      (e as { code?: string }).code?.includes("CONSTRAINT") ||
      (e as { code?: string }).code === "23505"
    )
      return NextResponse.json(
        { error: "This listing URL already exists. Choose a different slug." },
        { status: 409 },
      );
    console.error("Request failed:", e instanceof Error ? e.name : "unknown");
    return NextResponse.json(
      { error: "Unable to complete the request. Please try again." },
      { status: 500 },
    );
  }
}
export { handle as GET, handle as POST, handle as PUT };
