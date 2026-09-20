import { Router } from 'express';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { auth } from '../middleware/auth.js';
import {
  uploadCategoryImage,
  uploadExcel,
  uploadPurchasePdfs,
  uploadCarForm,
  uploadCarImage,
} from '../middleware/upload.js';

import * as AuthController from '../controllers/AuthController.js';
import * as CategoryController from '../controllers/CategoryController.js';
import * as CarController from '../controllers/CarController.js';
import * as StockController from '../controllers/StockController.js';
import * as CartController from '../controllers/CartController.js';
import * as OrderController from '../controllers/OrderController.js';
import * as PurchaseHistoryController from '../controllers/PurchaseHistoryController.js';
import * as PaymentHistoryController from '../controllers/PaymentHistoryController.js';
import * as UserController from '../controllers/UserController.js';

const router = Router();

function wrapUpload(middleware: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err?: unknown) => {
      if (err) {
        return res.status(422).json({
          success: false,
          message: err instanceof Error ? err.message : 'Upload failed',
        });
      }
      return next();
    });
  };
}

// ─── Auth (public) ───────────────────────────────────────────
router.post('/auth/login', AuthController.login);

// ─── Categories (public reads) ───────────────────────────────
router.get('/categories', CategoryController.index);
router.get('/categories/parent/list', CategoryController.getParentCategories);
router.get('/categories/stats/overview', auth, CategoryController.getStats);
router.get('/categories/:id', CategoryController.show);

// ─── Cars (public reads) ─────────────────────────────────────
router.get('/cars', CarController.index);
router.get('/cars/filter/options', CarController.getFilterOptions);
router.get('/cars/:car', CarController.show);

// ─── Stocks (public reads) — static paths before :stock ──────
router.get('/stocks', StockController.index);
router.get('/stocks/stats/overview', StockController.statistics);
router.get('/stocks/available/cars', auth, StockController.getAvailableCars);
router.get('/stocks/:stock', StockController.show);

// ─── Sanctum-style /api/user ─────────────────────────────────
router.get('/user', auth, AuthController.currentUser);

// ─── Protected routes ────────────────────────────────────────
router.post('/auth/logout', auth, AuthController.logout);
router.get('/auth/user', auth, AuthController.user);

// Users (admin enforced in controller)
router.get('/users', auth, UserController.index);
router.post('/users', auth, UserController.store);
router.get('/users/:user', auth, UserController.show);
router.put('/users/:user', auth, UserController.update);
router.delete('/users/:user', auth, UserController.destroy);

// Categories writes
router.post('/categories', auth, wrapUpload(uploadCategoryImage), CategoryController.store);
router.put('/categories/:id', auth, wrapUpload(uploadCategoryImage), CategoryController.update);
router.delete('/categories/:id', auth, CategoryController.destroy);

// Cars writes — static paths before :car
router.post('/cars/import/excel', auth, wrapUpload(uploadExcel), CarController.importFromExcel);
router.post('/cars/upload-image', auth, wrapUpload(uploadCarImage), CarController.uploadImage);
router.get('/cars/export/excel', auth, CarController.exportToExcel);
router.put('/cars/bulk/status', auth, CarController.bulkUpdateStatus);
router.post('/cars', auth, wrapUpload(uploadCarForm), CarController.store);
router.post('/cars/:car/update', auth, wrapUpload(uploadCarForm), CarController.update);
router.delete('/cars/:car', auth, CarController.destroy);
router.put('/cars/:car/photos', auth, CarController.updatePhotos);
router.put('/cars/:car/details', auth, CarController.updateDetails);
router.get('/cars/:car/attached-file', auth, CarController.getAttachedFile);
router.get('/cars/:car/attached-file/download', auth, CarController.downloadAttachedFile);

// Cart — /clear and /summary before /:cart
router.get('/cart', auth, CartController.index);
router.post('/cart', auth, CartController.store);
router.get('/cart/summary', auth, CartController.summary);
router.delete('/cart/clear', auth, CartController.clear);
router.put('/cart/:cart', auth, CartController.update);
router.delete('/cart/:cart', auth, CartController.destroy);

// Orders — static before :id
router.post('/orders', auth, OrderController.createOrder);
router.get('/orders/user', auth, OrderController.getUserOrders);
router.get('/orders/admin/all', auth, OrderController.getAllOrders);
router.get('/orders/:id', auth, OrderController.getOrder);
router.put('/orders/:id/cancel', auth, OrderController.cancelOrder);
router.put('/orders/:id/status', auth, OrderController.updateOrderStatus);
router.delete('/orders/:id', auth, OrderController.deleteOrder);

// Purchase history
router.get('/purchase-history', auth, PurchaseHistoryController.index);
router.post(
  '/purchase-history',
  auth,
  wrapUpload(uploadPurchasePdfs),
  PurchaseHistoryController.store
);
router.get('/purchase-history/:id/pdf/download', auth, PurchaseHistoryController.downloadPdf);
router.get('/purchase-history/:id', auth, PurchaseHistoryController.show);
router.put(
  '/purchase-history/:id',
  auth,
  wrapUpload(uploadPurchasePdfs),
  PurchaseHistoryController.update
);
router.delete('/purchase-history/:id', auth, PurchaseHistoryController.destroy);

// Payment history
router.get('/payment-history', auth, PaymentHistoryController.index);
router.post('/payment-history', auth, PaymentHistoryController.store);
router.get('/payment-history/:id', auth, PaymentHistoryController.show);
router.put('/payment-history/:id', auth, PaymentHistoryController.update);
router.delete('/payment-history/:id', auth, PaymentHistoryController.destroy);

// Stocks writes
router.post('/stocks', auth, StockController.store);
router.put('/stocks/bulk/status', auth, StockController.bulkUpdateStatus);
router.put('/stocks/:stock', auth, StockController.update);
router.delete('/stocks/:stock', auth, StockController.destroy);

export default router;
