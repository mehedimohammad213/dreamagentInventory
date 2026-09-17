import Stock from '../models/Stock.js';
import Car from '../models/Car.js';
import { query, withTransaction } from '../db/pool.js';
import { validate, toInt, toFloat } from '../utils/validate.js';
import { ValidationError, AppError } from '../lib/errors.js';
import { dispatchStockUpdateNotification } from './StockMailService.js';

const STATUSES = [
  'pending',
  'available',
  'sold',
  'reserved',
  'in_transit',
  'preorder',
  'damaged',
  'lost',
  'stolen',
];

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function stockStatusForCar(car) {
  if (!car || car.status == null || car.status === '') {
    return 'available';
  }

  const normalized = String(car.status).trim().toLowerCase();
  if (STATUSES.includes(normalized)) {
    return normalized;
  }

  const pendingLike = ['processing', 'incoming', 'before'];
  if (pendingLike.includes(normalized)) {
    return 'pending';
  }

  return 'available';
}

function applyStockFilters(qb, filters) {
  if (isFilled(filters.status)) {
    qb.where('stocks.status', filters.status);
  }

  if (isFilled(filters.min_price)) {
    qb.where('stocks.price', '>=', toFloat(filters.min_price));
  }
  if (isFilled(filters.max_price)) {
    qb.where('stocks.price', '<=', toFloat(filters.max_price));
  }

  if (isFilled(filters.min_quantity)) {
    qb.where('stocks.quantity', '>=', toInt(filters.min_quantity));
  }
  if (isFilled(filters.max_quantity)) {
    qb.where('stocks.quantity', '<=', toInt(filters.max_quantity));
  }

  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      q.whereLike('cars.make', term)
        .orWhere('cars.model', 'ILIKE', term)
        .orWhere('cars.ref_no', 'ILIKE', term);
    });
  }

  return qb;
}

async function loadStockWithCar(stock) {
  await stock.loadCar();
  return stock;
}

async function hydrateStocksWithCars(rows) {
  const stocks = Stock.hydrateMany(rows);
  for (const stock of stocks) {
    await loadStockWithCar(stock);
  }
  return stocks;
}

function buildNotifyData(body) {
  const notifyData = {};
  if (Object.prototype.hasOwnProperty.call(body, 'price')) {
    notifyData.price = body.price;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
    notifyData.notes = body.notes;
  }
  return notifyData;
}

function dispatchNotification(stock, notifyData) {
  if (!stock || !Object.keys(notifyData).length) return;
  try {
    dispatchStockUpdateNotification(stock.id);
  } catch (err) {
    console.error('Failed to dispatch stock update notification job', err.message);
  }
}

async function validateCarIds(carIds) {
  for (const [index, carId] of carIds.entries()) {
    const car = await Car.find(carId);
    if (!car) {
      throw new ValidationError({ [`car_ids.${index}`]: ['The selected car id is invalid.'] });
    }
  }
}

export async function index(queryParams) {
  let qb = Stock.query()
    .select('stocks.*')
    .join('cars', 'stocks.car_id', '=', 'cars.id');

  qb = applyStockFilters(qb, queryParams);

  const sortBy = queryParams.sort_by || 'created_at';
  const sortOrder = String(queryParams.sort_order || 'desc').toLowerCase() === 'asc'
    ? 'ASC'
    : 'DESC';
  const sortColumn = sortBy.includes('.') ? sortBy : `stocks.${sortBy}`;
  qb = qb.orderBy(sortColumn, sortOrder);

  const perPage = toInt(queryParams.per_page, 15);
  const page = toInt(queryParams.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);
  const stocks = await hydrateStocksWithCars(rows);

  return {
    data: stocks,
    message: 'Stocks retrieved successfully',
    status: 200,
    pagination,
  };
}

export async function show(id) {
  const stock = await Stock.findOrFail(id);
  await stock.loadCar();
  if (stock.car) {
    await stock.car.loadRelations({ details: true });
  }

  return {
    data: stock,
    message: 'Stock retrieved successfully',
  };
}

