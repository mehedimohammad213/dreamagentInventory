// @ts-nocheck
import fs from 'fs';
import path from 'path';
import Car from '../models/Car.js';
import CarPhoto from '../models/CarPhoto.js';
import CarDetail from '../models/CarDetail.js';
import CarSubDetail from '../models/CarSubDetail.js';
import Category from '../models/Category.js';
import { query, withTransaction } from '../db/pool.js';
import { validate, parseMaybeJson, toInt, toFloat } from '../utils/validate.js';
import localFileService from './LocalFileService.js';
import { importCarsFromExcel } from './ExcelImportService.js';
import { ValidationError, NotFoundError, AppError } from '../lib/errors.js';

const CAR_SCALAR_FIELDS = [
  'category_id', 'subcategory_id', 'ref_no', 'code', 'make', 'model', 'model_code',
  'variant', 'year', 'reg_year_month', 'mileage_km', 'engine_cc', 'transmission',
  'drive', 'steering', 'fuel', 'color', 'seats', 'grade_overall', 'grade_exterior',
  'grade_interior', 'price_amount', 'price_currency', 'price_basis', 'fob_value_usd',
  'freight_usd', 'chassis_no_masked', 'chassis_no_full', 'location', 'country_origin',
  'status', 'package', 'body', 'type', 'engine_number', 'number_of_keys',
  'keys_feature', 'notes', 'attached_file',
];

const SEARCH_COLUMNS = [
  'ref_no', 'code', 'make', 'model', 'variant', 'model_code',
  'chassis_no_masked', 'chassis_no_full', 'location', 'notes',
];

const SORTABLE_COLUMNS = new Set([
  'id', 'created_at', 'updated_at', 'make', 'model', 'year', 'price_amount',
  'mileage_km', 'status', 'ref_no',
]);

function isFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function toBool(value, fallback = false) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  if (value === undefined || value === null || value === '') return fallback;
  return Boolean(value);
}

function prepareValidationData(body) {
  const data = { ...body };
  if (typeof data.photos === 'string') {
    data.photos = parseMaybeJson(data.photos, []);
  }
  if (typeof data.details === 'string') {
    data.details = parseMaybeJson(data.details, []);
  }
  return data;
}

