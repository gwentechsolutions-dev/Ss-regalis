import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { randomUUID } from "node:crypto";
async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in your shell.",
    );
  const k = await db();
  const existing = await k("users").where({ email }).first();
  if (existing) {
    await k("users")
      .where({ email })
      .update({
        hash: hashPassword(password),
        sessionVersion: existing.sessionVersion + 1,
      });
  } else
    await k("users").insert({
      id: randomUUID(),
      email,
      hash: hashPassword(password),
      role: "owner",
      sessionVersion: 1,
    });
  console.log("Admin account provisioned. Existing sessions invalidated.");
  await k.destroy();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