export async function store(body) {
  const isBulkMode = Array.isArray(body.car_ids) && body.car_ids.length > 0;

  const rules = {
    quantity: 'nullable|integer|min:0',
    price: 'nullable|numeric|min:0',
    status: `nullable|in:${STATUSES.join(',')}`,
    notes: 'nullable|string|max:1000',
  };

  if (isBulkMode) {
    rules.make = 'required|string';
    rules.model = 'required|string';
    rules.package = 'nullable|string';
    rules.car_ids = 'required|array';
  } else {
    rules.car_id = 'required|integer';
  }

  const { ok, errors } = validate(body, rules);
  if (!ok) throw new ValidationError(errors);

  if (isBulkMode) {
    await validateCarIds(body.car_ids);
  } else {
    const car = await Car.find(body.car_id);
    if (!car) {
      throw new ValidationError({ car_id: ['The selected car id is invalid.'] });
    }
  }

  const result = await withTransaction(async (client) => {
    if (isBulkMode) {
      const createdStocks = [];
      let updatedCount = 0;

      for (const carId of body.car_ids) {
        const car = await Car.find(carId, client);
        const existingRow = await Stock.query(client).where('car_id', carId).first();

        if (existingRow) {
          const existingStock = Stock.hydrate(existingRow);
          await existingStock.update({
            quantity: 1,
            price: body.price,
            notes: body.notes,
          }, client);
          updatedCount += 1;
          createdStocks.push(existingStock);
        } else {
          const stock = await Stock.create({
            car_id: carId,
            quantity: 1,
            price: body.price,
            status: stockStatusForCar(car),
            notes: body.notes,
          }, client);
          createdStocks.push(stock);
        }
      }

      if (createdStocks.length) {
        await loadStockWithCar(createdStocks[0]);
      }

      return {
        stock: createdStocks[0] || null,
        createdCount: createdStocks.length,
        updatedCount,
      };
    }

    const existingRow = await Stock.query(client).where('car_id', body.car_id).first();
    if (existingRow) {
      throw new AppError('Stock already exists for this car. Use update instead.', 409);
    }

    const car = await Car.find(body.car_id, client);
    const stock = await Stock.create({
      car_id: body.car_id,
      quantity: 1,
      price: body.price,
      status: stockStatusForCar(car),
      notes: body.notes,
    }, client);

    await loadStockWithCar(stock);
    return { stock, createdCount: 1, updatedCount: 0 };
  });

  if (isBulkMode) {
    const { stock, createdCount, updatedCount } = result;
    const message = createdCount > 0
      ? `Stock created/updated for ${createdCount} car(s) (Created: ${createdCount - updatedCount}, Updated: ${updatedCount})`
      : 'Stock created successfully';

    return {
      data: stock,
      message,
      status: 201,
    };
  }

  return {
    data: result.stock,
    message: 'Stock created successfully',
    status: 201,
  };
}

export async function update(id, body) {
  const stock = await Stock.findOrFail(id);
  const isBulkMode = Array.isArray(body.car_ids);

  const rules = {
    quantity: 'nullable|integer|min:0',
    price: 'nullable|numeric|min:0',
    status: `nullable|in:${STATUSES.join(',')}`,
    notes: 'nullable|string|max:1000',
  };

  if (isBulkMode) {
    rules.make = 'required|string';
    rules.model = 'required|string';
    rules.package = 'nullable|string';
    rules.car_ids = 'required|array';
  }

  const { ok, errors } = validate(body, rules);
  if (!ok) throw new ValidationError(errors);

  if (isBulkMode) {
    await validateCarIds(body.car_ids);
  }

  const notifyData = buildNotifyData(body);

  if (isBulkMode) {
    const updatedStocks = await withTransaction(async (client) => {
      const stocks = [];
      let updatedCount = 0;

      for (const carId of body.car_ids) {
        const existingRow = await Stock.query(client).where('car_id', carId).first();
        if (!existingRow) continue;

        const existingStock = Stock.hydrate(existingRow);
        const payload = { quantity: 1 };
        if (Object.prototype.hasOwnProperty.call(body, 'price')) {
          payload.price = body.price;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
          payload.notes = body.notes;
        }

        await existingStock.update(payload, client);
        stocks.push(existingStock);
        updatedCount += 1;
      }

      if (stocks.length) {
        await loadStockWithCar(stocks[0]);
      }

      return { stocks, updatedCount };
    });

    dispatchNotification(updatedStocks.stocks[0] || stock, notifyData);

    return {
      data: updatedStocks.stocks[0] || stock,
      message: `Stock updated for ${updatedStocks.updatedCount} car(s)`,
    };
  }

  await withTransaction(async (client) => {
    const payload = { quantity: 1 };
    if (Object.prototype.hasOwnProperty.call(body, 'price')) {
      payload.price = body.price;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'notes')) {
      payload.notes = body.notes;
    }
    await stock.update(payload, client);
  });

  await loadStockWithCar(stock);
  dispatchNotification(stock, notifyData);

  return {
    data: stock,
    message: 'Stock updated successfully',
  };
}

