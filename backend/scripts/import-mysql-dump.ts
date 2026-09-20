/**
 * Import Laravel/phpMyAdmin MySQL dump into Express PostgreSQL schema.
 *
 * Usage:
 *   tsx scripts/import-mysql-dump.ts [path-to-dump.sql]
 *   npm run db:import-dump
 *
 * Recommended:
 *   npm run db:migrate -- --fresh && npm run db:import-dump
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PoolClient } from 'pg';
import { pool, query, withTransaction } from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_DUMP = path.resolve(
  __dirname,
  '../../Backend/database/drearksd_car.sql'
);

/** Tables imported into Express PG (Laravel cache/queue/session tables skipped). */
const IMPORT_ORDER = [
  'users',
  'categories',
  'cars',
  'car_photos',
  'car_details',
  'car_sub_details',
  'stocks',
  'carts',
  'orders',
  'order_items',
  'purchase_history',
  'car_purchase_history',
  'payment_history',
  'installments',
] as const;

/** Columns present in MySQL dump but absent from Express schema.sql */
const DROP_COLUMNS: Partial<Record<string, Set<string>>> = {
  purchase_history: new Set(['car_id']),
};

/** tinyint(1) → boolean */
const BOOLEAN_COLUMNS: Partial<Record<string, Set<string>>> = {
  car_photos: new Set(['is_primary', 'is_hidden']),
};

interface ParsedArgs {
  dumpPath: string;
  truncate: boolean;
}

interface InsertChunk {
  table: string;
  columns: string[];
  rows: string[][];
}

interface MysqlValueOptions {
  asBoolean?: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  return {
    dumpPath: args[0] ? path.resolve(args[0]) : DEFAULT_DUMP,
    truncate: process.argv.includes('--truncate'),
  };
}

/**
 * Split a MySQL VALUES body into row strings (contents inside each `(...)`).
 */
function splitValueTuples(body: string): string[] {
  const rows: string[] = [];
  let i = 0;
  const n = body.length;

  while (i < n) {
    while (i < n && /[\s,]/.test(body[i]!)) i += 1;
    if (i >= n) break;
    if (body[i] !== '(') {
      throw new Error(`Expected '(' at offset ${i}: ${body.slice(i, i + 40)}`);
    }
    i += 1;

    let depth = 1;
    let inString = false;
    let start = i;

    while (i < n && depth > 0) {
      const ch = body[i]!;
      if (inString) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === "'") {
          if (body[i + 1] === "'") {
            i += 2;
            continue;
          }
          inString = false;
          i += 1;
          continue;
        }
        i += 1;
        continue;
      }
      if (ch === "'") {
        inString = true;
        i += 1;
        continue;
      }
      if (ch === '(') depth += 1;
      else if (ch === ')') {
        depth -= 1;
        if (depth === 0) {
          rows.push(body.slice(start, i));
          i += 1;
          break;
        }
      }
      i += 1;
    }
  }

  return rows;
}

/**
 * Split one tuple body into raw SQL value tokens.
 */
function splitFields(tupleBody: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let inString = false;
  let i = 0;

  while (i < tupleBody.length) {
    const ch = tupleBody[i]!;
    if (inString) {
      cur += ch;
      if (ch === '\\') {
        if (i + 1 < tupleBody.length) {
          cur += tupleBody[i + 1]!;
          i += 2;
          continue;
        }
      } else if (ch === "'") {
        if (tupleBody[i + 1] === "'") {
          cur += "'";
          i += 2;
          continue;
        }
        inString = false;
      }
      i += 1;
      continue;
    }
    if (ch === "'") {
      inString = true;
      cur += ch;
      i += 1;
      continue;
    }
    if (ch === ',') {
      fields.push(cur.trim());
      cur = '';
      i += 1;
      continue;
    }
    cur += ch;
    i += 1;
  }
  if (cur.length || fields.length) fields.push(cur.trim());
  return fields;
}

function decodeMysqlString(raw: string): string {
  // raw includes surrounding quotes
  let s = raw.slice(1, -1);
  s = s.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  s = s.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
  s = s.replace(/\\0/g, '\0').replace(/\\Z/g, '\x1a');
  // MySQL dump also doubles single quotes
  s = s.replace(/''/g, "'");
  return s;
}

function mysqlValueToJs(
  token: string,
  { asBoolean = false }: MysqlValueOptions = {}
): string | number | boolean | null {
  if (token === 'NULL' || token === 'null') return null;
  if (token === 'TRUE' || token === 'true') return true;
  if (token === 'FALSE' || token === 'false') return false;

  if (token.startsWith("'") && token.endsWith("'")) {
    const s = decodeMysqlString(token);
    if (asBoolean) {
      if (s === '0' || s === '') return false;
      if (s === '1') return true;
    }
    return s;
  }

  // numeric / bare
  if (/^-?\d+(\.\d+)?$/.test(token)) {
    const num = token.includes('.') ? Number(token) : Number(token);
    if (asBoolean) return num !== 0;
    return num;
  }

  return token;
}

