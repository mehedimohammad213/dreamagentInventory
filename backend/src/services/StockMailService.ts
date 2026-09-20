import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { query } from '../db/pool.js';
import Stock from '../models/Stock.js';

function createTransport() {
  return nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user
      ? { user: config.mail.user, pass: config.mail.pass }
      : undefined,
  });
}

function buildHtml(stock) {
  const car = stock.car || {};
  return `
    <h2>Stock Update Notification</h2>
    <p>A stock item has been updated.</p>
    <ul>
      <li><strong>Stock ID:</strong> ${stock.id}</li>
      <li><strong>Car:</strong> ${car.make || ''} ${car.model || ''} (${car.year || ''})</li>
      <li><strong>Ref:</strong> ${car.ref_no || 'N/A'}</li>
      <li><strong>Price:</strong> ${stock.price ?? 'N/A'}</li>
      <li><strong>Status:</strong> ${stock.status}</li>
      <li><strong>Notes:</strong> ${stock.notes || ''}</li>
    </ul>
  `;
}

/**
 * Fire-and-forget stock update emails (Laravel job parity).
 */
export async function sendStockUpdateNotification(stockId) {
  try {
    const stock = await Stock.find(stockId);
    if (!stock) return;

    await stock.loadCar();

    const users = await query(`SELECT email, name FROM users WHERE email IS NOT NULL AND email != ''`);
    if (!users.rows.length) return;

    const transporter = createTransport();
    const html = buildHtml(stock);
    const subject = `[${config.app.name}] Stock updated — ${stock.car?.make || ''} ${stock.car?.model || ''}`;

    for (const user of users.rows) {
      try {
        await transporter.sendMail({
          from: `"${config.mail.fromName}" <${config.mail.from}>`,
          to: user.email,
          subject,
          html,
        });
      } catch (err) {
        console.error(`Failed to email ${user.email}:`, err.message);
      }
    }
  } catch (err) {
    console.error('sendStockUpdateNotification failed:', err.message);
    throw err;
  }
}

export function dispatchStockUpdateNotification(stockId) {
  setImmediate(() => {
    sendStockUpdateNotification(stockId).catch((err) => {
      console.error('Stock notification job failed:', err.message);
    });
  });
}

export default { sendStockUpdateNotification, dispatchStockUpdateNotification };