function pickCarData(data) {
  const out = {};
  for (const key of CAR_SCALAR_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

function applyCarFilters(qb, filters) {
  if (isFilled(filters.search)) {
    const term = `%${filters.search}%`;
    qb.whereGroup((q) => {
      SEARCH_COLUMNS.forEach((col, index) => {
        if (index === 0) q.whereLike(col, term);
        else q.orWhere(col, 'ILIKE', term);
      });
    });
  }

  if (isFilled(filters.status)) qb.where('status', filters.status);
  if (isFilled(filters.category_id)) qb.where('category_id', toInt(filters.category_id));
  if (isFilled(filters.subcategory_id)) qb.where('subcategory_id', toInt(filters.subcategory_id));
  if (isFilled(filters.make)) qb.where('make', filters.make);

  if (isFilled(filters.year_from) && isFilled(filters.year_to)) {
    qb.whereBetween('year', [toInt(filters.year_from), toInt(filters.year_to)]);
  } else if (isFilled(filters.year)) {
    qb.where('year', toInt(filters.year));
  }

  if (isFilled(filters.price_from) && isFilled(filters.price_to)) {
    qb.whereBetween('price_amount', [toFloat(filters.price_from), toFloat(filters.price_to)]);
  }

  if (isFilled(filters.mileage_from) && isFilled(filters.mileage_to)) {
    qb.whereBetween('mileage_km', [toInt(filters.mileage_from), toInt(filters.mileage_to)]);
  }

  if (isFilled(filters.transmission)) qb.where('transmission', filters.transmission);
  if (isFilled(filters.grade_overall)) qb.where('grade_overall', filters.grade_overall);
  if (isFilled(filters.fuel)) qb.where('fuel', filters.fuel);
  if (isFilled(filters.color)) qb.where('color', filters.color);
  if (isFilled(filters.drive)) qb.where('drive', filters.drive);
  if (isFilled(filters.steering)) qb.where('steering', filters.steering);
  if (isFilled(filters.country)) qb.where('country_origin', filters.country);

  return qb;
}

async function handleFileUpload(file) {
  if (!file) return null;
  return localFileService.storeCarAttachment(file);
}

async function existsCategory(id) {
  if (!id) return true;
  return Boolean(await Category.find(id));
}

async function isUniqueCarField(field, value, exceptId = null) {
  if (!isFilled(value)) return true;
  let qb = Car.query().where(field, value);
  if (exceptId) qb = qb.where('id', '!=', exceptId);
  return !(await qb.first());
}

async function validateCarPayload(data, { isUpdate = false, carId = null } = {}) {
  const errors = {};
  const maxYear = new Date().getFullYear() + 1;

  const baseRules = {
    category_id: 'nullable|integer',
    subcategory_id: 'nullable|integer',
    code: 'nullable|string|max:50',
    model_code: 'nullable|string|max:32',
    variant: 'nullable|string|max:128',
    reg_year_month: 'nullable|string|max:10',
    mileage_km: 'nullable|integer|min:0',
    engine_cc: 'nullable|integer|min:0',
    transmission: 'nullable|string|max:32',
    drive: 'nullable|string|max:32',
    steering: 'nullable|string|max:16',
    fuel: 'nullable|string|max:32',
    color: 'nullable|string|max:64',
    seats: 'nullable|integer|min:1|max:20',
    grade_overall: 'nullable|string|max:10',
    grade_exterior: 'nullable|string|max:32',
    grade_interior: 'nullable|string|max:32',
    price_amount: 'nullable|numeric|min:0',
    price_currency: 'nullable|string|max:3',
    price_basis: 'nullable|string|max:32',
    fob_value_usd: 'nullable|numeric|min:0',
    freight_usd: 'nullable|numeric|min:0',
    chassis_no_masked: 'nullable|string|max:32',
    location: 'nullable|string|max:128',
    country_origin: 'nullable|string|max:64',
    status: 'nullable|string|max:32',
    package: 'nullable|string|max:255',
    body: 'nullable|string|max:64',
    type: 'nullable|string|max:64',
    engine_number: 'nullable|string|max:64',
    number_of_keys: 'nullable|integer|min:0',
    keys_feature: 'nullable|string',
    notes: 'nullable|string',
    photos: 'nullable|array',
    details: 'nullable|array',
  };

  if (isUpdate) {
    baseRules.ref_no = 'nullable|string|max:32';
    baseRules.make = 'nullable|string|max:64';
    baseRules.model = 'nullable|string|max:64';
    baseRules.year = 'nullable|integer|min:1900';
    baseRules.chassis_no_full = 'nullable|string|max:64';
  } else {
    baseRules.ref_no = 'nullable|string|max:32';
    baseRules.make = 'required|string|max:64';
    baseRules.model = 'required|string|max:64';
    baseRules.year = `required|integer|min:1900|max:${maxYear}`;
    baseRules.chassis_no_full = 'nullable|string|max:64';
  }

  const { ok, errors: ruleErrors } = validate(data, baseRules);
  Object.assign(errors, ruleErrors);

  if (data.year != null && data.year !== '' && Number(data.year) > maxYear) {
    errors.year = errors.year || [`The year may not be greater than ${maxYear}.`];
  }

  if (isFilled(data.category_id) && !(await existsCategory(toInt(data.category_id)))) {
    errors.category_id = ['The selected category id is invalid.'];
  }
  if (isFilled(data.subcategory_id) && !(await existsCategory(toInt(data.subcategory_id)))) {
    errors.subcategory_id = ['The selected subcategory id is invalid.'];
  }
  if (isFilled(data.ref_no) && !(await isUniqueCarField('ref_no', data.ref_no, carId))) {
    errors.ref_no = ['The ref no has already been taken.'];
  }
  if (isFilled(data.chassis_no_full) && !(await isUniqueCarField('chassis_no_full', data.chassis_no_full, carId))) {
    errors.chassis_no_full = ['The chassis no full has already been taken.'];
  }

  if (Array.isArray(data.photos)) {
    data.photos.forEach((photo, index) => {
      if (!photo?.url) {
        errors[`photos.${index}.url`] = ['The photos url field is required when photos is present.'];
      } else if (String(photo.url).length > 512) {
        errors[`photos.${index}.url`] = ['The photos url may not be greater than 512 characters.'];
      }
    });
  }

  if (Array.isArray(data.details)) {
    data.details.forEach((detail, index) => {
      if (detail?.short_title != null && String(detail.short_title).length > 255) {
        errors[`details.${index}.short_title`] = ['The short title may not be greater than 255 characters.'];
      }
      if (detail?.full_title != null && String(detail.full_title).length > 255) {
        errors[`details.${index}.full_title`] = ['The full title may not be greater than 255 characters.'];
      }
      if (Array.isArray(detail?.images)) {
        detail.images.forEach((img, imgIndex) => {
          if (String(img).length > 512) {
            errors[`details.${index}.images.${imgIndex}`] = ['The image url may not be greater than 512 characters.'];
          }
        });
      }
      if (Array.isArray(detail?.sub_details)) {
        detail.sub_details.forEach((sub, subIndex) => {
          if (sub?.title != null && String(sub.title).length > 255) {
            errors[`details.${index}.sub_details.${subIndex}.title`] = ['The title may not be greater than 255 characters.'];
          }
        });
      }
    });
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

async function createPhotos(carId, photos, client) {
  if (!photos?.length) return;
  for (const photoData of photos) {
    await CarPhoto.create({
      car_id: carId,
      url: photoData.url,
      is_primary: toBool(photoData.is_primary, false),
      sort_order: toInt(photoData.sort_order, 0),
      is_hidden: toBool(photoData.is_hidden, false),
    }, client);
  }
}

async function deleteCarDetails(carId, client) {
  const detailRows = await CarDetail.query(client).where('car_id', carId).get();
  for (const row of detailRows) {
    await CarSubDetail.query(client).where('car_detail_id', row.id).delete();
  }
  await CarDetail.query(client).where('car_id', carId).delete();
}

async function createDetails(carId, details, client) {
  if (!details?.length) return;
  for (const detailData of details) {
    const subDetails = detailData.sub_details ?? [];
    const payload = {
      car_id: carId,
      short_title: detailData.short_title ?? null,
      full_title: detailData.full_title ?? null,
      description: detailData.description ?? null,
      images: detailData.images ?? null,
    };
    const carDetail = await CarDetail.create(payload, client);
    for (const subDetailData of subDetails) {
      await CarSubDetail.create({
        car_detail_id: carDetail.id,
        title: subDetailData.title ?? null,
        description: subDetailData.description ?? null,
      }, client);
    }
  }
}

export async function listCars(filters) {
  let qb = applyCarFilters(Car.query(), filters);

  const sortBy = SORTABLE_COLUMNS.has(filters.sort_by)
    ? filters.sort_by
    : 'created_at';
  const sortDirection = String(filters.sort_direction || 'desc').toLowerCase() === 'asc'
    ? 'ASC'
    : 'DESC';

  qb = qb.orderBy(sortBy, sortDirection);

  const perPage = toInt(filters.per_page, 15);
  const page = toInt(filters.page, 1);
  const { data: rows, pagination } = await qb.paginate(page, perPage);

  const cars = Car.hydrateMany(rows);
  for (const car of cars) {
    await car.loadRelations();
  }

  return {
    message: 'Cars retrieved successfully',
    data: {
      current_page: pagination.current_page,
      data: cars,
      last_page: pagination.last_page,
      per_page: pagination.per_page,
      total: pagination.total,
      from: pagination.from,
      to: pagination.to,
    },
  };
}

export async function getCar(id) {
  const car = await Car.findOrFail(id);
  await car.loadRelations();
  return {
    message: 'Car retrieved successfully',
    data: { car },
  };
}

export async function createCar(body, uploadedFile = null) {
  const validationData = prepareValidationData(body);

  const { ok, errors } = await validateCarPayload(validationData, { isUpdate: false });
  if (!ok) throw new ValidationError(errors);

  const car = await withTransaction(async (client) => {
    let attachedFileUrl = null;
    if (uploadedFile) {
      attachedFileUrl = await handleFileUpload(uploadedFile);
    }

    const carData = pickCarData(validationData);
    if (attachedFileUrl) carData.attached_file = attachedFileUrl;

    const created = await Car.create(carData, client);
    await createPhotos(created.id, validationData.photos, client);
    await createDetails(created.id, validationData.details, client);
    return created;
  });

  await car.loadRelations();
  return {
    status: 201,
    message: 'Car created successfully',
    data: { car },
  };
}

export async function updateCar(id, body, uploadedFile = null) {
  const car = await Car.findOrFail(id);
  const validationData = prepareValidationData(body);

  const { ok, errors } = await validateCarPayload(validationData, {
    isUpdate: true,
    carId: car.id,
  });
  if (!ok) throw new ValidationError(errors);

  await withTransaction(async (client) => {
    let attachedFileUrl = null;
    if (uploadedFile) {
      attachedFileUrl = await handleFileUpload(uploadedFile);
    }

    const carData = pickCarData(validationData);
    if (attachedFileUrl) carData.attached_file = attachedFileUrl;

    if (Object.keys(carData).length) {
      await car.update(carData, client);
    }

    if (validationData.photos?.length) {
      await CarPhoto.query(client).where('car_id', car.id).delete();
      await createPhotos(car.id, validationData.photos, client);
    }

    if (validationData.details?.length) {
      await deleteCarDetails(car.id, client);
      await createDetails(car.id, validationData.details, client);
    }
  });

  await car.loadRelations();
  return {
    message: 'Car updated successfully',
    data: { car },
  };
}

export async function deleteCar(id) {
  const car = await Car.findOrFail(id);
  await car.delete();
  return {
    message: 'Car deleted successfully',
    data: null,
  };
}

export async function importFromExcel(file) {
  if (!file) {
    throw new ValidationError({ excel_file: ['The excel file field is required.'] });
  }

  const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
  const allowedExtensions = ['xlsx', 'xls', 'csv'];
  if (!allowedExtensions.includes(ext)) {
    throw new ValidationError({
      excel_file: ['The file must be a valid Excel or CSV file.'],
    });
  }

  const buffer = file.buffer || fs.readFileSync(file.path);
  const result = await importCarsFromExcel(buffer);

  return {
    rawResponse: {
      success: true,
      message: 'Cars imported successfully',
      imported_count: result.processed,
      note: 'Please update car photos and details for imported cars',
    },
  };
}

export async function exportToExcel(filters) {
  let qb = applyCarFilters(Car.query(), filters);
  const rows = await qb.get();
  const fileName = `cars_export_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.xlsx`;

  return {
    rawResponse: {
      success: true,
      message: 'Cars exported successfully',
      file_name: fileName,
      exported_count: rows.length,
    },
  };
}

export async function updatePhotos(id, body) {
  const car = await Car.findOrFail(id);

  const { ok, errors } = validate(body, {
    photos: 'required|array',
  });
  if (!ok) throw new ValidationError(errors);

  if (!Array.isArray(body.photos) || body.photos.length < 1) {
    throw new ValidationError({ photos: ['The photos field must have at least 1 items.'] });
  }

  for (const [index, photo] of body.photos.entries()) {
    if (!photo?.url) {
      throw new ValidationError({ [`photos.${index}.url`]: ['The photos url field is required.'] });
    }
  }

  await withTransaction(async (client) => {
    await CarPhoto.query(client).where('car_id', car.id).delete();
    await createPhotos(car.id, body.photos, client);
  });

  await car.loadRelations({ details: false });

  return {
    message: 'Car photos updated successfully',
    data: car,
  };
}

export async function updateDetails(id, body) {
  const car = await Car.findOrFail(id);

  const { ok, errors } = validate(body, {
    short_title: 'nullable|string|max:255',
    full_title: 'nullable|string|max:255',
    description: 'nullable|string',
    images: 'nullable|array',
    sub_details: 'nullable|array',
  });
  if (!ok) throw new ValidationError(errors);

  await withTransaction(async (client) => {
    const subDetails = body.sub_details ?? [];
    const detailData = {
      short_title: body.short_title ?? null,
      full_title: body.full_title ?? null,
      description: body.description ?? null,
      images: body.images ?? null,
    };

    const existing = await CarDetail.query(client).where('car_id', car.id).first();

    if (existing) {
      const carDetail = CarDetail.hydrate(existing);
      await carDetail.update(detailData, client);
      await CarSubDetail.query(client).where('car_detail_id', carDetail.id).delete();
      for (const subDetailData of subDetails) {
        await CarSubDetail.create({
          car_detail_id: carDetail.id,
          title: subDetailData.title ?? null,
          description: subDetailData.description ?? null,
        }, client);
      }
    } else {
      const carDetail = await CarDetail.create({ car_id: car.id, ...detailData }, client);
      for (const subDetailData of subDetails) {
        await CarSubDetail.create({
          car_detail_id: carDetail.id,
          title: subDetailData.title ?? null,
          description: subDetailData.description ?? null,
        }, client);
      }
    }
  });

  await car.loadRelations();
  return {
    message: 'Car details updated successfully',
    data: car,
  };
}

export async function bulkUpdateStatus(body) {
  const { ok, errors } = validate(body, {
    car_ids: 'required|array',
    status: 'required|string|max:32',
  });
  if (!ok) throw new ValidationError(errors);

  for (const [index, carId] of (body.car_ids || []).entries()) {
    const exists = await Car.find(carId);
    if (!exists) {
      throw new ValidationError({ [`car_ids.${index}`]: ['The selected car id is invalid.'] });
    }
  }

  const rows = await Car.query()
    .whereIn('id', body.car_ids)
    .update({ status: body.status });

  const updatedCount = rows.length;

  return {
    rawResponse: {
      success: true,
      message: `Status updated for ${updatedCount} cars`,
      updated_count: updatedCount,
    },
  };
}

export async function getFilterOptions() {
  async function distinctColumn(column) {
    const result = await query(
      `SELECT DISTINCT "${column}" AS value FROM cars
       WHERE "${column}" IS NOT NULL AND TRIM(CAST("${column}" AS TEXT)) != ''
       ORDER BY value ASC`
    );
    return result.rows.map((row) => row.value);
  }

  const categoryRows = await Category.query().select('id', 'name').get();
  const categories = Category.hydrateMany(categoryRows);

  const options = {
    makes: await distinctColumn('make'),
    models: await distinctColumn('model'),
    transmissions: await distinctColumn('transmission'),
    grades: await distinctColumn('grade_overall'),
    fuels: await distinctColumn('fuel'),
    colors: await distinctColumn('color'),
    drives: await distinctColumn('drive'),
    steerings: await distinctColumn('steering'),
    countries: await distinctColumn('country_origin'),
    statuses: await distinctColumn('status'),
    categories,
    years: (await distinctColumn('year')).map(Number).sort((a, b) => a - b),
  };

  return {
    message: 'Filter options retrieved successfully',
    data: options,
  };
}

export async function getAttachedFile(id) {
  const car = await Car.findOrFail(id);

  if (!car.attached_file) {
    throw new NotFoundError('No attached file found for this car');
  }

  const url = /^https?:\/\//i.test(car.attached_file)
    ? car.attached_file
    : localFileService.publicUrl(car.attached_file.replace(/^\/+/, ''));

  const isPdf = /\.pdf($|\?)/i.test(url) || url.includes('/attachments/');

  return {
    message: 'Attached file retrieved successfully',
    data: {
      url,
      type: isPdf ? 'pdf' : 'image',
      filename: path.basename(car.attached_file),
    },
  };
}

export async function downloadAttachedFile(id) {
  const car = await Car.findOrFail(id);

  if (!car.attached_file) {
    throw new NotFoundError('No attached file found for this car');
  }

  const fullPath = localFileService.resolvePublicPath(car.attached_file);
  if (fullPath && fs.existsSync(fullPath)) {
    return {
      type: 'download',
      path: fullPath,
      filename: path.basename(car.attached_file),
    };
  }

  if (/^https?:\/\//i.test(car.attached_file)) {
    return {
      type: 'redirect',
      url: car.attached_file,
    };
  }

  throw new NotFoundError('Attached file not found on disk');
}

/**
 * Save gallery image into public/car_image and return path + public URL.
 * Stores relative path in DB (e.g. car_image/xxx.jpg).
 */
export async function uploadCarImage(file) {
  if (!file) {
    throw new ValidationError({ image: ['The image field is required.'] });
  }

  // Multer already wrote into car_image/; keep that file and return folder path
  if (file.path && file.filename) {
    const relativePath = `car_image/${file.filename}`;
    return {
      data: {
        path: relativePath,
        url: localFileService.publicUrl(relativePath),
        filename: file.filename,
      },
      message: 'Image uploaded successfully',
      status: 201,
    };
  }

  const saved = localFileService.saveUpload(file, 'car_image');
  if (!saved) {
    throw new AppError('Failed to save image', 500);
  }

  return {
    data: {
      path: saved.path,
      url: saved.url,
      filename: saved.filename,
    },
    message: 'Image uploaded successfully',
    status: 201,
  };
}

export default {
  listCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
  importFromExcel,
  exportToExcel,
  updatePhotos,
  updateDetails,
  bulkUpdateStatus,
  getFilterOptions,
  getAttachedFile,
  downloadAttachedFile,
  uploadCarImage,
};
