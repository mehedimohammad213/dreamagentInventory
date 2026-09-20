import fs from 'fs';
import path from 'path';
import config from '../config/index.js';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Save uploaded files into the Express public folder and return public URLs.
 * Replaces ImageBB remote hosting.
 */
export class LocalFileService {
  /**
   * @param {Express.Multer.File} file
   * @param {'car_image'|'categories'|'attachments'} folder
   * @returns {{ success: true, url: string, path: string, filename: string } | null}
   */
  saveUpload(file, folder = 'car_image') {
    if (!file) return null;

    const destDir = path.join(config.paths.publicRoot, folder);
    ensureDir(destDir);

    const safeName = String(file.originalname || file.filename || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${safeName}`;
    const destPath = path.join(destDir, filename);

    const sourcePath = file.path
      || (file.buffer ? null : path.join(config.paths.attachments, file.filename));

    if (file.buffer) {
      fs.writeFileSync(destPath, file.buffer);
    } else if (sourcePath && fs.existsSync(sourcePath)) {
      fs.renameSync(sourcePath, destPath);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.renameSync(file.path, destPath);
    } else {
      console.error('LocalFileService: source file missing', file);
      return null;
    }

    const relativePath = `${folder}/${filename}`;
    return {
      success: true,
      filename,
      path: relativePath,
      url: this.publicUrl(relativePath),
    };
  }

  /**
   * Persist a multer file as car image or PDF attachment.
   * @param {Express.Multer.File} file
   * @returns {string|null} public URL
   */
  storeCarAttachment(file) {
    if (!file) return null;

    const ext = path.extname(file.originalname || file.filename || '').slice(1).toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      const saved = this.saveUpload(file, 'car_image');
      return saved?.url || null;
    }

    if (ext === 'pdf') {
      const saved = this.saveUpload(file, 'attachments');
      return saved?.url || null;
    }

    return null;
  }

  /**
   * Save category image into public/categories.
   * @param {Express.Multer.File} file
   * @returns {string|null} relative path e.g. categories/xxx.jpg
   */
  storeCategoryImage(file) {
    const saved = this.saveUpload(file, 'categories');
    return saved?.path || null;
  }

  /**
   * @param {string} relativePath e.g. car_image/foo.jpg
   */
  publicUrl(relativePath) {
    if (!relativePath) return null;
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    const clean = String(relativePath).replace(/^\/+/, '');
    return `${config.app.url}/${clean}`;
  }

  /**
   * Resolve a stored URL/path to an absolute filesystem path inside public/.
   * @param {string} stored
   */
  resolvePublicPath(stored) {
    if (!stored) return null;
    if (/^https?:\/\//i.test(stored) && !stored.includes(config.app.url)) {
      return null;
    }

    let relative = stored;
    if (stored.startsWith(config.app.url)) {
      relative = stored.slice(config.app.url.length);
    }
    relative = relative.replace(/^\/+/, '').replace(/^storage\//, '');

    const fullPath = path.join(config.paths.publicRoot, relative);
    const normalizedRoot = path.resolve(config.paths.publicRoot);
    const normalizedFull = path.resolve(fullPath);
    if (!normalizedFull.startsWith(normalizedRoot)) return null;
    return normalizedFull;
  }

  deletePublicFile(stored) {
    const fullPath = this.resolvePublicPath(stored);
    if (fullPath && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }
}

export default new LocalFileService();
