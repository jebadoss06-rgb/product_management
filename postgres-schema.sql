-- PMS Pro (Product Management System) - PostgreSQL Schema
-- This schema is designed to match the frontend data model in app.js.
-- Run: psql -f postgres-schema.sql

BEGIN;

-- 1) Employees
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  dept VARCHAR(100),
  role VARCHAR(100),
  email VARCHAR(200),
  phone VARCHAR(30),
  blood VARCHAR(5),
  status VARCHAR(10) NOT NULL CHECK (status IN ('Active','Inactive')),
  join_date DATE,
  resign_date DATE,
  address TEXT
);

-- 2) Categories
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 3) Products
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  brand VARCHAR(100),
  serial VARCHAR(100),
  purchase_date DATE,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('Available','Assigned','Damaged','Repair','Replaced'))
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 4) Assignments
-- Notes:
-- - Backend currently uses denormalized fields to power UI/history.
-- - Frontend supports assignment bundles (productIds array). To support that
--   without breaking backend CRUD, we store bundle IDs in product_ids (JSONB).
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON UPDATE CASCADE ON DELETE RESTRICT,

  -- Optional bundle support (from frontend productIds array)
  -- When present, it should be an array of product IDs.
  product_ids JSONB,

  -- denormalized for UI/history
  product_code VARCHAR(30) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  employee_name VARCHAR(200) NOT NULL,
  employee_dept VARCHAR(100),

  assigned_date DATE NOT NULL,
  return_date DATE
);

CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_product_id ON assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_date ON assignments(assigned_date);

-- 5) Damage Reports
CREATE TABLE IF NOT EXISTS damages (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,

  -- denormalized for UI
  product_code VARCHAR(30) NOT NULL,
  product_name VARCHAR(200) NOT NULL,

  date_reported DATE NOT NULL,
  reported_by VARCHAR(200) NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_damages_product_id ON damages(product_id);
CREATE INDEX IF NOT EXISTS idx_damages_date_reported ON damages(date_reported);

-- 6) Repair Tracking
CREATE TABLE IF NOT EXISTS repairs (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,

  -- denormalized for UI
  product_code VARCHAR(30) NOT NULL,
  product_name VARCHAR(200) NOT NULL,

  center VARCHAR(200),
  contact VARCHAR(50),
  taken_by VARCHAR(200),

  date_sent DATE,
  expected_date DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Pending','In Progress','Completed')),

  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_repairs_product_id ON repairs(product_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);

-- 7) Product History (event log)
CREATE TABLE IF NOT EXISTS history (
  id BIGSERIAL PRIMARY KEY,

  -- optional links (normalized) + denormalized columns for UI
  product_id BIGINT REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL,
  employee_id BIGINT REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,

  product_code VARCHAR(30),
  product_name VARCHAR(200),

  action VARCHAR(30) NOT NULL,
  employee VARCHAR(200),

  event_date DATE NOT NULL,
  return_date DATE,
  notes TEXT
);

-- action values used in frontend app.js:
-- Added, Assigned, Returned, Damaged, Repair, Repaired
-- Postgres does NOT support "ADD CONSTRAINT IF NOT EXISTS".
-- Use DO block to add constraint only if missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'history_action_check'
  ) THEN
    ALTER TABLE history
      ADD CONSTRAINT history_action_check
      CHECK (action IN ('Added','Assigned','Returned','Damaged','Repair','Repaired'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_history_product_code ON history(product_code);
CREATE INDEX IF NOT EXISTS idx_history_event_date ON history(event_date);

-- 8) CamelCase compatibility views (optional)
-- These views help if any code expects frontend-style keys.

CREATE OR REPLACE VIEW v_employees AS
SELECT
  id,
  code,
  name,
  dept,
  role,
  email,
  phone,
  blood,
  status,
  join_date AS "joinDate",
  resign_date AS "resignDate",
  address
FROM employees;

CREATE OR REPLACE VIEW v_products AS
SELECT
  p.id,
  p.code,
  p.name,
  c.name AS "cat",
  NULLIF(p.category_id::text, '') AS "_categoryIdText",
  p.brand,
  p.serial,
  p.purchase_date AS "purchaseDate",
  p.qty,
  p.status,
  NULL::text AS "subCat" 
FROM products p
JOIN categories c ON c.id = p.category_id;

CREATE OR REPLACE VIEW v_assignments AS
SELECT
  a.id,
  a.product_id AS "productId",
  a.product_name AS "productName",
  a.product_code AS "productCode",
  a.employee_id AS "employeeId",
  a.employee_name AS "employeeName",
  a.employee_dept AS dept,
  a.assigned_date AS "assignedDate",
  a.return_date AS "returnDate",
  COALESCE(a.product_ids, to_jsonb(ARRAY[a.product_id])) AS productIds,
  -- units is derived length; if product_ids present, use its length
  CASE
    WHEN a.product_ids IS NULL THEN 1
    ELSE COALESCE(jsonb_array_length(a.product_ids), 1)
  END::int AS units
FROM assignments a;

CREATE OR REPLACE VIEW v_damages AS
SELECT
  d.id,
  d.product_id AS "productId",
  d.product_code AS "productCode",
  d.product_name AS "productName",
  d.date_reported AS date,
  d.reported_by AS by,
  d.notes,
  -- backend doesn't store damage-vs-replaced as a column; it is represented by status changes.
  'Damaged'::text AS status
FROM damages d;

CREATE OR REPLACE VIEW v_repairs AS
SELECT
  r.id,
  r.product_id AS "productId",
  r.product_code AS "productCode",
  r.product_name AS "productName",
  r.center,
  r.contact,
  r.taken_by AS "takenBy",
  r.date_sent AS "dateSent",
  r.expected_date AS "expectedDate",
  r.status,
  r.notes
FROM repairs r;

CREATE OR REPLACE VIEW v_history AS
SELECT
  h.id,
  h.product_code AS "productCode",
  h.product_name AS "productName",
  h.action,
  h.employee,
  h.event_date AS date,
  h.return_date AS "returnDate",
  h.notes
FROM history h;

COMMIT;

