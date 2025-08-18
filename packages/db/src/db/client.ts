import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import * as schema from './schema.js';

const dataDir = path.resolve('./packages/db/data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'gcomputer.db');

let sqlJs: any;
let database: any;
let isInitialized = false;

// Initialize database singleton
export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  
  // Configure sql.js with proper WASM path for Electron
  const wasmPath = path.resolve('./dist/main/sql-wasm.wasm');
  sqlJs = await initSqlJs({
    locateFile: (file: string) => {
      if (file === 'sql-wasm.wasm') {
        return wasmPath;
      }
      return file;
    }
  });
  let dbData: Uint8Array | undefined;

  // Load existing database if it exists
  if (fs.existsSync(dbPath)) {
    dbData = fs.readFileSync(dbPath);
  }

  database = new sqlJs.Database(dbData);
  isInitialized = true;
}

// Get ORM instance (ensures initialization)
export async function getOrm(): Promise<any> {
  await initDatabase();
  return drizzle(database, { schema });
}

// Save database function
export function saveDatabase(): void {
  if (!isInitialized) throw new Error('Database not initialized');
  const data = database.export();
  fs.writeFileSync(dbPath, data);
}

// Run migrations
export async function runMigrations(): Promise<void> {
  const orm = await getOrm();
  const migrationsFolder = path.resolve('./packages/db/drizzle');
  migrate(orm, { migrationsFolder });
  saveDatabase();
}
