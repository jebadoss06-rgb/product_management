const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { initDb } = require('./schema');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'product',
  password: process.env.DB_PASSWORD || '9944664986',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// ------------------- API ROUTES -------------------

// 1. Fetch full database state
app.get('/api/db', async (req, res) => {
  try {
    const categoriesRes = await pool.query('SELECT * FROM categories');
    const employeesRes = await pool.query('SELECT * FROM employees');
    const productsRes = await pool.query('SELECT * FROM products');
    const assignmentsRes = await pool.query('SELECT * FROM assignments');
    const damagesRes = await pool.query('SELECT * FROM damages');
    const repairsRes = await pool.query('SELECT * FROM repairs');
    const historyRes = await pool.query('SELECT * FROM history');

    const categories = categoriesRes.rows.map(row => ({
      name: row.name,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const employees = employeesRes.rows.map(row => ({
      ...row,
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const products = productsRes.rows.map(row => ({
      ...row,
      qty: parseInt(row.qty || '0'),
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const assignments = assignmentsRes.rows.map(row => ({
      ...row,
      productIds: typeof row.productIds === 'string' ? JSON.parse(row.productIds) : row.productIds,
      units: parseInt(row.units || '0'),
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const damages = damagesRes.rows.map(row => ({
      ...row,
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const repairs = repairsRes.rows.map(row => ({
      ...row,
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    const history = historyRes.rows.map(row => ({
      ...row,
      updatedAt: parseInt(row.updatedAt || '0')
    }));

    // Dynamic nextId calculation (matching client logic)
    const nextId = {
      emp: employees.length ? Math.max(...employees.map(e => parseInt(e.id) || 0), 0) + 1 : 1,
      prod: products.length ? Math.max(...products.map(p => parseInt(p.id) || 0), 0) + 1 : 1,
      assign: assignments.length ? Math.max(...assignments.map(a => parseInt(a.id) || 0), 0) + 1 : 1,
      dmg: damages.length ? Math.max(...damages.map(d => parseInt(d.id) || 0), 0) + 1 : 1,
      repair: repairs.length ? Math.max(...repairs.map(r => parseInt(r.id) || 0), 0) + 1 : 1,
      history: history.length ? Math.max(...history.map(h => parseInt(h.id) || 0), 0) + 1 : 1
    };

    res.json({
      categories,
      employees,
      products,
      assignments,
      damages,
      repairs,
      history,
      nextId
    });
  } catch (err) {
    console.error('Error fetching database state:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 2. Save Employee
app.post('/api/employees', async (req, res) => {
  const { id, code, name, dept, role, email, phone, blood, status, joinDate, resignDate, address, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO employees (id, code, name, dept, role, email, phone, blood, status, "joinDate", "resignDate", address, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code, name = EXCLUDED.name, dept = EXCLUDED.dept, role = EXCLUDED.role,
         email = EXCLUDED.email, phone = EXCLUDED.phone, blood = EXCLUDED.blood, status = EXCLUDED.status,
         "joinDate" = EXCLUDED."joinDate", "resignDate" = EXCLUDED."resignDate", address = EXCLUDED.address,
         "updatedAt" = EXCLUDED."updatedAt"`,
      [id, code, name, dept, role, email, phone, blood, status, joinDate, resignDate, address, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving employee:', err);
    res.status(500).json({ error: 'Failed to save employee' });
  }
});

// 3. Delete Employee
app.delete('/api/employees/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// 4. Save Category (Insert, Update or Rename)
app.post('/api/categories', async (req, res) => {
  const { name, items, updatedAt, oldName } = req.body;
  try {
    if (oldName && oldName !== name) {
      await pool.query(
        `UPDATE categories SET name = $1, items = $2, "updatedAt" = $3 WHERE name = $4`,
        [name, JSON.stringify(items || []), updatedAt || Date.now(), oldName]
      );
    } else {
      await pool.query(
        `INSERT INTO categories (name, items, "updatedAt")
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET
           items = EXCLUDED.items,
           "updatedAt" = EXCLUDED."updatedAt"`,
         [name, JSON.stringify(items || []), updatedAt || Date.now()]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving category:', err);
    res.status(500).json({ error: 'Failed to save category' });
  }
});

// 5. Delete Category
app.delete('/api/categories/:name', async (req, res) => {
  const name = req.params.name;
  try {
    await pool.query('DELETE FROM categories WHERE name = $1', [name]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// 6. Save Product
app.post('/api/products', async (req, res) => {
  const { id, code, name, cat, subCat, brand, serial, purchaseDate, qty, status, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO products (id, code, name, cat, "subCat", brand, serial, "purchaseDate", qty, status, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code, name = EXCLUDED.name, cat = EXCLUDED.cat, "subCat" = EXCLUDED."subCat",
         brand = EXCLUDED.brand, serial = EXCLUDED.serial, "purchaseDate" = EXCLUDED."purchaseDate",
         qty = EXCLUDED.qty, status = EXCLUDED.status, "updatedAt" = EXCLUDED."updatedAt"`,
      [id, code, name, cat, subCat, brand, serial, purchaseDate, qty, status, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// 7. Delete Product
app.delete('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 8. Save Assignment
app.post('/api/assignments', async (req, res) => {
  const { id, productIds, productId, productName, productCode, employeeId, employeeName, dept, assignedDate, returnDate, units, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO assignments (id, "productIds", "productId", "productName", "productCode", "employeeId", "employeeName", dept, "assignedDate", "returnDate", units, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         "productIds" = EXCLUDED."productIds", "productId" = EXCLUDED."productId", "productName" = EXCLUDED."productName",
         "productCode" = EXCLUDED."productCode", "employeeId" = EXCLUDED."employeeId", "employeeName" = EXCLUDED."employeeName",
         dept = EXCLUDED.dept, "assignedDate" = EXCLUDED."assignedDate", "returnDate" = EXCLUDED."returnDate",
         units = EXCLUDED.units, "updatedAt" = EXCLUDED."updatedAt"`,
      [id, JSON.stringify(productIds || []), productId, productName, productCode, employeeId, employeeName, dept, assignedDate, returnDate, units, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving assignment:', err);
    res.status(500).json({ error: 'Failed to save assignment' });
  }
});

// 9. Delete Assignment
app.delete('/api/assignments/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM assignments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// 10. Save Damage Record
app.post('/api/damages', async (req, res) => {
  const { id, productId, productCode, productName, status, date, by, notes, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO damages (id, "productId", "productCode", "productName", status, date, "by", notes, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         "productId" = EXCLUDED."productId", "productCode" = EXCLUDED."productCode", "productName" = EXCLUDED."productName",
         status = EXCLUDED.status, date = EXCLUDED.date, "by" = EXCLUDED."by", notes = EXCLUDED.notes, "updatedAt" = EXCLUDED."updatedAt"`,
      [id, productId, productCode, productName, status, date, by, notes, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving damage record:', err);
    res.status(500).json({ error: 'Failed to save damage record' });
  }
});

// 11. Delete Damage Record
app.delete('/api/damages/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM damages WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting damage record:', err);
    res.status(500).json({ error: 'Failed to delete damage record' });
  }
});

// 12. Save Repair Record
app.post('/api/repairs', async (req, res) => {
  const { id, productId, productCode, productName, center, contact, takenBy, dateSent, expectedDate, status, notes, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO repairs (id, "productId", "productCode", "productName", center, contact, "takenBy", "dateSent", "expectedDate", status, notes, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         "productId" = EXCLUDED."productId", "productCode" = EXCLUDED."productCode", "productName" = EXCLUDED."productName",
         center = EXCLUDED.center, contact = EXCLUDED.contact, "takenBy" = EXCLUDED."takenBy",
         "dateSent" = EXCLUDED."dateSent", "expectedDate" = EXCLUDED."expectedDate", status = EXCLUDED.status,
         notes = EXCLUDED.notes, "updatedAt" = EXCLUDED."updatedAt"`,
      [id, productId, productCode, productName, center, contact, takenBy, dateSent, expectedDate, status, notes, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving repair record:', err);
    res.status(500).json({ error: 'Failed to save repair record' });
  }
});

// 13. Delete Repair Record
app.delete('/api/repairs/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM repairs WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting repair record:', err);
    res.status(500).json({ error: 'Failed to delete repair record' });
  }
});

// 14. Save History Record
app.post('/api/history', async (req, res) => {
  const { id, productCode, productName, action, employee, date, notes, updatedAt } = req.body;
  try {
    await pool.query(
      `INSERT INTO history (id, "productCode", "productName", action, employee, date, notes, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         "productCode" = EXCLUDED."productCode", "productName" = EXCLUDED."productName", action = EXCLUDED.action,
         employee = EXCLUDED.employee, date = EXCLUDED.date, notes = EXCLUDED.notes, "updatedAt" = EXCLUDED."updatedAt"`,
      [id, productCode, productName, action, employee, date, notes, updatedAt || Date.now()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving history entry:', err);
    res.status(500).json({ error: 'Failed to save history entry' });
  }
});

// 15. Delete History Record
app.delete('/api/history/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await pool.query('DELETE FROM history WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting history entry:', err);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// Serve frontend static files
app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initDb(pool).catch(err => {
    console.error('Failed to initialize database on startup:', err);
  });
});
