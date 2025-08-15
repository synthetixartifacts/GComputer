import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import * as schema from './schema.js';

const dataDir = path.resolve('./data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'gcomputer.db');

let sqlJs: any;
let database: any;
let isInitialized = false;

// Initialize database singleton
export async function initDatabase() {
  if (isInitialized) return;
  
  sqlJs = await initSqlJs();
  let dbData: Uint8Array | undefined;

  // Load existing database if it exists
  if (fs.existsSync(dbPath)) {
    dbData = fs.readFileSync(dbPath);
  }

  database = new sqlJs.Database(dbData);
  isInitialized = true;
}

// Get ORM instance (ensures initialization)
export async function getOrm() {
  await initDatabase();
  return drizzle(database, { schema });
}

// Save database function
export function saveDatabase() {
  if (!isInitialized) throw new Error('Database not initialized');
  const data = database.export();
  fs.writeFileSync(dbPath, data);
}

// Run migrations
export async function runMigrations() {
  const orm = await getOrm();
  migrate(orm, { migrationsFolder: path.resolve('./drizzle') });
  saveDatabase();
}
