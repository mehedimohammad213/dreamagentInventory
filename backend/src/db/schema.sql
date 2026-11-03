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
  role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'accountant')),
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

-- Per-car share of an LC/purchase batch (multi-car allocation)
ALTER TABLE car_purchase_history
  ADD COLUMN IF NOT EXISTS allocated_cost NUMERIC(15, 2) NULL;

CREATE INDEX IF NOT EXISTS car_purchase_history_purchase_id_index
  ON car_purchase_history (purchase_history_id);

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

-- ─── Accounting: Bank / Cash accounts ────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NULL,
  branch_name VARCHAR(255) NULL,
  account_number VARCHAR(64) NULL,
  account_type VARCHAR(16) NOT NULL DEFAULT 'bank'
    CHECK (account_type IN ('bank', 'cash')),
  currency CHAR(3) NOT NULL DEFAULT 'BDT',
  opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  opening_balance_date DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS bank_accounts_type_index ON bank_accounts (account_type);
CREATE INDEX IF NOT EXISTS bank_accounts_active_index ON bank_accounts (is_active);

CREATE TABLE IF NOT EXISTS bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  bank_account_id BIGINT NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(16) NOT NULL CHECK (type IN ('in', 'out', 'transfer')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  reference VARCHAR(255) NULL,
  notes TEXT NULL,
  source_type VARCHAR(32) NULL,
  source_id BIGINT NULL,
  related_account_id BIGINT NULL REFERENCES bank_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS bank_transactions_account_date_index
  ON bank_transactions (bank_account_id, txn_date);
CREATE INDEX IF NOT EXISTS bank_transactions_source_index
  ON bank_transactions (source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_source_unique
  ON bank_transactions (source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL;

-- Link installments to bank/cash accounts (safe on existing DBs)
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS bank_account_id BIGINT NULL REFERENCES bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS installments_bank_account_id_index
  ON installments (bank_account_id);

-- Operating expenses (other costs)
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(64) NOT NULL DEFAULT 'other',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NULL,
  bank_account_id BIGINT NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  payment_method VARCHAR(16) NULL CHECK (payment_method IS NULL OR payment_method IN ('Bank', 'Cash')),
  reference VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS expenses_date_index ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS expenses_category_index ON expenses (category);
CREATE INDEX IF NOT EXISTS expenses_bank_account_id_index ON expenses (bank_account_id);

-- Per-car extra costs (repair, transport, reconditioning, etc.)
CREATE TABLE IF NOT EXISTS car_extra_costs (
  id BIGSERIAL PRIMARY KEY,
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(64) NOT NULL DEFAULT 'other',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NULL,
  bank_account_id BIGINT NULL REFERENCES bank_accounts(id) ON DELETE SET NULL,
  payment_method VARCHAR(16) NULL CHECK (payment_method IS NULL OR payment_method IN ('Bank', 'Cash')),
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS car_extra_costs_car_id_index ON car_extra_costs (car_id);
CREATE INDEX IF NOT EXISTS car_extra_costs_date_index ON car_extra_costs (cost_date);

-- Supplier / purchase payments (pay LC, duty, CNF, exporter from Bank/Cash)
CREATE TABLE IF NOT EXISTS supplier_payments (
  id BIGSERIAL PRIMARY KEY,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category VARCHAR(64) NOT NULL DEFAULT 'other',
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NULL,
  supplier_name VARCHAR(255) NULL,
  purchase_history_id BIGINT NULL REFERENCES purchase_history(id) ON DELETE SET NULL,
  car_id BIGINT NULL REFERENCES cars(id) ON DELETE SET NULL,
  bank_account_id BIGINT NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
  payment_method VARCHAR(16) NULL CHECK (payment_method IS NULL OR payment_method IN ('Bank', 'Cash')),
  reference VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS supplier_payments_date_index ON supplier_payments (payment_date);
CREATE INDEX IF NOT EXISTS supplier_payments_purchase_index ON supplier_payments (purchase_history_id);
CREATE INDEX IF NOT EXISTS supplier_payments_bank_account_index ON supplier_payments (bank_account_id);

-- Allow accountant role on existing DBs
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'accountant'));

-- Cheque status on installments
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS cheque_status VARCHAR(16) NULL
    CHECK (cheque_status IS NULL OR cheque_status IN ('pending', 'cleared', 'bounced'));

-- Accounting period lock (YYYY-MM)
CREATE TABLE IF NOT EXISTS accounting_periods (
  id BIGSERIAL PRIMARY KEY,
  year_month CHAR(7) NOT NULL UNIQUE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at TIMESTAMPTZ NULL,
  locked_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS accounting_periods_locked_index ON accounting_periods (is_locked);

-- Audit trail for finance mutations
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(32) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id BIGINT NULL,
  summary VARCHAR(500) NULL,
  before_data JSONB NULL,
  after_data JSONB NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_index ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_index ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_index ON audit_logs (created_at DESC);

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
