import { db } from "../src/lib/db";
async function main() {
  const k = await db();
  console.log("Database schema is up to date.");
  await k.destroy();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
