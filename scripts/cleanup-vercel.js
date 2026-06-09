const { execSync } = require('child_process');

async function cleanup() {
  console.log('Fetching Vercel deployments...');
  let output = '';
  try {
    output = execSync('npx vercel ls', { encoding: 'utf8' });
  } catch (err) {
    console.error('Failed to list vercel deployments:', err.message);
    return;
  }

  // Parse lines
  const lines = output.split('\n');
  const deployments = [];
  
  // Look for deployment lines
  for (const line of lines) {
    const trimmed = line.trim();
    // Vercel deployment URLs contain ".vercel.app"
    if (trimmed.includes('.vercel.app')) {
      // Split by whitespace
      const parts = trimmed.split(/\s+/);
      const urlPart = parts.find(p => p.startsWith('https://'));
      if (urlPart) {
        deployments.push(urlPart);
      }
    }
  }

  if (deployments.length <= 1) {
    console.log('Only latest deployment exists. No cleanup needed.');
    return;
  }

  // The first deployment in the list is the latest one (e.g. index 0)
  const latest = deployments[0];
  const toDelete = deployments.slice(1);

  console.log(`Latest deployment: ${latest}`);
  console.log(`Found ${toDelete.length} previous deployments to remove.`);

  for (let i = 0; i < toDelete.length; i++) {
    const url = toDelete[i];
    console.log(`[${i + 1}/${toDelete.length}] Removing deployment: ${url}...`);
    try {
      execSync(`npx vercel rm ${url} --yes`, { stdio: 'inherit' });
      console.log(`✓ Removed ${url}`);
    } catch (err) {
      console.error(`✗ Failed to remove ${url}:`, err.message);
    }
  }

  console.log('Cleanup finished!');
}

cleanup().catch(console.error);
