import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const test = sqliteTable('test', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  column1: text('column1'),
  column2: text('column2'),
});
