const express = require('express');
const cors = require('cors');

const { createPool } = require('./db');
const routes = require('./routes');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = createPool();

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', routes(pool));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`My backend server is running on http://localhost:${port}`);
});

