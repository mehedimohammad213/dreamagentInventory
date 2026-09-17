import { query as dbQuery } from '../db/pool.js';

/**
 * Lightweight SQL query builder for PostgreSQL (pg).
 * Usage: new QueryBuilder('users').where('id', 1).first()
 */
export class QueryBuilder {
  /**
   * @param {string} table
   * @param {{ client?: import('pg').PoolClient, softDelete?: boolean }} [options]
   */
  constructor(table, options = {}) {
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

  /**
   * @param {import('pg').PoolClient} client
   */
  use(client) {
    this.client = client;
    return this;
  }

  select(...columns) {
    this._select = columns.length ? columns.flat() : ['*'];
    return this;
  }

  distinct() {
    this._distinct = true;
    return this;
  }

  /**
   * @param {string} column
   * @param {any} operatorOrValue
   * @param {any} [value]
   */
  where(column, operatorOrValue, value) {
    if (value === undefined) {
      return this.#addWhere('AND', column, '=', operatorOrValue);
    }
    return this.#addWhere('AND', column, operatorOrValue, value);
  }

  orWhere(column, operatorOrValue, value) {
    if (value === undefined) {
      return this.#addWhere('OR', column, '=', operatorOrValue);
    }
    return this.#addWhere('OR', column, operatorOrValue, value);
  }

  whereNull(column) {
    this._wheres.push({ type: 'AND', raw: `${this.#col(column)} IS NULL` });
    return this;
  }

  whereNotNull(column) {
    this._wheres.push({ type: 'AND', raw: `${this.#col(column)} IS NOT NULL` });
    return this;
  }

  whereIn(column, values) {
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

  whereNotIn(column, values) {
    if (!values?.length) return this;
    const placeholders = values.map((v) => this.#push(v));
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} NOT IN (${placeholders.join(', ')})`,
    });
    return this;
  }

  whereBetween(column, [min, max]) {
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} BETWEEN ${this.#push(min)} AND ${this.#push(max)}`,
    });
    return this;
  }

  whereLike(column, pattern) {
    this._wheres.push({
      type: 'AND',
      raw: `${this.#col(column)} ILIKE ${this.#push(pattern)}`,
    });
    return this;
  }

  /**
   * Nested where group: where((q) => q.where(...).orWhere(...))
   * @param {(qb: QueryBuilder) => void} callback
   * @param {'AND'|'OR'} [boolean]
   */
  whereGroup(callback, boolean = 'AND') {
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
   * Raw where clause. Use $next placeholders relative to current param count,
   * or pass params that get appended.
   * @param {string} sql
   * @param {any[]} [params]
   */
  whereRaw(sql, params = []) {
    let compiled = sql;
    for (const p of params) {
      const ph = this.#push(p);
      compiled = compiled.replace('?', ph);
    }
    this._wheres.push({ type: 'AND', raw: compiled });
    return this;
  }

  join(table, left, operator, right) {
    this._joins.push(`INNER JOIN ${table} ON ${left} ${operator} ${right}`);
    return this;
  }

  leftJoin(table, left, operator, right) {
    this._joins.push(`LEFT JOIN ${table} ON ${left} ${operator} ${right}`);
    return this;
  }

  orderBy(column, direction = 'ASC') {
    const dir = String(direction).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    this._orderBy.push(`${this.#col(column)} ${dir}`);
    return this;
  }

  groupBy(...columns) {
    this._groupBy.push(...columns.flat().map((c) => this.#col(c)));
    return this;
  }

  limit(n) {
    this._limit = Number(n);
    return this;
  }

  offset(n) {
    this._offset = Number(n);
    return this;
  }

  async get() {
    const { text, params } = this.#toSelectSql();
    const result = await dbQuery(text, params, this.client);
    return result.rows;
  }

  async first() {
    this.limit(1);
    const rows = await this.get();
    return rows[0] || null;
  }

  async find(id, column = 'id') {
    return this.where(column, id).first();
  }

  async count(column = '*') {
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

  async exists() {
    return (await this.count()) > 0;
  }

  async paginate(page = 1, perPage = 15) {
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

  async insert(data) {
    const rows = Array.isArray(data) ? data : [data];
    if (!rows.length) return [];

    const columns = Object.keys(rows[0]);
    const valuesSql = [];
    const params = [];

    rows.forEach((row, rowIndex) => {
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

  async update(data) {
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

  async delete() {
    const whereSql = this.#compileWheres();
    const text = `DELETE FROM ${this.table}${whereSql} RETURNING *`;
    const result = await dbQuery(text, this._params, this.client);
    return result.rows;
  }

  async increment(column, amount = 1) {
    const whereSql = this.#compileWheres();
    const text = `UPDATE ${this.table} SET "${column}" = "${column}" + ${this.#push(amount)}${whereSql} RETURNING *`;
    const result = await dbQuery(text, this._params, this.client);
    return result.rows;
  }

  toSql() {
    return this.#toSelectSql();
  }

  #addWhere(type, column, operator, value) {
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

  #push(value) {
    this._params.push(value);
    return `$${this._params.length}`;
  }

  #col(column) {
    if (column.includes('.') || column.includes('(') || column.includes('"')) {
      return column;
    }
    return `"${column}"`;
  }

  #compileWheres(skipWhereKeyword = false) {
    if (!this._wheres.length) return '';
    const parts = this._wheres.map((w, i) => {
      if (i === 0) return w.raw;
      return `${w.type} ${w.raw}`;
    });
    const body = parts.join(' ');
    return skipWhereKeyword ? body : ` WHERE ${body}`;
  }

  #toSelectSql() {
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
