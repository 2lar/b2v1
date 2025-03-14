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

// Manually compile TypeScript files without using tsc
function compileTypeScript() {
  console.log('\n===> Compiling TypeScript files manually');
  
  // Create necessary directories
  const distDir = path.join(process.cwd(), 'dist');
  const distServerDir = path.join(distDir, 'server');
  const distServerSrcDir = path.join(distServerDir, 'src');
  
  // Create directories recursively
  if (!fs.existsSync(distServerSrcDir)) {
    fs.mkdirSync(distServerSrcDir, { recursive: true });
    console.log(`Created ${distServerSrcDir}`);
  }
  
  // Copy JavaScript files directly from server directory
  // This is a fallback approach when tsc isn't working
  console.log('Copying server files to dist directory...');
  
  // Function to recursively copy .ts files as .js
  function copyDirRecursively(sourceDir, targetDir) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const files = fs.readdirSync(sourceDir);
    
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      const stats = fs.statSync(sourcePath);
      
      if (stats.isDirectory()) {
        copyDirRecursively(sourcePath, targetPath);
      } else if (file.endsWith('.ts')) {
        // Convert TypeScript to JavaScript (very basic)
        const content = fs.readFileSync(sourcePath, 'utf8')
          // Remove TypeScript types
          .replace(/:\s*[A-Za-z<>\[\]|&]+/g, '')
          // Remove interfaces and types
          .replace(/interface\s+[^{]+{[^}]+}/g, '')
          .replace(/type\s+[^=]+=\s*[^;]+;/g, '')
          // Convert import statements
          .replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g, function(match, imports, source) {
            // If importing from shared/types, remove it
            if (source.includes('shared/types')) {
              return '';
            }
            return `const { ${imports} } = require('${source}')`;
          })
          .replace(/import\s+([^{]+)\s+from\s+['"]([^'"]+)['"]/g, function(match, module, source) {
            if (source.includes('shared/types')) {
              return '';
            }
            return `const ${module} = require('${source}')`;
          })
          // Convert export statements
          .replace(/export\s+default\s+([^;]+);?/g, 'module.exports = $1;')
          .replace(/export\s+const\s+([^=]+)/g, 'const $1')
          .replace(/export\s+function\s+([^\(]+)/g, 'function $1')
          .replace(/export\s+{([^}]+)}/g, 'module.exports = { $1 }');
          
        // Write as JavaScript
        fs.writeFileSync(targetPath.replace('.ts', '.js'), content);
        console.log(`Converted ${sourcePath} to ${targetPath.replace('.ts', '.js')}`);
      } else {
        // Copy other files directly
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${sourcePath} to ${targetPath}`);
      }
    }
  }
  
  // Copy server src directory
  copyDirRecursively(path.join(process.cwd(), 'server', 'src'), distServerSrcDir);
  
  console.log('TypeScript files "compiled" to JavaScript');
}

// Install dependencies
console.log('===> Installing dependencies');
runCommand('npm install');

// Try to install TypeScript globally if not available
try {
  console.log('\n===> Installing TypeScript');
  runCommand('npm install -g typescript');
  runCommand('npm install typescript');
  
  // Try to run TypeScript compiler
  console.log('\n===> Building server with TypeScript');
  runCommand('npx tsc -p server/tsconfig.json');
} catch (error) {
  console.log('\n===> TypeScript compilation failed, using manual compilation');
  compileTypeScript();
}

// Create shared/types.ts directory in dist
const distSharedDir = path.join(process.cwd(), 'dist', 'shared');
if (!fs.existsSync(distSharedDir)) {
  fs.mkdirSync(distSharedDir, { recursive: true });
  console.log(`Created dist/shared directory`);
}

// Copy shared types
try {
  const sharedTypesContent = fs.readFileSync(path.join(process.cwd(), 'shared', 'types.ts'), 'utf8');
  fs.writeFileSync(path.join(distSharedDir, 'types.js'), '// TypeScript definitions converted to JS\nmodule.exports = {};');
  console.log('Created placeholder shared/types.js (types removed in JS version)');
} catch (error) {
  console.error('Error handling shared types:', error);
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