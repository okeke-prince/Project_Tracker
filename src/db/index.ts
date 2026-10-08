import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'node:path';

// Store DB outside of src so it doesn't trigger Next.js rebuilds on every write
const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
export const db = drizzle(sqlite, { schema });
