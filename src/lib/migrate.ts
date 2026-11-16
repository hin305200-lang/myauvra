import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MIGRATIONS = path.join(process.cwd(), "migrations");

async function migrationFiles() {
  const files = await readdir(MIGRATIONS).catch(() => [] as string[]);
  return files.filter((file) => file.endsWith(".sql")).sort();
}

export async function applyMigrationsPglite(client: {
  exec: (sql: string) => Promise<unknown>;
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
}) {
  await client.exec(
    `create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`,
  );
  const existing = await client.query<{ name: string }>("select name from schema_migrations");
  const done = new Set(existing.rows.map((row) => row.name));
  for (const file of await migrationFiles()) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(MIGRATIONS, file), "utf8");
    await client.exec("begin");
    try {
      await client.exec(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.exec("commit");
    } catch (error) {
      await client.exec("rollback");
      throw error;
    }
  }
}

export async function applyMigrationsPg(pool: {
  connect: () => Promise<{
    query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ name?: string }> }>;
    release: () => void;
  }>;
}) {
  const client = await pool.connect();
  try {
    await client.query("set lock_timeout = '60s'");
    await client.query("select pg_advisory_lock(7272741)");
    await client.query(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const existing = await client.query("select name from schema_migrations");
    const done = new Set(existing.rows.map((row) => row.name).filter((name): name is string => Boolean(name)));
    for (const file of await migrationFiles()) {
      if (done.has(file)) continue;
      const sql = await readFile(path.join(MIGRATIONS, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.query("select pg_advisory_unlock(7272741)").catch(() => undefined);
    client.release();
  }
}
