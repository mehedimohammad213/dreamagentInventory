import QueryBuilder from './QueryBuilder.js';

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
  static table = null;
  static primaryKey = 'id';
  static fillable = [];
  static guarded = [];
  static hidden = [];
  static casts = {};
  static timestamps = true;

  /**
   * @param {Record<string, any>} attributes
   */
  constructor(attributes = {}) {
    Object.assign(this, attributes);
  }

  static query(client = null) {
    const qb = new QueryBuilder(this.table, { client });
    return qb;
  }

  static newQuery(client = null) {
    return this.query(client);
  }

  static async find(id, client = null) {
    const row = await this.query(client).where(this.primaryKey, id).first();
    return row ? this.hydrate(row) : null;
  }

  static async findOrFail(id, client = null) {
    const model = await this.find(id, client);
    if (!model) {
      const err = new Error(`No query results for model [${this.name}] ${id}`);
      err.status = 404;
      err.code = 'MODEL_NOT_FOUND';
      throw err;
    }
    return model;
  }

  static async first(client = null) {
    const row = await this.query(client).first();
    return row ? this.hydrate(row) : null;
  }

  static async all(client = null) {
    const rows = await this.query(client).get();
    return rows.map((r) => this.hydrate(r));
  }

  static async create(data, client = null) {
    const payload = this.filterFillable(data);
    if (this.timestamps) {
      const now = new Date();
      payload.created_at = payload.created_at || now;
      payload.updated_at = payload.updated_at || now;
    }
    const row = await this.query(client).insert(payload);
    return this.hydrate(row);
  }

  static async insertMany(rows, client = null) {
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

  static where(...args) {
    return this.query().where(...args);
  }

  static whereIn(column, values) {
    return this.query().whereIn(column, values);
  }

  static hydrate(row) {
    if (!row) return null;
    const instance = new this(this.castAttributes(row));
    return instance;
  }

  static hydrateMany(rows) {
    return (rows || []).map((r) => this.hydrate(r));
  }

  static filterFillable(data) {
    const out = {};
    const keys = Object.keys(data || {});
    for (const key of keys) {
      if (this.fillable.length && !this.fillable.includes(key)) continue;
      if (this.guarded.includes(key)) continue;
      out[key] = data[key];
    }
    return out;
  }

  static castAttributes(row) {
    const out = { ...row };
    for (const [key, type] of Object.entries(this.casts)) {
      if (!(key in out) || out[key] === null || out[key] === undefined) continue;
      if (type === 'number') out[key] = Number(out[key]);
      else if (type === 'integer') out[key] = Number.parseInt(out[key], 10);
      else if (type === 'boolean') out[key] = out[key] === true || out[key] === 't' || out[key] === 1 || out[key] === '1';
      else if (type === 'json' || type === 'array') {
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
    // pg returns BIGINT as string — coerce common id fields when present
    for (const key of Object.keys(out)) {
      if ((key === 'id' || key.endsWith('_id')) && typeof out[key] === 'string' && /^-?\d+$/.test(out[key])) {
        out[key] = Number.parseInt(out[key], 10);
      }
    }
    return out;
  }

  async save(client = null) {
    const Ctor = this.constructor;
    const pk = Ctor.primaryKey;
    const data = Ctor.filterFillable(this);
    if (Ctor.timestamps) data.updated_at = new Date();

    if (this[pk]) {
      const rows = await Ctor.query(client).where(pk, this[pk]).update(data);
      Object.assign(this, Ctor.castAttributes(rows[0] || {}));
      return this;
    }

    if (Ctor.timestamps) data.created_at = data.created_at || new Date();
    const row = await Ctor.query(client).insert(data);
    Object.assign(this, Ctor.castAttributes(row));
    return this;
  }

  async update(data, client = null) {
    Object.assign(this, data);
    return this.save(client);
  }

  async delete(client = null) {
    const Ctor = this.constructor;
    const pk = Ctor.primaryKey;
    await Ctor.query(client).where(pk, this[pk]).delete();
    return true;
  }

  toJSON() {
    const Ctor = this.constructor;
    const out = { ...this };
    for (const key of Ctor.hidden) {
      delete out[key];
    }
    return out;
  }
}

export default Model;
