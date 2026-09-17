-- Consolidated PostgreSQL schema for Car Management (Laravel parity)
-- Run via: npm run db:migrate

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  remember_token VARCHAR(100) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  email VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  payload TEXT NOT NULL,
  last_activity INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions (last_activity);

-- Sanctum-compatible tokens
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id BIGSERIAL PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  abilities TEXT NULL,
  last_used_at TIMESTAMPTZ NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_index
  ON personal_access_tokens (tokenable_type, tokenable_id);

-- Categories (self-referencing)
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NULL,
  parent_category_id BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  short_des VARCHAR(500) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Cars
CREATE TABLE IF NOT EXISTS cars (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id BIGINT NULL REFERENCES categories(id) ON DELETE SET NULL,
  ref_no VARCHAR(32) NULL UNIQUE,
  code VARCHAR(50) NULL,
  make VARCHAR(64) NOT NULL,
  model VARCHAR(64) NOT NULL,
  model_code VARCHAR(32) NULL,
  variant VARCHAR(128) NULL,
  year SMALLINT NOT NULL,
  reg_year_month CHAR(7) NULL,
  mileage_km INTEGER NULL,
  engine_cc INTEGER NULL,
  transmission VARCHAR(32) NULL,
  drive VARCHAR(32) NULL,
  steering VARCHAR(16) NULL,
  fuel VARCHAR(32) NULL,
  color VARCHAR(64) NULL,
  seats SMALLINT NULL,
  grade_overall VARCHAR(32) NULL,
  grade_exterior CHAR(1) NULL,
  grade_interior CHAR(1) NULL,
  price_amount NUMERIC(12, 2) NULL,
  price_currency CHAR(3) NOT NULL DEFAULT 'USD',
  price_basis VARCHAR(32) NULL,
  fob_value_usd NUMERIC(12, 2) NULL,
  freight_usd NUMERIC(12, 2) NULL,
  chassis_no_masked VARCHAR(32) NULL,
  chassis_no_full VARCHAR(64) NULL UNIQUE,
  location VARCHAR(128) NULL,
  country_origin VARCHAR(64) NULL,
  status VARCHAR(32) NULL DEFAULT 'available',
  package VARCHAR(255) NULL,
  body VARCHAR(64) NULL,
  type VARCHAR(64) NULL,
  engine_number VARCHAR(64) NULL,
  number_of_keys INTEGER NULL,
  keys_feature VARCHAR(255) NULL,
  notes TEXT NULL,
  attached_file VARCHAR(512) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS car_photos (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  url VARCHAR(512) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS car_photos_car_primary_index ON car_photos (car_id, is_primary);

CREATE TABLE IF NOT EXISTS car_details (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  short_title VARCHAR(255) NULL,
  full_title VARCHAR(255) NULL,
  description TEXT NULL,
  images TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS car_sub_details (
  id BIGSERIAL PRIMARY KEY,
  car_detail_id BIGINT NOT NULL REFERENCES car_details(id) ON DELETE CASCADE,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Stocks
CREATE TABLE IF NOT EXISTS stocks (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10, 2) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'available'
    CHECK (status IN (
      'pending', 'available', 'sold', 'reserved',
      'in_transit', 'preorder', 'damaged', 'lost', 'stolen'
    )),
  notes VARCHAR(1000) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  shipping_address VARCHAR(500) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'shipped', 'delivered', 'canceled')),
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Unused in Laravel but present for parity
CREATE TABLE IF NOT EXISTS po_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NULL REFERENCES orders(id) ON DELETE CASCADE,
  car_id BIGINT NULL REFERENCES cars(id) ON DELETE CASCADE,
  quantity INTEGER NULL,
  price NUMERIC(12, 2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Purchase history (many-to-many cars via pivot; no car_id column — matches final Laravel schema)
CREATE TABLE IF NOT EXISTS purchase_history (
  id BIGSERIAL PRIMARY KEY,
  purchase_date DATE NULL,
  purchase_amount NUMERIC(15, 2) NULL,
  govt_duty VARCHAR(255) NULL,
  cnf_amount NUMERIC(15, 2) NULL,
  miscellaneous VARCHAR(255) NULL,
  hs_code VARCHAR(64) NULL,
  price_amount NUMERIC(15, 2) NULL,
  price_basis VARCHAR(64) NULL,
  fob_value_usd NUMERIC(15, 2) NULL,
  freight_usd NUMERIC(15, 2) NULL,
  bid_price NUMERIC(15, 2) NULL,
  ser_com NUMERIC(15, 2) NULL,
  foreign_amount NUMERIC(15, 2) NULL,
  bdt_amount NUMERIC(15, 2) NULL,
  currency_type VARCHAR(16) NULL CHECK (currency_type IS NULL OR currency_type IN ('dollar', 'yen')),
  lc_date DATE NULL,
  lc_number VARCHAR(255) NULL,
  lc_bank_name VARCHAR(255) NULL,
  lc_bank_branch_name VARCHAR(255) NULL,
  lc_bank_branch_address VARCHAR(255) NULL,
  total_units_per_lc VARCHAR(255) NULL,
  bill_of_lading VARCHAR(255) NULL,
  invoice_number VARCHAR(255) NULL,
  export_certificate VARCHAR(255) NULL,
  export_certificate_translated VARCHAR(255) NULL,
  bill_of_exchange_amount VARCHAR(255) NULL,
  custom_duty_copy_3pages VARCHAR(255) NULL,
  cheque_copy VARCHAR(255) NULL,
  certificate VARCHAR(255) NULL,
  custom_one VARCHAR(255) NULL,
  custom_two VARCHAR(255) NULL,
  custom_three VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS car_purchase_history (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  purchase_history_id BIGINT NOT NULL REFERENCES purchase_history(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Payment history
CREATE TABLE IF NOT EXISTS payment_history (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NULL REFERENCES cars(id) ON DELETE SET NULL,
  showroom_name VARCHAR(255) NULL,
  wholesaler_address VARCHAR(255) NULL,
  purchase_amount NUMERIC(15, 2) NULL,
  purchase_date DATE NULL,
  customer_name VARCHAR(255) NULL,
  nid_number VARCHAR(255) NULL,
  tin_certificate VARCHAR(255) NULL,
  customer_address VARCHAR(255) NULL,
  contact_number VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS installments (
  id BIGSERIAL PRIMARY KEY,
  payment_history_id BIGINT NOT NULL REFERENCES payment_history(id) ON DELETE CASCADE,
  installment_date DATE NULL,
  description VARCHAR(255) NULL,
  amount NUMERIC(15, 2) NULL,
  payment_method VARCHAR(16) NULL CHECK (payment_method IS NULL OR payment_method IN ('Bank', 'Cash')),
  bank_name VARCHAR(255) NULL,
  cheque_number VARCHAR(255) NULL,
  balance NUMERIC(15, 2) NULL,
  remarks VARCHAR(255) NULL,
  status VARCHAR(32) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

-- Queue / cache / jobs (optional Laravel parity tables)
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  queue VARCHAR(255) NOT NULL,
  payload TEXT NOT NULL,
  attempts SMALLINT NOT NULL,
  reserved_at INTEGER NULL,
  available_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS jobs_queue_index ON jobs (queue);

CREATE TABLE IF NOT EXISTS job_batches (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_jobs INTEGER NOT NULL,
  pending_jobs INTEGER NOT NULL,
  failed_jobs INTEGER NOT NULL,
  failed_job_ids TEXT NOT NULL,
  options TEXT NULL,
  cancelled_at INTEGER NULL,
  created_at INTEGER NOT NULL,
  finished_at INTEGER NULL
);

CREATE TABLE IF NOT EXISTS failed_jobs (
  id BIGSERIAL PRIMARY KEY,
  uuid VARCHAR(255) NOT NULL UNIQUE,
  connection TEXT NOT NULL,
  queue TEXT NOT NULL,
  payload TEXT NOT NULL,
  exception TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  expiration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
  key VARCHAR(255) PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  expiration INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
