import path from 'node:path';
import { ipcMain } from 'electron';
import { and, like, eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/sql-js/migrator';
// Import ORM and schema from workspace package (bundled by esbuild)
import { initDatabase, saveDatabase } from '../../packages/db/src/db/client.js';
import { test } from '../../packages/db/src/db/schema.js';

let orm: any;

export interface TestFilters {
  column1?: string;
  column2?: string;
}

export interface TestInsert {
  column1: string | null;
  column2: string | null;
}

export interface TestUpdate {
  id: number;
  column1?: string | null;
  column2?: string | null;
}

export async function runDbMigrations(): Promise<void> {
  const dbInstance = await initDatabase();
  orm = dbInstance.orm;
  
  // Resolve to monorepo migrations folder during development
  const migrationsFolder = path.resolve(process.cwd(), 'packages/db/drizzle');
  migrate(orm, { migrationsFolder });
  saveDatabase();
}

export function registerDbIpc(): void {
  ipcMain.handle('db:test:list', async (_evt, filters?: TestFilters) => {
    if (!orm) {
      const dbInstance = await initDatabase();
      orm = dbInstance.orm;
    }
    
    const f = filters ?? {};
    const whereClauses = [] as any[];
    if (f.column1 && f.column1.trim() !== '') {
      whereClauses.push(like(test.column1, `%${f.column1}%`));
    }
    if (f.column2 && f.column2.trim() !== '') {
      whereClauses.push(like(test.column2, `%${f.column2}%`));
    }

    const rows = await orm
      .select()
      .from(test)
      .where(whereClauses.length ? and(...whereClauses) : undefined);
    return rows;
  });

  ipcMain.handle('db:test:insert', async (_evt, payload: TestInsert) => {
    if (!orm) {
      const dbInstance = await initDatabase();
      orm = dbInstance.orm;
    }
    const values = {
      column1: payload.column1 ?? null,
      column2: payload.column2 ?? null,
    } as const;
    const res = await orm.insert(test).values(values).returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:test:update', async (_evt, payload: TestUpdate) => {
    if (!orm) {
      const dbInstance = await initDatabase();
      orm = dbInstance.orm;
    }
    const { id, column1, column2 } = payload;
    const res = await orm
      .update(test)
      .set({
        ...(column1 !== undefined ? { column1 } : {}),
        ...(column2 !== undefined ? { column2 } : {}),
      })
      .where(eq(test.id, id))
      .returning();
    saveDatabase();
    return res[0] ?? null;
  });

  ipcMain.handle('db:test:delete', async (_evt, id: number) => {
    if (!orm) {
      const dbInstance = await initDatabase();
      orm = dbInstance.orm;
    }
    await orm.delete(test).where(eq(test.id, id));
    saveDatabase();
    return { ok: true } as const;
  });

  ipcMain.handle('db:test:truncate', async () => {
    if (!orm) {
      const dbInstance = await initDatabase();
      orm = dbInstance.orm;
    }
    await orm.delete(test);
    saveDatabase();
    return { ok: true } as const;
  });
}


