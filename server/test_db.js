const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  console.log('Testing with URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log('✅ Connection SUCCESS');
    const res = await client.query('SELECT version()');
    console.log('Result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('❌ Connection FAILED');
    console.error(err);
    process.exit(1);
  }
}

test();
