const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'aws-1-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.kortbujyuafwdiqxsiok',
    password: '@Ifalfahlevi4',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('Connecting to Supabase...');
  try {
    await client.connect();
    console.log('Connected successfully!');

    const { rows } = await client.query(`
      SELECT id, email, full_name FROM public.profiles;
    `);

    console.log('Users in database:', rows);
  } catch (err) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

run();
