import bcrypt from 'bcryptjs';
import config from '../src/config/index.js';
import { pool, query } from '../src/db/pool.js';

async function seed() {
  const adminHash = await bcrypt.hash('admin123', config.bcryptRounds);
  const userHash = await bcrypt.hash('user123', config.bcryptRounds);

  await query(
    `INSERT INTO users (name, username, email, password, role, created_at, updated_at)
     VALUES
       ($1, $2, $3, $4, 'admin', NOW(), NOW()),
       ($5, $6, $7, $8, 'user', NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [
      'Admin User',
      'admin',
      'admin@carselling.com',
      adminHash,
      'John Doe',
      'user',
      'user@carselling.com',
      userHash,
    ]
  );

  const existingCats = await query(`SELECT id, name FROM categories LIMIT 1`);
  if (!existingCats.rows.length) {
    const catResult = await query(
      `INSERT INTO categories (name, status, short_des, created_at, updated_at)
       VALUES
         ('Sedan', 'active', 'Sedan cars', NOW(), NOW()),
         ('SUV', 'active', 'SUV cars', NOW(), NOW()),
         ('Hatchback', 'active', 'Hatchback cars', NOW(), NOW())
       RETURNING id, name`
    );
    const sedanId = catResult.rows.find((c) => c.name === 'Sedan')?.id;

    const existingCars = await query(`SELECT id FROM cars LIMIT 1`);
    if (sedanId && !existingCars.rows.length) {
      await query(
        `INSERT INTO cars (
           category_id, make, model, year, price_amount, price_currency, status,
           transmission, fuel, color, created_at, updated_at
         ) VALUES
           ($1, 'Toyota', 'Corolla', 2020, 15000, 'USD', 'available', 'Automatic', 'Petrol', 'White', NOW(), NOW()),
           ($1, 'Honda', 'Civic', 2019, 14000, 'USD', 'available', 'Automatic', 'Petrol', 'Black', NOW(), NOW())`,
        [sedanId]
      );
    }
  }

  console.log('Seed complete.');
  console.log('Admin: admin / admin123');
  console.log('User:  user / user123');
  await pool.end();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await pool.end();
  process.exit(1);
});
