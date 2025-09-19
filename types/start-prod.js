// start-prod.js
require('dotenv').config({ path: '.env.custom' });
const { execSync } = require('child_process');

// Run Next.js in production mode
execSync('next start', { stdio: 'inherit' });