export async function destroy(id) {
  const stock = await Stock.findOrFail(id);

  await withTransaction(async (client) => {
    await stock.delete(client);
  });

  return {
    data: null,
    message: 'Stock deleted successfully',
  };
}

export async function bulkUpdateStatus(body) {
  const { ok, errors } = validate(body, {
    stock_ids: 'required|array',
    status: `required|in:${STATUSES.join(',')}`,
  });
  if (!ok) throw new ValidationError(errors);

  for (const [index, stockId] of (body.stock_ids || []).entries()) {
    const exists = await Stock.find(stockId);
    if (!exists) {
      throw new ValidationError({ [`stock_ids.${index}`]: ['The selected stock id is invalid.'] });
    }
  }

  const updatedStocks = await withTransaction(async (client) => {
    const rows = await Stock.query(client).whereIn('id', body.stock_ids).get();
    const stocks = Stock.hydrateMany(rows);

    for (const item of stocks) {
      await item.update({ status: body.status }, client);
      const car = await Car.find(item.car_id, client);
      if (car) {
        await car.update({ status: body.status }, client);
      }
    }

    return stocks;
  });

  return {
    message: 'Stock statuses updated successfully',
    updatedCount: updatedStocks.length,
  };
}

export async function statistics() {
  const [totalStocks, totalQuantityRow, totalValueRow, byStatus, byCategory] = await Promise.all([
    Stock.query().count(),
    query('SELECT COALESCE(SUM(quantity), 0) AS total FROM stocks'),
    query('SELECT COALESCE(SUM(quantity * COALESCE(price, 0)), 0) AS total FROM stocks'),
    query('SELECT status, COUNT(*)::int AS count FROM stocks GROUP BY status ORDER BY status'),
    query(`
      SELECT categories.name, COUNT(*)::int AS count
      FROM stocks
      INNER JOIN cars ON stocks.car_id = cars.id
      INNER JOIN categories ON cars.category_id = categories.id
      GROUP BY categories.id, categories.name
      ORDER BY categories.name
    `),
  ]);

  const stats = {
    total_stocks: totalStocks,
    total_quantity: Number(totalQuantityRow.rows[0]?.total || 0),
    total_value: Number(totalValueRow.rows[0]?.total || 0),
    by_status: byStatus.rows,
    by_category: byCategory.rows,
  };

  return {
    data: stats,
    message: 'Stock statistics retrieved successfully',
  };
}

export async function getAvailableCars() {
  const stockRows = await Stock.query().select('car_id').get();
  const stockedCarIds = stockRows.map((row) => row.car_id).filter(Boolean);

  let qb = Car.query();
  if (stockedCarIds.length) {
    qb = qb.whereNotIn('id', stockedCarIds);
  }

  const rows = await qb.get();
  const cars = Car.hydrateMany(rows);
  for (const car of cars) {
    await car.loadRelations({ details: false });
  }

  return {
    data: cars,
    message: 'Available cars retrieved successfully',
  };
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  bulkUpdateStatus,
  statistics,
  getAvailableCars,
};
