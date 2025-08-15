import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import * as schema from './schema.js';

const dataDir = path.resolve('./data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'gcomputer.db');

let SQL: any;
let sqlite: any;
let orm: any;

// Initialize database
export async function initDatabase() {
  if (SQL) return { orm, saveDatabase };
  
  SQL = await initSqlJs();
  let dbData: Uint8Array | undefined;

  // Load existing database if it exists
  if (fs.existsSync(dbPath)) {
    dbData = fs.readFileSync(dbPath);
  }

  sqlite = new SQL.Database(dbData);
  orm = drizzle(sqlite, { schema });
  
  return { orm, saveDatabase };
}

// Save database function
export function saveDatabase() {
  if (!sqlite) throw new Error('Database not initialized');
  const data = sqlite.export();
  fs.writeFileSync(dbPath, data);
}

// Export orm for backward compatibility (will be undefined until initialized)
export { orm };

export function runMigrations() {
  migrate(orm, { migrationsFolder: path.resolve('./drizzle') });
}
