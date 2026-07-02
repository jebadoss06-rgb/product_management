async function initDb(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        name VARCHAR PRIMARY KEY,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        "updatedAt" BIGINT
      )
    `);

    // 2. Employees Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT PRIMARY KEY,
        code VARCHAR UNIQUE,
        name VARCHAR,
        dept VARCHAR,
        role VARCHAR,
        email VARCHAR,
        phone VARCHAR,
        blood VARCHAR,
        status VARCHAR,
        "joinDate" VARCHAR,
        "resignDate" VARCHAR,
        address TEXT,
        "updatedAt" BIGINT
      )
    `);

    // 3. Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        code VARCHAR UNIQUE,
        name VARCHAR,
        cat VARCHAR REFERENCES categories(name) ON DELETE SET NULL ON UPDATE CASCADE,
        "subCat" VARCHAR,
        brand VARCHAR,
        serial VARCHAR,
        "purchaseDate" VARCHAR,
        qty INT,
        status VARCHAR,
        "updatedAt" BIGINT
      )
    `);

    // 4. Assignments Table (matches exact app.js keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT PRIMARY KEY,
        "productIds" JSONB,
        "productId" INT REFERENCES products(id) ON DELETE CASCADE,
        "productName" VARCHAR,
        "productCode" VARCHAR,
        "employeeId" INT REFERENCES employees(id) ON DELETE CASCADE,
        "employeeName" VARCHAR,
        dept VARCHAR,
        "assignedDate" VARCHAR,
        "returnDate" VARCHAR,
        units INT,
        "updatedAt" BIGINT
      )
    `);

    // 5. Damages Table (matches exact app.js keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS damages (
        id INT PRIMARY KEY,
        "productId" INT REFERENCES products(id) ON DELETE CASCADE,
        "productCode" VARCHAR,
        "productName" VARCHAR,
        status VARCHAR,
        date VARCHAR,
        "by" VARCHAR,
        notes TEXT,
        "updatedAt" BIGINT
      )
    `);

    // 6. Repairs Table (matches exact app.js keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS repairs (
        id INT PRIMARY KEY,
        "productId" INT REFERENCES products(id) ON DELETE CASCADE,
        "productCode" VARCHAR,
        "productName" VARCHAR,
        center VARCHAR,
        contact VARCHAR,
        "takenBy" VARCHAR,
        "dateSent" VARCHAR,
        "expectedDate" VARCHAR,
        status VARCHAR,
        notes TEXT,
        "updatedAt" BIGINT
      )
    `);

    // 7. History Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS history (
        id INT PRIMARY KEY,
        "productCode" VARCHAR,
        "productName" VARCHAR,
        action VARCHAR,
        employee VARCHAR,
        date VARCHAR,
        notes TEXT,
        "updatedAt" BIGINT
      )
    `);

    await client.query('COMMIT');
    console.log('Database tables verified/created successfully.');

    // Seed database if categories table is empty
    const catCheck = await client.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCheck.rows[0].count) === 0) {
      console.log('Database is empty. Seeding baseline test data...');
      await seedDatabase(client);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function seedDatabase(client) {
  // Categories seed
  const categories = [
    { name: "Computer", items: ["Mouse", "CPU", "Keyboard", "Monitor"], updatedAt: Date.now() - 5000 },
    { name: "Accessories", items: ["Webcam", "Headset", "USB Hub", "Speaker"], updatedAt: Date.now() - 4000 },
    { name: "Furniture", items: ["Chair", "Desk"], updatedAt: Date.now() - 3000 }
  ];
  for (let cat of categories) {
    await client.query(
      `INSERT INTO categories (name, items, "updatedAt") VALUES ($1, $2, $3)`,
      [cat.name, JSON.stringify(cat.items), cat.updatedAt]
    );
  }

  // Employees seed
  const employees = [
    {
      id: 1,
      code: "EMP001",
      name: "Jeba Doss",
      dept: "Engineering",
      role: "Developer",
      email: "jeba.doss@example.com",
      phone: "9876543210",
      blood: "O+",
      status: "Active",
      joinDate: "2025-01-15",
      resignDate: "",
      address: "Chennai, Tamil Nadu",
      updatedAt: Date.now() - 5000
    },
    {
      id: 2,
      code: "EMP002",
      name: "Ravi Kumar",
      dept: "Design",
      role: "UI Designer",
      email: "ravi.kumar@example.com",
      phone: "9876543211",
      blood: "A+",
      status: "Active",
      joinDate: "2025-03-10",
      resignDate: "",
      address: "Coimbatore, Tamil Nadu",
      updatedAt: Date.now() - 4000
    }
  ];
  for (let emp of employees) {
    await client.query(
      `INSERT INTO employees (id, code, name, dept, role, email, phone, blood, status, "joinDate", "resignDate", address, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [emp.id, emp.code, emp.name, emp.dept, emp.role, emp.email, emp.phone, emp.blood, emp.status, emp.joinDate, emp.resignDate, emp.address, emp.updatedAt]
    );
  }

  // Products seed
  const products = [
    {
      id: 1,
      code: "PRD001",
      name: "Logitech G502 Mouse",
      cat: "Computer",
      subCat: "Mouse",
      brand: "Logitech",
      serial: "S/N 12345",
      purchaseDate: "2025-02-01",
      qty: 1,
      status: "Available",
      updatedAt: Date.now() - 5000
    },
    {
      id: 2,
      code: "PRD002",
      name: "Intel Core i9 CPU Tower",
      cat: "Computer",
      subCat: "CPU",
      brand: "Intel",
      serial: "S/N 54321",
      purchaseDate: "2025-02-01",
      qty: 1,
      status: "Available",
      updatedAt: Date.now() - 4500
    },
    {
      id: 3,
      code: "PRD003",
      name: "Keychron K2 Keyboard",
      cat: "Computer",
      subCat: "Keyboard",
      brand: "Keychron",
      serial: "S/N 98765",
      purchaseDate: "2025-02-01",
      qty: 1,
      status: "Available",
      updatedAt: Date.now() - 4000
    },
    {
      id: 4,
      code: "PRD004",
      name: "Dell UltraSharp 27 Monitor",
      cat: "Computer",
      subCat: "Monitor",
      brand: "Dell",
      serial: "S/N 56789",
      purchaseDate: "2025-02-01",
      qty: 1,
      status: "Available",
      updatedAt: Date.now() - 3500
    },
    {
      id: 5,
      code: "PRD005",
      name: "Logitech C922 Webcam",
      cat: "Accessories",
      subCat: "Webcam",
      brand: "Logitech",
      serial: "S/N 87654",
      purchaseDate: "2025-03-01",
      qty: 1,
      status: "Available",
      updatedAt: Date.now() - 3000
    }
  ];
  for (let prod of products) {
    await client.query(
      `INSERT INTO products (id, code, name, cat, "subCat", brand, serial, "purchaseDate", qty, status, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [prod.id, prod.code, prod.name, prod.cat, prod.subCat, prod.brand, prod.serial, prod.purchaseDate, prod.qty, prod.status, prod.updatedAt]
    );
  }

  // History seed
  const history = [
    { id: 1, productCode: "PRD001", productName: "Logitech G502 Mouse", action: "Added", employee: "—", date: "2025-02-01", notes: "Product added to inventory", updatedAt: Date.now() - 5000 },
    { id: 2, productCode: "PRD002", productName: "Intel Core i9 CPU Tower", action: "Added", employee: "—", date: "2025-02-01", notes: "Product added to inventory", updatedAt: Date.now() - 4500 },
    { id: 3, productCode: "PRD003", productName: "Keychron K2 Keyboard", action: "Added", employee: "—", date: "2025-02-01", notes: "Product added to inventory", updatedAt: Date.now() - 4000 },
    { id: 4, productCode: "PRD004", productName: "Dell UltraSharp 27 Monitor", action: "Added", employee: "—", date: "2025-02-01", notes: "Product added to inventory", updatedAt: Date.now() - 3500 },
    { id: 5, productCode: "PRD005", productName: "Logitech C922 Webcam", action: "Added", employee: "—", date: "2025-03-01", notes: "Product added to inventory", updatedAt: Date.now() - 3000 }
  ];
  for (let hist of history) {
    await client.query(
      `INSERT INTO history (id, "productCode", "productName", action, employee, date, notes, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [hist.id, hist.productCode, hist.productName, hist.action, hist.employee, hist.date, hist.notes, hist.updatedAt]
    );
  }

  console.log('Seeding completed successfully.');
}

module.exports = { initDb };
