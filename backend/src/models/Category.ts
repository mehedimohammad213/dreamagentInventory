import Model from '../lib/Model.js';
import config from '../config/index.js';

export class Category extends Model {
  static table = 'categories';
  static fillable = ['name', 'image', 'parent_category_id', 'status', 'short_des'];
  static casts = {
    id: 'integer',
    parent_category_id: 'integer',
  };

  declare id: number;
  declare name: string;
  declare image?: string | null;
  declare parent_category_id?: number | null;
  declare status?: string;
  declare short_des?: string | null;

  get image_url(): string | null {
    if (!this.image) return null;
    if (String(this.image).startsWith('http')) return this.image;
    const clean = String(this.image).replace(/^\/+/, '').replace(/^storage\//, '');
    return `${config.app.url}/${clean}`;
  }

  toJSON(): Record<string, unknown> {
    const base = super.toJSON();
    return { ...base, image_url: this.image_url };
  }
}

export default Category;
