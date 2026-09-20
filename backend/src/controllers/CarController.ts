// @ts-nocheck
import type { Request, Response } from 'express';
import { success } from '../lib/response.js';
import { handleControllerError } from '../lib/errors.js';
import * as CarService from '../services/CarService.js';

function getUploadedFile(
  req: Request,
  fieldName: string
): Express.Multer.File | null {
  if (req.file?.fieldname === fieldName) return req.file;
  if (Array.isArray(req.files)) {
    return req.files.find((f) => f.fieldname === fieldName) || null;
  }
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  return files?.[fieldName]?.[0] || null;
}

function resolveCarId(req: Request): string | undefined {
  return req.params.car || req.params.id;
}

export async function index(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.listCars(req.query as Record<string, unknown>);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve cars');
  }
}

export async function show(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.getCar(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve car');
  }
}

export async function store(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.createCar(req.body, getUploadedFile(req, 'attached_file'));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to create car');
  }
}

export async function update(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.updateCar(
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

export async function destroy(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.deleteCar(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to delete car');
  }
}

export async function importFromExcel(req: Request, res: Response): Promise<void | Response> {
  try {
    const file = getUploadedFile(req, 'excel_file') || req.file || null;
    const result: any = await CarService.importFromExcel(file);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to import cars');
  }
}

export async function exportToExcel(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.exportToExcel(req.query as Record<string, unknown>);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to export cars');
  }
}

export async function updatePhotos(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.updatePhotos(resolveCarId(req), req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car photos');
  }
}

export async function updateDetails(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.updateDetails(resolveCarId(req), req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car details');
  }
}

export async function bulkUpdateStatus(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.bulkUpdateStatus(req.body);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to update car statuses');
  }
}

export async function getFilterOptions(_req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.getFilterOptions();
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve filter options');
  }
}

export async function getAttachedFile(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.getAttachedFile(resolveCarId(req));
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to retrieve attached file');
  }
}

export async function downloadAttachedFile(req: Request, res: Response): Promise<void | Response> {
  try {
    const result: any = await CarService.downloadAttachedFile(resolveCarId(req));
    if (result.type === 'download') {
      return res.download(result.path!, result.filename);
    }
    if (result.type === 'redirect') {
      return res.redirect(result.url!);
    }
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 200);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to download attached file');
  }
}

/** Upload a car gallery image into public/car_image */
export async function uploadImage(req: Request, res: Response): Promise<void | Response> {
  try {
    const file = req.file;
    if (!file) {
      return res.status(422).json({
        success: false,
        message: 'Image file is required',
      });
    }

    const result: any = await CarService.uploadCarImage(file);
    if (result.rawResponse) return res.status(result.status || 200).json(result.rawResponse);
    return success(res, result.data, result.message, result.status || 201);
  } catch (err) {
    return handleControllerError(res, err, 'Failed to upload car image');
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
  uploadImage,
};
