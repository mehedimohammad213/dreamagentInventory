import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import config from './config/index.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
}));
app.use(morgan(config.app.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files from public/ (car_image, categories, attachments, purchase PDFs)
app.use(express.static(config.paths.publicRoot));
// Backward-compatible /storage/* URLs → public/
app.use('/storage', express.static(config.paths.publicRoot));
app.use('/purchase_history_pdfs', express.static(config.paths.purchasePdfs));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: `${config.app.name} API (Express)`,
    version: '1.0.0',
  });
});

app.get('/up', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.app.debug ? { stack: err.stack } : {}),
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not found',
  });
});

export default app;
