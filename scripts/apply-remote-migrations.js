/**
 * Apply pending SQL migrations via Supabase Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
 * Optional: SUPABASE_PROJECT_REF (default: kortbujyuafwdiqxsiok)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'kortbujyuafwdiqxsiok';
const SCHEMA_FILE = 'schema.sql';

function request(query) {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Missing SUPABASE_ACCESS_TOKEN.');
    console.error('Create one at: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }

  const body = JSON.stringify({ query });
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const filePath = path.join(__dirname, '..', 'supabase', SCHEMA_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Schema file not found at ${filePath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Applying database schema from ${SCHEMA_FILE}...`);
  const result = await request(sql);
  console.log(`  Status: ${result.status}`);
  if (result.status !== 200 && result.status !== 201) {
    console.error(`  Response: ${result.body}`);
    const bodyJson = JSON.parse(result.body || '{}');
    const msg = bodyJson.message || '';
    if (msg.toLowerCase().includes('already exists')) {
      console.warn(`  ⚠️ Warning: relations/columns might already exist.`);
    } else {
      process.exit(1);
    }
  }
  console.log('Database schema applied successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

