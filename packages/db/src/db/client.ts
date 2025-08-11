import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

const dataDir = path.resolve('./data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'gcomputer.db');

const sqlite = new Database(dbPath);
export const orm = drizzle(sqlite, { schema });

export function runMigrations() {
  migrate(orm, { migrationsFolder: path.resolve('./drizzle') });
}
