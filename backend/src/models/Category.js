import Model from '../lib/Model.js';
import config from '../config/index.js';

export class Category extends Model {
  static table = 'categories';
  static fillable = ['name', 'image', 'parent_category_id', 'status', 'short_des'];
  static casts = {
    id: 'integer',
    parent_category_id: 'integer',
  };

  get image_url() {
    if (!this.image) return null;
    if (String(this.image).startsWith('http')) return this.image;
    const clean = String(this.image).replace(/^\/+/, '').replace(/^storage\//, '');
    return `${config.app.url}/${clean}`;
  }

  toJSON() {
    const base = super.toJSON();
    return { ...base, image_url: this.image_url };
  }
}

export default Category;
