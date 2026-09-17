import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

export const config = {
  app: {
    name: process.env.APP_NAME || 'Dream Agent Car Vision',
    env: process.env.APP_ENV || 'local',
    debug: process.env.APP_DEBUG === 'true',
    url: process.env.APP_URL || 'http://localhost:4000',
    port: Number(process.env.PORT || 4000),
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_DATABASE || 'cms',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  mail: {
    host: process.env.MAIL_HOST || '127.0.0.1',
    port: Number(process.env.MAIL_PORT || 2525),
    user: process.env.MAIL_USERNAME || null,
    pass: process.env.MAIL_PASSWORD || null,
    from: process.env.MAIL_FROM_ADDRESS || 'hello@example.com',
    fromName: process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'Car Management',
    secure: process.env.MAIL_SECURE === 'true',
  },
  paths: {
    root: rootDir,
    /** Public web root — all images/PDFs served from here */
    publicRoot: path.join(rootDir, 'public'),
    public: path.join(rootDir, 'public'),
    carImages: path.join(rootDir, 'public', 'car_image'),
    categories: path.join(rootDir, 'public', 'categories'),
    attachments: path.join(rootDir, 'public', 'attachments'),
    purchasePdfs: path.join(rootDir, 'public', 'purchase_history_pdfs'),
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default config;
