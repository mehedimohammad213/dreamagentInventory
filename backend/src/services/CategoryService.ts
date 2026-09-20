// @ts-nocheck
import fs from 'fs';
import path from 'path';
import Category from '../models/Category.js';
import { query } from '../db/pool.js';
import config from '../config/index.js';
import { validate } from '../utils/validate.js';
import { ValidationError, NotFoundError, AppError } from '../lib/errors.js';

async function childrenCount(categoryId) {
  return Category.query().where('parent_category_id', categoryId).count();
}

async function carsCount(categoryId) {
  const result = await query(
    `SELECT COUNT(*)::int AS c FROM cars WHERE category_id = $1 OR subcategory_id = $1`,
    [categoryId]
  );
  return result.rows[0]?.c || 0;
}

async function transformCategory(category, { withChildren = false } = {}) {
  const parent = category.parent_category_id
    ? await Category.find(category.parent_category_id)
    : null;

  const kidsCount = await childrenCount(category.id);
  const carCount = await carsCount(category.id);

  const payload = {
    id: category.id,
    name: category.name,
    image: category.image_url,
    parent_category_id: category.parent_category_id,
    parent_category: parent ? { id: parent.id, name: parent.name } : null,
    status: category.status,
    short_des: category.short_des,
    full_name: parent ? `${parent.name} > ${category.name}` : category.name,
    children_count: kidsCount,
    cars_count: carCount,
    created_at: category.created_at ? new Date(category.created_at).toISOString() : null,
    updated_at: category.updated_at ? new Date(category.updated_at).toISOString() : null,
  };

  if (withChildren) {
    const childRows = await Category.query().where('parent_category_id', category.id).get();
    payload.children = [];
    for (const row of childRows) {
      const child = Category.hydrate(row);
      payload.children.push({
        id: child.id,
        name: child.name,
        status: child.status,
        cars_count: await carsCount(child.id),
      });
    }
  }

  return payload;
}

function categorySuccess(message, data, status = 200) {
  return {
    httpStatus: status,
    responseBody: {
      success: true,
      message,
      status_code: status,
      data,
    },
  };
}

const categoryRules = {
  name: 'required|string|max:255',
  parent_category_id: 'nullable|integer',
  status: 'nullable|in:active,inactive',
  short_des: 'nullable|string|max:500',
};

async function validateCategoryBody(body, { category = null } = {}) {
  const { ok, errors } = validate(body, categoryRules);
  if (!ok) throw new ValidationError(errors);

  if (body.parent_category_id && category && Number(body.parent_category_id) === Number(category.id)) {
    throw new ValidationError({ parent_category_id: ['A category cannot be its own parent.'] });
  }

  if (body.parent_category_id) {
    const parent = await Category.find(body.parent_category_id);
    if (!parent) {
      throw new ValidationError({ parent_category_id: ['The selected parent category id is invalid.'] });
    }
  }

  let nameQuery = Category.query().where('name', body.name);
  if (category) {
    nameQuery = nameQuery.where('id', '!=', category.id);
  }
  const nameTaken = await nameQuery.first();
  if (nameTaken) {
    throw new ValidationError({ name: ['The name has already been taken.'] });
  }
}

async function findCategoryOrFail(id) {
  const category = await Category.find(id);
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

export async function index(queryParams) {
  let qb = Category.query();

  if (queryParams.search) {
    const s = `%${queryParams.search}%`;
    qb = qb.whereGroup((q) => {
      q.whereLike('name', s).orWhere('short_des', 'ILIKE', s);
    });
  }

  if (['active', 'inactive'].includes(queryParams.status)) {
    qb = qb.where('status', queryParams.status);
  }

  if (queryParams.type === 'parent') {
    qb = qb.whereNull('parent_category_id');
  } else if (queryParams.type === 'child') {
    qb = qb.whereNotNull('parent_category_id');
  }

  if (queryParams.parent_id === 'null') {
    qb = qb.whereNull('parent_category_id');
  } else if (queryParams.parent_id) {
    qb = qb.where('parent_category_id', queryParams.parent_id);
  }

  const sortBy = queryParams.sort_by || 'created_at';
  const sortOrder = queryParams.sort_order || 'desc';
  const allowed = ['id', 'name', 'status', 'created_at', 'updated_at'];
  if (allowed.includes(sortBy)) {
    qb = qb.orderBy(sortBy, sortOrder);
  }

  const perPage = Math.min(Math.max(Number(queryParams.per_page || 15), 1), 100);
  const page = Math.max(Number(queryParams.page || 1), 1);
  const result = await qb.paginate(page, perPage);

  const categories = [];
  for (const row of result.data) {
    categories.push(await transformCategory(Category.hydrate(row)));
  }

  return categorySuccess('Categories retrieved successfully', {
    categories,
    pagination: result.pagination,
  });
}

export async function store(body, file) {
  await validateCategoryBody(body);

  const data = {
    name: body.name,
    parent_category_id: body.parent_category_id || null,
    status: body.status || 'active',
    short_des: body.short_des || null,
  };

  if (file) {
    data.image = `categories/${file.filename}`;
  }

  const category = await Category.create(data);
  return categorySuccess(
    'Category created successfully',
    { category: await transformCategory(category) },
    201
  );
}

export async function show(id) {
  const category = await findCategoryOrFail(id);
  return categorySuccess('Category retrieved successfully', {
    category: await transformCategory(category, { withChildren: true }),
  });
}

export async function update(id, body, file) {
  const category = await findCategoryOrFail(id);
  await validateCategoryBody(body, { category });

  const data = {
    name: body.name,
    parent_category_id: body.parent_category_id || null,
    status: body.status || category.status,
    short_des: body.short_des ?? category.short_des,
  };

  if (file) {
    if (category.image) {
      const oldPath = path.join(config.paths.public, category.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.image = `categories/${file.filename}`;
  }

  await category.update(data);
  return categorySuccess('Category updated successfully', {
    category: await transformCategory(category),
  });
}

export async function destroy(id) {
  const category = await findCategoryOrFail(id);

  if ((await childrenCount(category.id)) > 0) {
    throw new AppError('Cannot delete category with subcategories', 400);
  }

  if ((await carsCount(category.id)) > 0) {
    throw new AppError('Cannot delete category with associated cars', 400);
  }

  if (category.image) {
    const oldPath = path.join(config.paths.public, category.image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  await category.delete();
  return categorySuccess('Category deleted successfully', []);
}

export async function getParentCategories() {
  const rows = await Category.query()
    .select('id', 'name')
    .whereNull('parent_category_id')
    .where('status', 'active')
    .orderBy('name', 'ASC')
    .get();

  return categorySuccess('Parent categories retrieved successfully', { parent_categories: rows });
}

export async function getStats() {
  const stats = {
    total_categories: await Category.query().count(),
    active_categories: await Category.query().where('status', 'active').count(),
    inactive_categories: await Category.query().where('status', 'inactive').count(),
    parent_categories: await Category.query().whereNull('parent_category_id').count(),
    child_categories: await Category.query().whereNotNull('parent_category_id').count(),
  };

  return categorySuccess('Category statistics retrieved successfully', { statistics: stats });
}

export default {
  index,
  store,
  show,
  update,
  destroy,
  getParentCategories,
  getStats,
};
