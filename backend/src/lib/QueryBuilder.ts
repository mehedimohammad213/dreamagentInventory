import type { PoolClient } from 'pg';
import { query as dbQuery } from '../db/pool.js';

interface WhereClause {
  type: string;
  raw: string;
}

interface QueryBuilderOptions {
  client?: PoolClient | null;
  softDelete?: boolean;
}

export interface PaginationResult<T = Record<string, unknown>> {
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

/**
 * Lightweight SQL query builder for PostgreSQL (pg).
 * Usage: new QueryBuilder('users').where('id', 1).first()
 */
export class QueryBuilder {
  table: string;
  client: PoolClient | null;
  _select: string[];
  _wheres: WhereClause[];
  _params: unknown[];
  _orderBy: string[];
  _groupBy: string[];
  _joins: string[];
  _limit: number | null;
  _offset: number | null;
  _distinct: boolean;

  constructor(table: string, options: QueryBuilderOptions = {}) {
    this.table = table;
    this.client = options.client || null;
    this._select = ['*'];
    this._wheres = [];
    this._params = [];
    this._orderBy = [];
    this._groupBy = [];
    this._joins = [];
    this._limit = null;
    this._offset = null;
    this._distinct = false;
  }

  use(client: PoolClient): this {
    this.client = client;
    return this;
  }

  select(...columns: (string | string[])[]): this {
    this._select = columns.length ? columns.flat() : ['*'];
    return this;
  }

  distinct(): this {
    this._distinct = true;
    return this;
  }

  where(column: string, operatorOrValue: unknown, value?: unknown): this {
    if (value === undefined) {
      return this.#addWhere('AND', column, '=', operatorOrValue);
    }
    return this.#addWhere('AND', column, operatorOrValue as string, value);
  }

  orWhere(column: string, operatorOrValue: unknown, value?: unknown): this {
    if (value === undefined) {
      return this.#addWhere('OR', column, '=', operatorOrValue);
    }
    return this.#addWhere('OR', column, operatorOrValue as string, value);
  }

  whereNull(column: string): this {
    this._wheres.push({ type: 'AND', raw: `${this.#col(column)} IS NULL` });
    return this;
  }

  whereNotNull(column: string): this {
    this._wheres.push({ type: 'AND', raw: `${this.#col(column)} IS NOT NULL` });
    return this;
  }

