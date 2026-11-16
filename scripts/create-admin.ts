import { ensureAdmin } from "../src/lib/accounts";
import { getPrisma } from "../src/lib/db";

async function main() {
  const prisma = await getPrisma();
  const result = await ensureAdmin(prisma);
  if (!process.env.ADMIN_EMAIL || (process.env.ADMIN_PASSWORD ?? "").length < 8) {
    console.log("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters), then run this again.");
    return;
  }
  console.log(result.created ? "Admin account created." : "Admin account is already in place.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin setup failed.");
  process.exit(1);
});
