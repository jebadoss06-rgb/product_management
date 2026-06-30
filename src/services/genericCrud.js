function buildWhere({ where, q, searchColumns }) {
  const clauses = [];
  const values = [];
  let idx = 1;

  if (where) {
    for (const [k, v] of Object.entries(where)) {
      if (v === undefined || v === null || v === '') continue;
      clauses.push(`${k} = $${idx++}`);
      values.push(v);
    }
  }

  if (q && Array.isArray(searchColumns) && searchColumns.length) {
    const qLike = `%${String(q).toLowerCase()}%`;
    const parts = searchColumns.map((col) => `LOWER(${col}::text) LIKE $${idx++}`);
    clauses.push(`(${parts.join(' OR ')})`);
    values.push(...searchColumns.map(() => qLike));
  }

  return clauses.length ? { sql: `WHERE ${clauses.join(' AND ')}`, values } : { sql: '', values };
}

async function getAll(pool, table, { where, q, searchColumns, orderBy }) {
  const { sql, values } = buildWhere({ where, q, searchColumns });
  const order = orderBy ? `ORDER BY ${orderBy}` : '';
  const text = `SELECT * FROM ${table} ${sql} ${order}`;
  const { rows } = await pool.query(text, values);
  return rows;
}

function pickColumns(payload) {
  const keys = Object.keys(payload || {}).filter((k) => payload[k] !== undefined);
  return keys;
}

async function createOne(pool, table, payload) {
  const cols = pickColumns(payload);
  if (!cols.length) {
    throw new Error('No fields provided');
  }

  const values = cols.map((c) => payload[c]);
  const params = cols.map((_, i) => `$${i + 1}`);

  const text = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${params.join(',')}) RETURNING *`;
  const { rows } = await pool.query(text, values);
  return rows[0];
}

async function updateOne(pool, table, id, payload) {
  const cols = pickColumns(payload);
  if (!cols.length) {
    throw new Error('No fields provided');
  }

  const values = cols.map((c) => payload[c]);
  const set = cols.map((c, i) => `${c} = $${i + 1}`).join(',');
  values.push(Number(id));

  const text = `UPDATE ${table} SET ${set} WHERE id = $${cols.length + 1} RETURNING *`;
  const { rows } = await pool.query(text, values);
  return rows[0];
}

async function deleteOne(pool, table, id) {
  const text = `DELETE FROM ${table} WHERE id = $1`;
  await pool.query(text, [Number(id)]);
  return true;
}

module.exports = { getAll, createOne, updateOne, deleteOne };