  whereIn(column: string, values: unknown[]): this {
    if (!values?.length) {
      this._wheres.push({ type: 'AND', raw: '1 = 0' });
      return this;
    }
    const placeholders = values.map((v) => this.#push(v));
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} IN (${placeholders.join(', ')})`,
    });
    return this;
  }

  whereNotIn(column: string, values: unknown[]): this {
    if (!values?.length) return this;
    const placeholders = values.map((v) => this.#push(v));
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} NOT IN (${placeholders.join(', ')})`,
    });
    return this;
  }

  whereBetween(column: string, [min, max]: [unknown, unknown]): this {
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} BETWEEN ${this.#push(min)} AND ${this.#push(max)}`,
    });
    return this;
  }

  whereLike(column: string, pattern: string): this {
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} ILIKE ${this.#push(pattern)}`,
    });
    return this;
  }

  /**
   * Nested where group: where((q) => q.where(...).orWhere(...))
   */
  whereGroup(callback: (qb: QueryBuilder) => void, boolean: 'AND' | 'OR' = 'AND'): this {
    const nested = new QueryBuilder(this.table);
    nested._params = this._params;
    callback(nested);
    if (nested._wheres.length) {
      const sql = nested.#compileWheres(true);
      this._wheres.push({ type: boolean, raw: `(${sql})` });
    }
    return this;
  }

  /**
   * Raw where clause. Use ? placeholders that get replaced with $N params.
   */
  whereRaw(sql: string, params: unknown[] = []): this {
    let compiled = sql;
    for (const p of params) {
      const ph = this.#push(p);
      compiled = compiled.replace('?', ph);
    }
    this._wheres.push({ type: 'AND', raw: compiled });
    return this;
  }

  join(table: string, left: string, operator: string, right: string): this {
    this._joins.push(`INNER JOIN ${table} ON ${left} ${operator} ${right}`);
    return this;
  }

  leftJoin(table: string, left: string, operator: string, right: string): this {
    this._joins.push(`LEFT JOIN ${table} ON ${left} ${operator} ${right}`);
    return this;
  }

  orderBy(column: string, direction: string = 'ASC'): this {
    const dir = String(direction).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    this._orderBy.push(`${this.#col(column)} ${dir}`);
    return this;
  }

  groupBy(...columns: (string | string[])[]): this {
    this._groupBy.push(...columns.flat().map((c) => this.#col(c)));
    return this;
  }

  limit(n: number): this {
    this._limit = Number(n);
    return this;
  }

  offset(n: number): this {
    this._offset = Number(n);
    return this;
  }

  async get(): Promise<Record<string, unknown>[]> {
    const { text, params } = this.#toSelectSql();
    const result = await dbQuery(text, params, this.client);
    return result.rows;
  }

  async first(): Promise<Record<string, unknown> | null> {
    this.limit(1);
    const rows = await this.get();
    return rows[0] || null;
  }

  async find(id: unknown, column = 'id'): Promise<Record<string, unknown> | null> {
    return this.where(column, id).first();
  }

  async count(column = '*'): Promise<number> {
    const prevSelect = this._select;
    const prevOrder = this._orderBy;
    const prevLimit = this._limit;
    const prevOffset = this._offset;
    this._select = [`COUNT(${column === '*' ? '*' : this.#col(column)}) AS aggregate`];
    this._orderBy = [];
    this._limit = null;
    this._offset = null;
    const row = await this.first();
    this._select = prevSelect;
    this._orderBy = prevOrder;
    this._limit = prevLimit;
    this._offset = prevOffset;
    return Number(row?.aggregate || 0);
  }

  async exists(): Promise<boolean> {
    return (await this.count()) > 0;
  }

  async paginate(page = 1, perPage = 15): Promise<PaginationResult> {
    const safePage = Math.max(Number(page) || 1, 1);
    const safePerPage = Math.max(Number(perPage) || 15, 1);
    const total = await this.count();
    const lastPage = Math.max(Math.ceil(total / safePerPage), 1);
    const offset = (safePage - 1) * safePerPage;
    this.limit(safePerPage).offset(offset);
    const data = await this.get();
    const from = total === 0 ? null : offset + 1;
    const to = total === 0 ? null : offset + data.length;
    return {
      data,
      pagination: {
        current_page: safePage,
        last_page: lastPage,
        per_page: safePerPage,
        total,
        from,
        to,
      },
    };
  }

  async insert(data: Record<string, unknown> | Record<string, unknown>[]): Promise<
    Record<string, unknown> | Record<string, unknown>[]
  > {
    const rows = Array.isArray(data) ? data : [data];
    if (!rows.length) return [];

    const columns = Object.keys(rows[0]);
    const valuesSql: string[] = [];
    const params: unknown[] = [];

    rows.forEach((row) => {
      const placeholders = columns.map((col) => {
        params.push(row[col] ?? null);
        return `$${params.length}`;
      });
      valuesSql.push(`(${placeholders.join(', ')})`);
    });

    const text = `INSERT INTO ${this.table} (${columns.map((c) => `"${c}"`).join(', ')})
      VALUES ${valuesSql.join(', ')}
      RETURNING *`;

    const result = await dbQuery(text, params, this.client);
    return Array.isArray(data) ? result.rows : result.rows[0];
  }

  async update(data: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    const entries = Object.entries(data);
    if (!entries.length) return [];

    const sets = entries.map(([col, val]) => {
      const ph = this.#push(val);
      return `"${col}" = ${ph}`;
    });

    const whereSql = this.#compileWheres();
    const text = `UPDATE ${this.table} SET ${sets.join(', ')}${whereSql} RETURNING *`;
    const result = await dbQuery(text, this._params, this.client);
    return result.rows;
  }

  async delete(): Promise<Record<string, unknown>[]> {
    const whereSql = this.#compileWheres();
    const text = `DELETE FROM ${this.table}${whereSql} RETURNING *`;
    const result = await dbQuery(text, this._params, this.client);
    return result.rows;
  }

  async increment(column: string, amount = 1): Promise<Record<string, unknown>[]> {
    const whereSql = this.#compileWheres();
    const text = `UPDATE ${this.table} SET "${column}" = "${column}" + ${this.#push(amount)}${whereSql} RETURNING *`;
    const result = await dbQuery(text, this._params, this.client);
    return result.rows;
  }

  toSql(): { text: string; params: unknown[] } {
    return this.#toSelectSql();
  }

  #addWhere(type: string, column: string, operator: unknown, value: unknown): this {
    const op = String(operator).toUpperCase();
    if (op === 'IN' && Array.isArray(value)) {
      return this.whereIn(column, value);
    }
    if (value === null && (op === '=' || op === 'IS')) {
      return this.whereNull(column);
    }
    this._wheres.push({
      type,
      raw: `${this.#col(column)} ${operator} ${this.#push(value)}`,
    });
    return this;
  }

  #push(value: unknown): string {
    this._params.push(value);
    return `$${this._params.length}`;
  }

  #col(column: string): string {
    if (column.includes('.') || column.includes('(') || column.includes('"')) {
      return column;
    }
    return `"${column}"`;
  }

  #compileWheres(skipWhereKeyword = false): string {
    if (!this._wheres.length) return '';
    const parts = this._wheres.map((w, i) => {
      if (i === 0) return w.raw;
      return `${w.type} ${w.raw}`;
    });
    const body = parts.join(' ');
    return skipWhereKeyword ? body : ` WHERE ${body}`;
  }

  #toSelectSql(): { text: string; params: unknown[] } {
    const distinct = this._distinct ? 'DISTINCT ' : '';
    const joins = this._joins.length ? ` ${this._joins.join(' ')}` : '';
    const whereSql = this.#compileWheres();
    const group = this._groupBy.length ? ` GROUP BY ${this._groupBy.join(', ')}` : '';
    const order = this._orderBy.length ? ` ORDER BY ${this._orderBy.join(', ')}` : '';
    const limit = this._limit != null ? ` LIMIT ${Number(this._limit)}` : '';
    const offset = this._offset != null ? ` OFFSET ${Number(this._offset)}` : '';

    const text = `SELECT ${distinct}${this._select.join(', ')} FROM ${this.table}${joins}${whereSql}${group}${order}${limit}${offset}`;
    return { text, params: [...this._params] };
  }
}

export default QueryBuilder;
