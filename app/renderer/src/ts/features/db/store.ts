import { writable } from 'svelte/store';
import type { TestRow, TestFilters } from './types';
import { listTestRows, insertTestRow, updateTestRow, deleteTestRow, truncateTestTable } from './service';

export const testRows = writable<TestRow[]>([]);
export const testFilters = writable<TestFilters>({});
export const editingRowIds = writable<Set<number>>(new Set());
export const pendingEdits = writable<Record<number, Partial<TestRow>>>({});

export async function refreshTestRows(): Promise<void> {
  let filters: TestFilters = {};
  testFilters.update((f) => (filters = f));
  const rows = await listTestRows(filters);
  testRows.set(rows);
}

export function setFilter(column: keyof TestFilters, value: string): void {
  testFilters.update((prev) => ({ ...prev, [column]: value }));
}

export function toggleEdit(id: number): void {
  editingRowIds.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export function stageEdit(id: number, column: 'column1' | 'column2', value: string): void {
  pendingEdits.update((map) => ({
    ...map,
    [id]: { ...map[id], [column]: value },
  }));
}

export async function saveAllEdits(): Promise<void> {
  let edits: Record<number, Partial<TestRow>> = {};
  pendingEdits.update((m) => (edits = m));
  const ids = Object.keys(edits).map((k) => Number(k));
  for (const id of ids) {
    const payload: any = { id };
    if ('column1' in (edits[id] ?? {})) payload.column1 = (edits[id] as any).column1 ?? null;
    if ('column2' in (edits[id] ?? {})) payload.column2 = (edits[id] as any).column2 ?? null;
    await updateTestRow(payload);
  }
  // clear staged edits and editing state, then refresh
  pendingEdits.set({});
  editingRowIds.set(new Set());
  await refreshTestRows();
}

export async function addRow(values: { column1: string; column2: string }): Promise<void> {
  await insertTestRow({ column1: values.column1 || null, column2: values.column2 || null });
  await refreshTestRows();
}

export async function removeRow(id: number): Promise<void> {
  await deleteTestRow(id);
  await refreshTestRows();
}

export async function truncateTable(): Promise<void> {
  await truncateTestTable();
  await refreshTestRows();
}

