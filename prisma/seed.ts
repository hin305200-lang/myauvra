import { bootstrap } from "../src/lib/bootstrap";
import { getPrisma } from "../src/lib/db";

async function main() {
  const prisma = await getPrisma();
  await bootstrap(prisma);
  console.log("Auvra catalog and settings are ready.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});
