const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'dist/server/src/routes',
  'dist/server/src/utils',
  'dist/server/src/services',
  'dist/client'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});