import fs from 'fs';
import config from './config/index.js';
import app from './app.js';
import { pool } from './db/pool.js';

for (const dir of [
  config.paths.carImages,
  config.paths.categories,
  config.paths.attachments,
  config.paths.purchasePdfs,
]) {
  fs.mkdirSync(dir, { recursive: true });
}

const server = app.listen(config.app.port, () => {
  console.log(
    `${config.app.name} Express API listening on ${config.app.url} (port ${config.app.port})`
  );
});

async function shutdown(): Promise<void> {
  console.log('Shutting down...');
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
