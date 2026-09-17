import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as CarService from '../services/CarService.js';

function getUploadedFile(req, fieldName) {
  if (req.file?.fieldname === fieldName) return req.file;
  if (Array.isArray(req.files)) {
    return req.files.find((f) => f.fieldname === fieldName) || null;
  }
  return req.files?.[fieldName]?.[0] || null;
}

function resolveCarId(req) {
  return req.params.car || req.params.id;
}

export async function index(req, res) {
  try {
    const result = await CarService.listCars(req.query);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve cars');
  }
}

export async function show(req, res) {
  try {
    const result = await CarService.getCar(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve car');
  }
}

export async function store(req, res) {
  try {
    const result = await CarService.createCar(req.body, getUploadedFile(req, 'attached_file'));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create car');
  }
}

export async function update(req, res) {
  try {
    const result = await CarService.updateCar(
      resolveCarId(req),
      req.body,
      getUploadedFile(req, 'attached_file')
    );
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car');
  }
}

export async function destroy(req, res) {
  try {
    const result = await CarService.deleteCar(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete car');
  }
}

export async function importFromExcel(req, res) {
  try {
    const file = getUploadedFile(req, 'excel_file') || req.file;
    const result = await CarService.importFromExcel(file);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to import cars');
  }
}

export async function exportToExcel(req, res) {
  try {
    const result = await CarService.exportToExcel(req.query);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to export cars');
  }
}

export async function updatePhotos(req, res) {
  try {
    const result = await CarService.updatePhotos(resolveCarId(req), req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car photos');
  }
}

export async function updateDetails(req, res) {
  try {
    const result = await CarService.updateDetails(resolveCarId(req), req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car details');
  }
}

export async function bulkUpdateStatus(req, res) {
  try {
    const result = await CarService.bulkUpdateStatus(req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car statuses');
  }
}

export async function getFilterOptions(req, res) {
  try {
    const result = await CarService.getFilterOptions();
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve filter options');
  }
}

export async function getAttachedFile(req, res) {
  try {
    const result = await CarService.getAttachedFile(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve attached file');
  }
}

export async function downloadAttachedFile(req, res) {
  try {
    const result = await CarService.downloadAttachedFile(resolveCarId(req));
    if (result.type === 'download') {
      return res.download(result.path, result.filename);
    }
    if (result.type === 'redirect') {
      return res.redirect(result.url);
    }
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to download attached file');
  }
}

export default {
  index,
  show,
  store,
  update,
  destroy,
  importFromExcel,
  exportToExcel,
  updatePhotos,
  updateDetails,
  bulkUpdateStatus,
  getFilterOptions,
  getAttachedFile,
  downloadAttachedFile,
};
