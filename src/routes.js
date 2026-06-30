const express = require('express');
const { getAll, createOne, updateOne, deleteOne } = require('./services/genericCrud');

const routerFactory = (pool) => {
  const router = express.Router();

  // -------- Employees --------
  router.get('/employees', async (req, res) => {
    const { q, status } = req.query;
    const rows = await getAll(pool, 'employees', {
      where: {
        ...(status ? { status } : {}),
      },
      searchColumns: ['code', 'name', 'dept', 'role', 'email', 'blood'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/employees', async (req, res) => {
    const row = await createOne(pool, 'employees', req.body);
    res.status(201).json(row);
  });

  router.put('/employees/:id', async (req, res) => {
    const row = await updateOne(pool, 'employees', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/employees/:id', async (req, res) => {
    await deleteOne(pool, 'employees', req.params.id);
    res.json({ ok: true });
  });

  // -------- Categories --------
  router.get('/categories', async (req, res) => {
    const { q } = req.query;
    const rows = await getAll(pool, 'categories', {
      where: {},
      searchColumns: ['name'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/categories', async (req, res) => {
    const row = await createOne(pool, 'categories', {
      name: req.body.name
    });
    res.status(201).json(row);
  });

  router.put('/categories/:id', async (req, res) => {
    const row = await updateOne(pool, 'categories', req.params.id, { name: req.body.name });
    res.json(row);
  });

  router.delete('/categories/:id', async (req, res) => {
    await deleteOne(pool, 'categories', req.params.id);
    res.json({ ok: true });
  });

  // -------- Products --------
  router.get('/products', async (req, res) => {
    const { q, status, categoryId } = req.query;
    const rows = await getAll(pool, 'products', {
      where: {
        ...(status ? { status } : {}),
        ...(categoryId ? { category_id: Number(categoryId) } : {})
      },
      searchColumns: ['code', 'name', 'brand', 'serial'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/products', async (req, res) => {
    const row = await createOne(pool, 'products', req.body);
    res.status(201).json(row);
  });

  router.put('/products/:id', async (req, res) => {
    const row = await updateOne(pool, 'products', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/products/:id', async (req, res) => {
    await deleteOne(pool, 'products', req.params.id);
    res.json({ ok: true });
  });

  // -------- Assignments --------
  router.get('/assignments', async (req, res) => {
    const { q } = req.query;
    const rows = await getAll(pool, 'assignments', {
      where: {},
      searchColumns: ['product_code', 'product_name', 'employee_name', 'employee_dept'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/assignments', async (req, res) => {
    const row = await createOne(pool, 'assignments', req.body);
    res.status(201).json(row);
  });

  router.put('/assignments/:id', async (req, res) => {
    const row = await updateOne(pool, 'assignments', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/assignments/:id', async (req, res) => {
    await deleteOne(pool, 'assignments', req.params.id);
    res.json({ ok: true });
  });

  // -------- Damages --------
  router.get('/damages', async (req, res) => {
    const { q } = req.query;
    const rows = await getAll(pool, 'damages', {
      where: {},
      searchColumns: ['product_code', 'product_name', 'reported_by', 'notes'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/damages', async (req, res) => {
    const row = await createOne(pool, 'damages', req.body);
    res.status(201).json(row);
  });

  router.put('/damages/:id', async (req, res) => {
    const row = await updateOne(pool, 'damages', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/damages/:id', async (req, res) => {
    await deleteOne(pool, 'damages', req.params.id);
    res.json({ ok: true });
  });

  // -------- Repairs --------
  router.get('/repairs', async (req, res) => {
    const { q } = req.query;
    const rows = await getAll(pool, 'repairs', {
      where: {},
      searchColumns: ['product_code', 'product_name', 'center', 'taken_by', 'status', 'notes'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/repairs', async (req, res) => {
    const row = await createOne(pool, 'repairs', req.body);
    res.status(201).json(row);
  });

  router.put('/repairs/:id', async (req, res) => {
    const row = await updateOne(pool, 'repairs', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/repairs/:id', async (req, res) => {
    await deleteOne(pool, 'repairs', req.params.id);
    res.json({ ok: true });
  });

  // -------- History --------
  router.get('/history', async (req, res) => {
    const { q } = req.query;
    const rows = await getAll(pool, 'history', {
      where: {},
      searchColumns: ['product_code', 'product_name', 'action', 'employee', 'notes'],
      q,
      orderBy: 'id DESC'
    });
    res.json(rows);
  });

  router.post('/history', async (req, res) => {
    const row = await createOne(pool, 'history', req.body);
    res.status(201).json(row);
  });

  router.put('/history/:id', async (req, res) => {
    const row = await updateOne(pool, 'history', req.params.id, req.body);
    res.json(row);
  });

  router.delete('/history/:id', async (req, res) => {
    await deleteOne(pool, 'history', req.params.id);
    res.json({ ok: true });
  });

  return router;
};

module.exports = routerFactory;


