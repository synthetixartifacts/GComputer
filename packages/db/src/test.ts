import { orm, runMigrations, dbPath } from './db/client.js';
import { test } from './db/schema.js';

async function main(): Promise<void> {
  runMigrations();

  await orm.insert(test).values([
    { column1: 'hello', column2: 'world' },
    { column1: 'foo', column2: 'bar' },
  ]);

  const rows = await orm.select().from(test);
  console.log(`DB file: ${dbPath}`);
  console.table(rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


