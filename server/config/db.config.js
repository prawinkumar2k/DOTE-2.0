const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Production-grade MySQL connection pool with retry logic.
 * In Docker, the MySQL container may take 30-60s to initialize on first run.
 * This module retries the connection up to MAX_RETRIES before giving up.
 */

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'admission_dote',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 20,
  queueLimit: 0,
  connectTimeout: 30000,
  // Gracefully handle idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

const pool = mysql.createPool(poolConfig);

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 5000;

const connectWithRetry = async (attempt = 1) => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Database connected successfully (attempt ${attempt})`);
    connection.release();
  } catch (err) {
    console.error(
      `❌ Database connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`
    );
    if (attempt < MAX_RETRIES) {
      console.log(`   ⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectWithRetry(attempt + 1);
    }
    console.error('💀 Max retries reached. Could not connect to database.');
    process.exit(1);
  }
};

connectWithRetry();

module.exports = pool;
