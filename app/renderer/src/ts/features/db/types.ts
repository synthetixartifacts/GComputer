export interface TestRow {
  id: number;
  column1: string | null;
  column2: string | null;
}

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

