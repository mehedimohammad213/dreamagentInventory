import type { PoolClient } from 'pg';
import QueryBuilder from './QueryBuilder.js';

export type CastType = 'number' | 'integer' | 'boolean' | 'json' | 'array' | 'datetime' | 'date';

/**
 * Base Model — thin ActiveRecord-style layer over QueryBuilder + pg.
 *
 * Subclasses define:
 *   static table = 'users'
 *   static fillable = ['name', ...]
 *   static hidden = ['password']
 *   static casts = { price: 'number' }
 */
export class Model {
  static table: string | null = null;
  static primaryKey = 'id';
  static fillable: string[] = [];
  static guarded: string[] = [];
  static hidden: string[] = [];
  static casts: Record<string, CastType | string> = {};
  static timestamps = true;

  // Dynamic DB attributes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  constructor(attributes: Record<string, any> = {}) {
    Object.assign(this, attributes);
  }

  static query(client: PoolClient | null = null): QueryBuilder {
    const Ctor = this as typeof Model;
    if (!Ctor.table) throw new Error(`Model ${Ctor.name} has no table defined`);
    return new QueryBuilder(Ctor.table, { client });
  }

  static newQuery(client: PoolClient | null = null): QueryBuilder {
    return this.query(client);
  }

  static async find(id: any, client: PoolClient | null = null): Promise<any> {
    const row = await this.query(client).where(this.primaryKey, id).first();
    return row ? this.hydrate(row) : null;
  }

  static async findOrFail(id: any, client: PoolClient | null = null): Promise<any> {
    const model = await this.find(id, client);
    if (!model) {
      const err: any = new Error(`No query results for model [${this.name}] ${id}`);
      err.status = 404;
      err.code = 'MODEL_NOT_FOUND';
      throw err;
    }
    return model;
  }

  static async first(client: PoolClient | null = null): Promise<any> {
    const row = await this.query(client).first();
    return row ? this.hydrate(row) : null;
  }

  static async all(client: PoolClient | null = null): Promise<any[]> {
    const rows = await this.query(client).get();
    return rows.map((r) => this.hydrate(r));
  }

  static async create(data: Record<string, any>, client: PoolClient | null = null): Promise<any> {
    const payload = this.filterFillable(data);
    if (this.timestamps) {
      const now = new Date();
      payload.created_at = payload.created_at || now;
      payload.updated_at = payload.updated_at || now;
    }
    const row = await this.query(client).insert(payload);
    return this.hydrate(row as Record<string, any>);
  }

  static async insertMany(
    rows: Record<string, any>[],
    client: PoolClient | null = null
  ): Promise<any[]> {
    if (!rows.length) return [];
    const payload = rows.map((data) => {
      const row = this.filterFillable(data);
      if (this.timestamps) {
        const now = new Date();
        row.created_at = row.created_at || now;
        row.updated_at = row.updated_at || now;
      }
      return row;
    });
    const inserted = await this.query(client).insert(payload);
    return (Array.isArray(inserted) ? inserted : [inserted]).map((r) => this.hydrate(r));
  }

  static where(...args: [string, any, any?]): QueryBuilder {
    return this.query().where(...args);
  }

  static whereIn(column: string, values: any[]): QueryBuilder {
    return this.query().whereIn(column, values);
  }

  static hydrate(row: Record<string, any> | null): any {
    if (!row) return null;
    return new this(this.castAttributes(row));
  }

  static hydrateMany(rows: Record<string, any>[] | null | undefined): any[] {
    return (rows || []).map((r) => this.hydrate(r));
  }

  static filterFillable(data: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    const keys = Object.keys(data || {});
    for (const key of keys) {
      if (this.fillable.length && !this.fillable.includes(key)) continue;
      if (this.guarded.includes(key)) continue;
      out[key] = data[key];
    }
    return out;
  }

  static castAttributes(row: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = { ...row };
    for (const [key, type] of Object.entries(this.casts)) {
      if (!(key in out) || out[key] === null || out[key] === undefined) continue;
      if (type === 'number') out[key] = Number(out[key]);
      else if (type === 'integer') out[key] = Number.parseInt(String(out[key]), 10);
      else if (type === 'boolean') {
        out[key] = out[key] === true || out[key] === 't' || out[key] === 1 || out[key] === '1';
      } else if (type === 'json' || type === 'array') {
        if (typeof out[key] === 'string') {
          try {
            out[key] = JSON.parse(out[key]);
          } catch {
            /* keep string */
          }
        }
      } else if (type === 'datetime' || type === 'date') {
        out[key] = out[key] instanceof Date ? out[key] : new Date(out[key]);
      }
    }
    for (const key of Object.keys(out)) {
      if (
        (key === 'id' || key.endsWith('_id')) &&
        typeof out[key] === 'string' &&
        /^-?\d+$/.test(out[key])
      ) {
        out[key] = Number.parseInt(out[key], 10);
      }
    }
    return out;
  }

  async save(client: PoolClient | null = null): Promise<this> {
    const Ctor = this.constructor as typeof Model;
    const pk = Ctor.primaryKey;
    const data = Ctor.filterFillable(this as unknown as Record<string, any>);
    if (Ctor.timestamps) data.updated_at = new Date();

    if (this[pk]) {
      const rows = await Ctor.query(client).where(pk, this[pk]).update(data);
      Object.assign(this, Ctor.castAttributes(rows[0] || {}));
      return this;
    }

    if (Ctor.timestamps) data.created_at = data.created_at || new Date();
    const row = await Ctor.query(client).insert(data);
    Object.assign(this, Ctor.castAttributes(row as Record<string, any>));
    return this;
  }

  async update(data: Record<string, any>, client: PoolClient | null = null): Promise<this> {
    Object.assign(this, data);
    return this.save(client);
  }

  async delete(client: PoolClient | null = null): Promise<boolean> {
    const Ctor = this.constructor as typeof Model;
    const pk = Ctor.primaryKey;
    await Ctor.query(client).where(pk, this[pk]).delete();
    return true;
  }

  toJSON(): Record<string, any> {
    const Ctor = this.constructor as typeof Model;
    const out: Record<string, any> = { ...this };
    for (const key of Ctor.hidden) {
      delete out[key];
    }
    return out;
  }
}

export default Model;
