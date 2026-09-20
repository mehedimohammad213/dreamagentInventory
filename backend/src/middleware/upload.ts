import multer from 'multer';
import type { Request } from 'express';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(config.paths.categories);
ensureDir(config.paths.attachments);
ensureDir(config.paths.purchasePdfs);

function diskStorage(dest: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  });
}

export const uploadCategoryImage = multer({
  storage: diskStorage(config.paths.categories),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /jpeg|jpg|png|gif/i.test(path.extname(file.originalname)) ||
      /image\/(jpeg|jpg|png|gif)/i.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Invalid image type'));
  },
}).single('image');

export const uploadCarAttachment = multer({
  storage: diskStorage(config.paths.attachments),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp|pdf/i.test(path.extname(file.originalname));
    if (ok) cb(null, true);
    else cb(new Error('Invalid attachment type'));
  },
}).single('attached_file');

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /xlsx|xls|csv/i.test(path.extname(file.originalname));
    if (ok) cb(null, true);
    else cb(new Error('Invalid excel file'));
  },
}).single('excel_file');

const purchasePdfFields = [
  'bill_of_lading',
  'invoice_number',
  'export_certificate',
  'export_certificate_translated',
  'bill_of_exchange_amount',
  'custom_duty_copy_3pages',
  'cheque_copy',
  'certificate',
  'custom_one',
  'custom_two',
  'custom_three',
].map((name) => ({ name, maxCount: 1 }));

export const uploadPurchasePdfs = multer({
  storage: diskStorage(config.paths.purchasePdfs),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /pdf/i.test(path.extname(file.originalname)) || file.mimetype === 'application/pdf';
    if (ok) cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
}).fields(purchasePdfFields);

/** Multipart car create/update — attachment + any other fields */
export const uploadCarForm = multer({
  storage: diskStorage(config.paths.attachments),
  limits: { fileSize: 10 * 1024 * 1024 },
}).any();

export const PURCHASE_PDF_FIELDS = purchasePdfFields.map((f) => f.name);

export type MulterRequest = Request & {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
};

export default {
  uploadCategoryImage,
  uploadCarAttachment,
  uploadExcel,
  uploadPurchasePdfs,
  uploadCarForm,
  PURCHASE_PDF_FIELDS,
};
