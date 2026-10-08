import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from "drizzle-kit/api";
import * as schema from "@/db/schema";

/**
 * A fresh in-memory database with the app's real schema, built from src/db/schema.ts so it
 * can't drift from what the app uses.
 */
export async function createTestDb() {
  const sqlite = new Database(":memory:");
  const statements = await generateSQLiteMigration(
    await generateSQLiteDrizzleJson({}),
    await generateSQLiteDrizzleJson(schema),
  );
  for (const statement of statements) sqlite.exec(statement);
  return drizzle(sqlite, { schema });
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/** Empties every table, so each test starts clean. */
export function resetTestDb(db: TestDb) {
  const tables = db.$client
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  for (const { name } of tables) db.$client.exec(`DELETE FROM "${name}"`);
}
