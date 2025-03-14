const fs = require('fs');
const path = require('path');

// Define paths relative to the current script
const rootDir = path.join(__dirname, '..');
const serverDistPath = path.join(rootDir, 'dist/shared');
const sharedTypesPath = path.join(rootDir, 'shared/types.ts');

console.log('Root directory:', rootDir);
console.log('Server dist path:', serverDistPath);
console.log('Shared types path:', sharedTypesPath);

// Create the directory if it doesn't exist
if (!fs.existsSync(serverDistPath)) {
  fs.mkdirSync(serverDistPath, { recursive: true });
  console.log(`Created directory: ${serverDistPath}`);
}

// Check if the source file exists
if (!fs.existsSync(sharedTypesPath)) {
  console.error(`Error: Shared types file not found at ${sharedTypesPath}`);
  process.exit(1);
}

// Copy the file
try {
  const destPath = path.join(serverDistPath, 'types.ts');
  fs.copyFileSync(sharedTypesPath, destPath);
  console.log(`Successfully copied shared types from ${sharedTypesPath} to ${destPath}`);
} catch (err) {
  console.error('Error copying shared types:', err);
  process.exit(1);
}