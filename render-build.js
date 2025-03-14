const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run commands and log output
function runCommand(command) {
  console.log(`\n===> Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
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

// Install dependencies
console.log('===> Installing dependencies');
runCommand('npm install');

// Manually run TypeScript compilation for server
console.log('\n===> Building server');
runCommand('npx tsc -p server/tsconfig.json');

// Create shared/types.ts directory in dist
const distSharedDir = path.join(process.cwd(), 'dist', 'shared');
if (!fs.existsSync(distSharedDir)) {
  fs.mkdirSync(distSharedDir, { recursive: true });
  console.log(`Created dist/shared directory`);
}

// Copy shared types
try {
  const sharedTypesContent = fs.readFileSync(path.join(process.cwd(), 'shared', 'types.ts'), 'utf8');
  fs.writeFileSync(path.join(distSharedDir, 'types.ts'), sharedTypesContent);
  console.log('Copied shared/types.ts to dist/shared/types.ts');
} catch (error) {
  console.error('Error copying shared types:', error);
}

// Initialize data files instead of using ts-node
initializeDataFiles();

// Build client
console.log('\n===> Building client');
runCommand('cd client && npm install && npm run build');

// Copy client build to dist
console.log('\n===> Copying client build to dist');
const distClientDir = path.join(process.cwd(), 'dist', 'client');
if (!fs.existsSync(distClientDir)) {
  fs.mkdirSync(distClientDir, { recursive: true });
}

// Copy client build files
runCommand('cp -r client/build dist/client/');

console.log('\n===> Build completed successfully!');