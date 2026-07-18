import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Platform DB konteynerinin portu 5433'tü (docker ps'ten gördük)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://jira:jira@localhost:5433/jira"
});

async function runQuery() {
  const client = await pool.connect();
  try {
    // Buraya istediğin SQL sorgusunu yapıştır kral
    const res = await client.query('SELECT * FROM users LIMIT 5;'); 
    console.table(res.rows);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runQuery();