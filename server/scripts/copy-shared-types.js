const fs = require('fs');
const path = require('path');

// Paths
const sharedTypesPath = path.join(__dirname, '../../shared/types.ts');
const serverDistPath = path.join(__dirname, '../dist/shared');

// Create the directory if it doesn't exist
if (!fs.existsSync(serverDistPath)) {
  fs.mkdirSync(serverDistPath, { recursive: true });
}

// Copy the shared types file
fs.copyFileSync(
  sharedTypesPath, 
  path.join(serverDistPath, 'types.ts')
);

console.log('Shared types copied to server dist directory');