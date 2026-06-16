/**
 * Apply pending SQL migrations via Supabase Management API.
 * Requires: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
 * Optional: SUPABASE_PROJECT_REF (default: kortbujyuafwdiqxsiok)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'kortbujyuafwdiqxsiok';
const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_user_plan_and_branding.sql',
  '003_fix_profile_trigger.sql',
  '004_fix_missing_columns.sql',
  '005_profiles_read_policy.sql',
];

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
  for (const file of MIGRATION_FILES) {
    const filePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skip missing file: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying ${file}...`);
    const result = await request(sql);
    console.log(`  Status: ${result.status}`);
    if (result.status !== 200 && result.status !== 201) {
      console.error(`  Response: ${result.body}`);
      const bodyJson = JSON.parse(result.body || '{}');
      const msg = bodyJson.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        console.warn(`  ⚠️ Skip: relation/column already exists.`);
        continue;
      }
      process.exit(1);
    }
    console.log(`  OK`);
  }
  console.log('All migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

