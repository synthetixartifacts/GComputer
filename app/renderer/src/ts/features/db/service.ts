import type { TestRow, TestFilters, TestInsert, TestUpdate } from './types';
import { isElectronEnvironment } from '../environment/service';

// Import services directly to avoid dynamic import issues
import * as electronService from './electron-service';
import * as browserService from './browser-service';

// Unified service functions that work in both environments
export async function listTestRows(filters?: TestFilters): Promise<TestRow[]> {
  if (isElectronEnvironment()) {
    return electronService.listTestRows(filters);
  } else {
    return browserService.listTestRows(filters);
  }
}

export async function insertTestRow(values: TestInsert): Promise<TestRow | null> {
  if (isElectronEnvironment()) {
    return electronService.insertTestRow(values);
  } else {
    return browserService.insertTestRow(values);
  }
}

export async function updateTestRow(update: TestUpdate): Promise<TestRow | null> {
  if (isElectronEnvironment()) {
    return electronService.updateTestRow(update);
  } else {
    return browserService.updateTestRow(update);
  }
}

export async function deleteTestRow(id: number): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.deleteTestRow(id);
  } else {
    return browserService.deleteTestRow(id);
  }
}

export async function truncateTestTable(): Promise<{ ok: true }> {
  if (isElectronEnvironment()) {
    return electronService.truncateTestTable();
  } else {
    return browserService.truncateTestTable();
  }
}

