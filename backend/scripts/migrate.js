import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '../src/db/schema.sql');

async function migrate() {
  const fresh = process.argv.includes('--fresh');

  if (fresh) {
    console.log('Dropping public schema...');
    await query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Running schema.sql...');
  await query(sql);

  await query(
    `INSERT INTO schema_migrations (name)
     VALUES ($1)
     ON CONFLICT (name) DO NOTHING`,
    ['001_initial_schema']
  );

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await pool.end();
  process.exit(1);
});