function extractInserts(sqlText: string): InsertChunk[] {
  const inserts: InsertChunk[] = [];
  const re =
    /INSERT INTO `([^`]+)`\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sqlText)) !== null) {
    const table = match[1]!;
    const columns = match[2]!
      .split(',')
      .map((c) => c.trim().replace(/`/g, ''));
    const tuples = splitValueTuples(match[3]!);
    const rows = tuples.map((t) => splitFields(t));
    inserts.push({ table, columns, rows });
  }
  return inserts;
}

async function truncateAppTables(): Promise<void> {
  const tables = [...IMPORT_ORDER].reverse();
  await query(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
  );
}

async function resetSequences(): Promise<void> {
  for (const table of IMPORT_ORDER) {
    await query(
      `SELECT setval(
         pg_get_serial_sequence($1, 'id'),
         COALESCE((SELECT MAX(id) FROM ${table}), 1),
         (SELECT MAX(id) FROM ${table}) IS NOT NULL
       )`,
      [table]
    );
  }
}

async function insertRows(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: string[][]
): Promise<number> {
  if (!rows.length) return 0;

  const drop = DROP_COLUMNS[table] || new Set<string>();
  const boolCols = BOOLEAN_COLUMNS[table] || new Set<string>();

  const keepIdx: number[] = [];
  const keepCols: string[] = [];
  columns.forEach((col, idx) => {
    if (!drop.has(col)) {
      keepIdx.push(idx);
      keepCols.push(col);
    }
  });

  const colList = keepCols.map((c) => `"${c}"`).join(', ');
  let inserted = 0;

  for (const row of rows) {
    if (row.length !== columns.length) {
      throw new Error(
        `${table}: expected ${columns.length} fields, got ${row.length}`
      );
    }
    const values = keepIdx.map((idx) =>
      mysqlValueToJs(row[idx]!, { asBoolean: boolCols.has(columns[idx]!) })
    );
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`,
      values
    );
    inserted += 1;
  }
  return inserted;
}

/**
 * Express schema has no purchase_history.car_id — backfill pivot from dump.
 */
async function backfillPurchasePivot(
  client: PoolClient,
  inserts: InsertChunk[]
): Promise<number> {
  const phInsert = inserts.find((x) => x.table === 'purchase_history');
  if (!phInsert) return 0;

  const idIdx = phInsert.columns.indexOf('id');
  const carIdx = phInsert.columns.indexOf('car_id');
  if (idIdx < 0 || carIdx < 0) return 0;

  let added = 0;
  for (const row of phInsert.rows) {
    const phId = mysqlValueToJs(row[idIdx]!);
    const carId = mysqlValueToJs(row[carIdx]!);
    if (phId == null || carId == null) continue;

    const exists = await client.query(
      `SELECT 1 FROM car_purchase_history
       WHERE purchase_history_id = $1 AND car_id = $2
       LIMIT 1`,
      [phId, carId]
    );
    if (exists.rowCount) continue;

    await client.query(
      `INSERT INTO car_purchase_history (car_id, purchase_history_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [carId, phId]
    );
    added += 1;
  }
  return added;
}

async function main(): Promise<void> {
  const { dumpPath, truncate } = parseArgs();

  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump not found: ${dumpPath}`);
    process.exit(1);
  }

  console.log(`Reading ${dumpPath}...`);
  const sqlText = fs.readFileSync(dumpPath, 'utf8');
  const inserts = extractInserts(sqlText);

  const byTable = new Map<string, InsertChunk[]>();
  for (const ins of inserts) {
    if (!(IMPORT_ORDER as readonly string[]).includes(ins.table)) continue;
    if (!byTable.has(ins.table)) byTable.set(ins.table, []);
    byTable.get(ins.table)!.push(ins);
  }

  if (truncate) {
    console.log('Truncating application tables...');
    await truncateAppTables();
  }

  const counts: Record<string, number> = {};

  await withTransaction(async (client) => {
    // Disable FK checks via deferred constraints where possible; use truncate order instead.
    for (const table of IMPORT_ORDER) {
      const chunks = byTable.get(table) || [];
      let n = 0;
      for (const chunk of chunks) {
        n += await insertRows(client, table, chunk.columns, chunk.rows);
      }
      counts[table] = n;
      console.log(`  ${table}: ${n} rows`);
    }

    const backfilled = await backfillPurchasePivot(client, inserts);
    if (backfilled) {
      counts.car_purchase_history =
        (counts.car_purchase_history || 0) + backfilled;
      console.log(`  car_purchase_history: +${backfilled} backfilled from car_id`);
    }
  });

  console.log('Resetting sequences...');
  await resetSequences();

  console.log('\nImport complete:');
  for (const [t, n] of Object.entries(counts)) {
    console.log(`  ${t.padEnd(24)} ${n}`);
  }

  await pool.end();
}

main().catch(async (err: unknown) => {
  console.error('Import failed:', err);
  await pool.end();
  process.exit(1);
});
