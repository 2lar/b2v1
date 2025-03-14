const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run commands and log output
function runCommand(command) {
  console.log(`\n===> Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Create data directory and initialize default files
function initializeDataFiles() {
  console.log('\n===> Initializing data files');
  
  // Create data directory
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
  
  // Create default data files
  const files = {
    'notes.json': '[]',
    'connections.json': '[]',
    'categories.json': '{"categories":[],"noteCategoryMap":{},"hierarchy":{}}',
    'llm-config.json': JSON.stringify({
      provider: 'gemini',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      localLlmUrl: 'http://localhost:11434/api/generate',
      localLlmModel: 'mistral',
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
        topK: 1
      }
    }, null, 2)
  };
  
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`Created ${filename}`);
    }
  }
}

// Fix the note issue in the compiled code
function fixCompiledCode() {
  console.log('\n===> Fixing compiled code issues');
  
  const notesJsPath = path.join(process.cwd(), 'dist', 'server', 'src', 'routes', 'notes.js');
  
  if (fs.existsSync(notesJsPath)) {
    try {
      let content = fs.readFileSync(notesJsPath, 'utf8');
      
      // Fix id.now() -> Date.now()
      content = content.replace(/id\.now\(\)/g, 'Date.now()');
      
      fs.writeFileSync(notesJsPath, content);
      console.log('Fixed id.now() issue in notes.js');
    } catch (error) {
      console.error('Error fixing notes.js:', error);
    }
  }
}

// Main build process
async function main() {
  // Install dependencies
  runCommand('npm install');
  
  // Install typescript locally
  runCommand('npm install typescript');
  
  // Compile server typescript
  console.log('\n===> Compiling TypeScript server code');
  const tscSuccess = runCommand('npx tsc -p server/tsconfig.json');
  
  if (tscSuccess) {
    // Fix any issues in the compiled code
    fixCompiledCode();
    
    // Initialize data files
    initializeDataFiles();
    
    // Copy shared types to dist
    console.log('\n===> Copying shared types');
    const distSharedDir = path.join(process.cwd(), 'dist', 'shared');
    if (!fs.existsSync(distSharedDir)) {
      fs.mkdirSync(distSharedDir, { recursive: true });
    }
    
    try {
      fs.copyFileSync(
        path.join(process.cwd(), 'shared', 'types.ts'),
        path.join(distSharedDir, 'types.js')
      );
      console.log('Copied shared types');
    } catch (error) {
      console.error('Error copying shared types:', error);
    }
    
    // Build client
    console.log('\n===> Building client');
    const clientSuccess = runCommand('cd client && npm install && npm run build');
    
    if (clientSuccess) {
      console.log('\n===> Copying client build');
      const distClientDir = path.join(process.cwd(), 'dist', 'client');
      if (!fs.existsSync(distClientDir)) {
        fs.mkdirSync(distClientDir, { recursive: true });
      }
      
      runCommand('cp -r client/build dist/client/');
    } else {
      console.log('\n===> Client build failed, creating simple HTML file');
      
      const distClientDir = path.join(process.cwd(), 'dist', 'client');
      if (!fs.existsSync(distClientDir)) {
        fs.mkdirSync(distClientDir, { recursive: true });
      }
      
      // Create simple HTML file
      const indexHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Second Brain API</title>
        </head>
        <body>
          <h1>Second Brain API is running</h1>
          <p>The server is working, but the client build failed.</p>
        </body>
        </html>
      `;
      
      fs.writeFileSync(path.join(distClientDir, 'index.html'), indexHtml);
    }
    
    console.log('\n===> Build completed successfully');
  } else {
    console.error('\n===> TypeScript compilation failed');
    process.exit(1);
  }
}

// Run the build process
main().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});