import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { applyMigrationsPg, applyMigrationsPglite } from "./migrate";

const globalForDb = globalThis as unknown as { auvra?: Promise<PrismaClient> };

export function externalDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) return "";
  if (url.includes("127.0.0.1:5432/auvra") && process.env.AUVRA_DB !== "postgres") return "";
  return url;
}

async function createClient() {
  const url = externalDatabaseUrl();
  if (url) {
    const pool = new Pool({ connectionString: url, max: 5 });
    await applyMigrationsPg(pool);
    const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    const { bootstrap } = await import("./bootstrap");
    await bootstrap(prisma);
    return prisma;
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://127.0.0.1:5432/auvra";
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await client.waitReady;
  await applyMigrationsPglite(client);
  const prisma = new PrismaClient({ adapter: new PrismaPGlite(client) as never });
  const { bootstrap } = await import("./bootstrap");
  await bootstrap(prisma);
  return prisma;
}

export function getPrisma() {
  if (!globalForDb.auvra) {
    globalForDb.auvra = createClient().catch((error: unknown) => {
      globalForDb.auvra = undefined;
      throw error;
    });
  }
  return globalForDb.auvra;
}

export async function createTestPrisma() {
  process.env.DATABASE_URL ||= "postgresql://127.0.0.1:5432/auvra";
  const { PGlite } = await import("@electric-sql/pglite");
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  const client = new PGlite();
  await client.waitReady;
  await applyMigrationsPglite(client);
  return new PrismaClient({ adapter: new PrismaPGlite(client) as never });
}
