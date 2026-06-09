/**
 * apply-migration-rest.js
 * Tries to apply loan_trackers migration via Supabase Management API.
 */

const https = require('https');
const fs = require('fs');

// Read the SQL migration file
const sql = fs.readFileSync('./supabase/migrations/002_loan_tracker.sql', 'utf8');

// We'll need the access token from Supabase dashboard
// Try using the project's service key by making API calls to the SQL endpoint

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'kortbujyuafwdiqxsiok';

  if (!accessToken) {
    console.log('');
    console.log('❗ To auto-apply this migration, set SUPABASE_ACCESS_TOKEN:');
    console.log('   Get it from: https://supabase.com/dashboard/account/tokens');
    console.log('   Then run: $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node apply-migration-rest.js');
    console.log('');
    console.log('OR apply manually:');
    console.log('   1. Open: https://supabase.com/dashboard/project/kortbujyuafwdiqxsiok/sql/new');
    console.log('   2. Run SQL from: supabase/migrations/002_loan_tracker.sql');
    return;
  }

  console.log('Applying migration via Management API...');

  const body = JSON.stringify({ query: sql });
  const result = await makeRequest({
    hostname: 'api.supabase.com',
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    }
  }, body);

  console.log('Status:', result.status);
  console.log('Response:', result.body);

  if (result.status === 200 || result.status === 201) {
    console.log('✅ Migration applied successfully!');
  } else {
    console.log('❌ Migration failed. Please apply manually.');
  }
}

run().catch(console.error);
