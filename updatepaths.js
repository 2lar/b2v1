const fs = require('fs');
const path = require('path');

// Path to server.js in dist
const serverJsPath = path.join('dist', 'server', 'src', 'server.js');

// Read the current server.js
let serverContent = fs.readFileSync(serverJsPath, 'utf8');

// Update client path logic to include Render's specific paths
const updatedClientPathLogic = `
// Determine the correct client build path for Render
let clientBuildPath = path.join(__dirname, '../../../client/build');

// Check if directory exists
if (!fs.existsSync(clientBuildPath)) {
  // Try dist/client path
  const altPath = path.join(__dirname, '../../../dist/client/build');
  if (fs.existsSync(altPath)) {
    clientBuildPath = altPath;
    console.log(\`Using alternate client path: \${clientBuildPath}\`);
  } else {
    // On Render, try hardcoded path
    const renderPath = '/opt/render/project/src/dist/client/build';
    if (fs.existsSync(renderPath)) {
      clientBuildPath = renderPath;
      console.log(\`Using Render-specific path: \${clientBuildPath}\`);
    } else {
      console.log(\`Warning: Client build not found. Checked paths:
- \${clientBuildPath}
- \${altPath}
- \${renderPath}\`);
    }
  }
}

// Ensure client directory exists before trying to serve from it
if (fs.existsSync(clientBuildPath)) {
  console.log(\`Serving static files from: \${clientBuildPath}\`);
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Client app not found');
    }
  });
}
`;

// Replace the existing client path logic
serverContent = serverContent.replace(
  /\/\/ Serve static files[\s\S]*?app\.get\('\*'/,
  updatedClientPathLogic
);

// Write the updated file
fs.writeFileSync(serverJsPath, serverContent);
console.log('Updated server.js with Render-specific paths');

// Make sure client build is copied to dist/client/build
const clientBuildDir = path.join('dist', 'client', 'build');
if (!fs.existsSync(clientBuildDir)) {
  fs.mkdirSync(clientBuildDir, { recursive: true });
  console.log('Created dist/client/build directory');
}

// Copy client files if they exist
const clientSourceDir = path.join('client', 'build');
if (fs.existsSync(clientSourceDir)) {
  // Copy index.html at minimum
  const indexPath = path.join(clientSourceDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(
      indexPath,
      path.join(clientBuildDir, 'index.html')
    );
    console.log('Copied index.html to dist/client/build');
  }
  
  // Create a simple CSS file
  fs.writeFileSync(
    path.join(clientBuildDir, 'styles.css'),
    'body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }'
  );
  
  console.log('Added styles.css to dist/client/build');
} else {
  // Create a minimal index.html
  const minimialHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Second Brain</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #3498db; }
    .api-link { background: #f5f5f5; padding: 8px; border-radius: 4px; margin: 5px 0; display: inline-block; }
  </style>
</head>
<body>
  <h1>Second Brain API</h1>
  <p>The API is running. Here are the available endpoints:</p>
  <div>
    <a class="api-link" href="/api/notes">/api/notes</a> - Get all notes
  </div>
  <div>
    <a class="api-link" href="/api/graph">/api/graph</a> - Get knowledge graph
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(clientBuildDir, 'index.html'), minimialHtml);
  console.log('Created minimal index.html in dist/client/build');
}