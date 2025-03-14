const { execSync } = require('child_process');

// Run commands and log output
function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

// Install dependencies
runCommand('npm install');
runCommand('cd server && npm install');
runCommand('cd client && npm install');

// Build server
runCommand('cd server && npx tsc');
runCommand('node server/scripts/copy-shared-types.js');

// Build client
runCommand('cd client && npm run build');

// Copy client build
runCommand('mkdir -p dist/client');
runCommand('cp -r client/build dist/client/build');

console.log('Build completed successfully!');