const mysql = require('mysql2/promise');
require('dotenv').config();

//MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'book_library',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4'
});

module.exports = pool;