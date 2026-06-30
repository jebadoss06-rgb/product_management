# PMS Pro Backend + Postgres Setup

## 1) Node.js backend

### Install deps
```bash
cd f:/product_management
npm install
```

### Create env file
Copy:
- `f:/product_management/.env.example`  ->  `f:/product_management/.env`

(Checks to ensure env vars match your requirement: DB name `oppo`, password `sundarmd`)

### Run server
```bash
npm run dev
```
Server health:
- `http://localhost:3000/health`

APIs currently included:
- `GET/POST/PUT/DELETE /api/employees`
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/products`

> CORS enabled, JSON body supported.

## 2) PostgreSQL

### Create DB + set postgres password
Run the SQL file:
- `f:/product_management/setup-postgres.sql`

Run using superuser (often via pgAdmin SQL tool):
- DB name: `oppo`
- user: existing `postgres`
- password: `sundarmd`

### Create tables
Apply schema:
- `f:/product_management/postgres-schema.sql`

Command (example):
```bash
psql -U postgres -d oppo -f postgres-schema.sql
```

### Verify
```sql
\dt
```
(should show employees/categories/products/assignments/damages/repairs/history)

