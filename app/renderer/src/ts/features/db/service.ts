import type { TestRow, TestFilters, TestInsert, TestUpdate } from './types';

type DbApi = {
  list: (filters?: TestFilters) => Promise<TestRow[]>;
  insert: (payload: TestInsert) => Promise<TestRow | null>;
  update: (payload: TestUpdate) => Promise<TestRow | null>;
  delete: (id: number) => Promise<{ ok: true }>;
  truncate: () => Promise<{ ok: true }>;
};

function createFallbackDbApi(): DbApi {
  console.warn('[db] Preload API not available. Using no-op fallback. Restart dev to load main/preload changes.');
  return {
    async list() { return []; },
    async insert() { return null; },
    async update() { return null; },
    async delete() { return { ok: true } as const; },
    async truncate() { return { ok: true } as const; },
  };
}

function api(): DbApi {
  const win = window as any;
  const impl: DbApi | undefined = win?.gc?.db?.test;
  return impl ?? createFallbackDbApi();
}

export async function listTestRows(filters?: TestFilters): Promise<TestRow[]> {
  return await api().list(filters);
}

export async function insertTestRow(values: TestInsert): Promise<TestRow | null> {
  return await api().insert(values);
}

export async function updateTestRow(update: TestUpdate): Promise<TestRow | null> {
  return await api().update(update);
}

export async function deleteTestRow(id: number): Promise<{ ok: true }> {
  return await api().delete(id);
}

export async function truncateTestTable(): Promise<{ ok: true }> {
  return await api().truncate();
}

