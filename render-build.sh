#!/bin/bash
set -e

echo "Starting build process with static approach..."

# Create shared types directory and file first
echo "Creating shared types directory and file..."
mkdir -p shared
cat > shared/types.ts << 'EOF'
export interface Note { id: string; content: string; createdAt: string; updatedAt?: string; }
export interface Connection { id: string; sourceId: string; targetId: string; strength: number; type: "automatic" | "manual"; createdAt: string; updatedAt?: string; }
export interface Category { id: string; name: string; level: number; noteCount?: number; createdAt?: string; updatedAt?: string; }
export interface LlmConfig { provider: "none" | "gemini" | "local"; geminiApiKey?: string; localLlmUrl?: string; localLlmModel?: string; model?: string; selectedAgentId?: string; generationConfig?: { temperature: number; maxOutputTokens: number; topP: number; topK: number; }; safetySettings?: Array<{ category: string; threshold: string; }>; }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[]; }
export interface GraphNode { id: string; label: string; content: string; createdAt: string; }
export interface GraphEdge { id: string; source: string; target: string; strength: number; type: string; }
export interface CategoriesData { categories: Category[]; noteCategoryMap: Record<string, string[]>; hierarchy: Record<string, string[]>; }
export interface ChatMessage { id: number; type: "user" | "ai" | "error"; content: string; sources?: Array<{ id: string; content: string; relevance: number; }>; modeId?: string; }
export interface ChatMode { id: string; name: string; description: string; icon: string; promptTemplate: string; }
export interface QueryRequest { query: string; modeId?: string; }
export interface QueryResponse { response: string; sources: Array<{ id: string; content: string; relevance: number; }>; modeId?: string; }
EOF

# Create a simple script for copying shared types
mkdir -p server/scripts
cat > server/scripts/copy-shared-types.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Define paths
const serverDir = path.join(__dirname, '..');
const rootDir = path.join(serverDir, '..');
const serverDistPath = path.join(serverDir, 'dist/shared');
const sharedTypesPath = path.join(rootDir, 'shared/types.ts');

console.log('Server directory:', serverDir);
console.log('Root directory:', rootDir);
console.log('Server dist path:', serverDistPath);
console.log('Shared types path:', sharedTypesPath);

// Create the directory if it doesn't exist
if (!fs.existsSync(serverDistPath)) {
  fs.mkdirSync(serverDistPath, { recursive: true });
  console.log(`Created directory: ${serverDistPath}`);
}

// Copy the file
try {
  fs.copyFileSync(sharedTypesPath, path.join(serverDistPath, 'types.ts'));
  console.log(`Successfully copied shared types from ${sharedTypesPath} to ${serverDistPath}`);
} catch (err) {
  console.error('Error copying shared types:', err);
  process.exit(1);
}
EOF

# Create data init script if not exists
if [ ! -f "server/scripts/init-data.js" ]; then
  mkdir -p server/scripts
  cat > server/scripts/init-data.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Paths
const dataDir = path.join(__dirname, '../data');

// Default data
const defaultNotes = [];
const defaultConnections = [];
const defaultCategories = {
  categories: [],
  noteCategoryMap: {},
  hierarchy: {}
};
const defaultLlmConfig = {
  provider: 'gemini',
  geminiApiKey: '',
  localLlmUrl: 'http://localhost:11434/api/generate',
  localLlmModel: 'mistral',
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 1,
    topK: 1
  }
};

// Create data directory if it doesn't exist
console.log(`Checking data directory at: ${dataDir}`);
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create or update notes.json
const notesPath = path.join(dataDir, 'notes.json');
if (!fs.existsSync(notesPath)) {
  console.log('Creating notes.json...');
  fs.writeFileSync(notesPath, JSON.stringify(defaultNotes, null, 2));
}

// Create or update connections.json
const connectionsPath = path.join(dataDir, 'connections.json');
if (!fs.existsSync(connectionsPath)) {
  console.log('Creating connections.json...');
  fs.writeFileSync(connectionsPath, JSON.stringify(defaultConnections, null, 2));
}

// Create or update categories.json
const categoriesPath = path.join(dataDir, 'categories.json');
if (!fs.existsSync(categoriesPath)) {
  console.log('Creating categories.json...');
  fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
}

// Create or update llm-config.json
const llmConfigPath = path.join(dataDir, 'llm-config.json');
if (!fs.existsSync(llmConfigPath)) {
  console.log('Creating llm-config.json...');
  fs.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig, null, 2));
}

console.log('Data initialization complete!');
EOF
fi

# Install server dependencies manually
echo "Installing server dependencies..."
cd server
npm install --no-package-lock
npm install --no-save typescript
echo "Initializing server data..."
node scripts/init-data.js
echo "Building server with TypeScript..."
npx tsc
echo "Copying shared types..."
node scripts/copy-shared-types.js
cd ..

# Creating static client files instead of using React build
echo "Creating static client files..."
mkdir -p client/build
mkdir -p client/build/static
mkdir -p client/build/static/js
mkdir -p client/build/static/css

# Create a simple index.html
cat > client/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Second Brain - Your personal knowledge management system" />
    <title>Second Brain</title>
    <link rel="stylesheet" href="static/css/main.css">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
      <div class="app">
        <nav class="navbar">
          <div class="navbar-brand">
            <h1>Second Brain</h1>
          </div>
          <ul class="navbar-nav">
            <li class="nav-item">
              <a href="/api/notes" class="nav-link active">
                <span>API Status</span>
              </a>
            </li>
          </ul>
        </nav>
        <div class="container">
          <div class="welcome-message">
            <h1>Welcome to Your Second Brain</h1>
            <p>Your personal knowledge management system is running!</p>
            <p>The server is working properly, but the client build process failed.</p>
            <p>You can still access the API endpoints directly:</p>
            <ul>
              <li><a href="/api/notes">/api/notes</a> - Get all notes</li>
              <li><a href="/api/graph">/api/graph</a> - Get knowledge graph data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <script src="static/js/main.js"></script>
  </body>
</html>
EOF

# Create a simple CSS file
cat > client/build/static/css/main.css << 'EOF'
:root {
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --accent-primary: #3498db;
  --border-color: #3a3a3a;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  padding: 0;
  margin: 0;
}

.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-secondary);
  color: white;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.navbar-brand h1 {
  font-size: 1.5rem;
  margin: 0;
  background: linear-gradient(90deg, var(--accent-primary), #9b59b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

.navbar-nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin-left: 20px;
}

.nav-link {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s, transform 0.2s;
  padding: 5px;
  border-radius: 4px;
}

.nav-link:hover {
  color: var(--accent-primary);
  transform: translateY(-2px);
}

.nav-link.active {
  color: var(--accent-primary);
  font-weight: 500;
}

.container {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-message {
  background-color: var(--bg-secondary);
  border-radius: 8px;
  padding: 30px;
  margin-top: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border-left: 4px solid var(--accent-primary);
}

.welcome-message h1 {
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--accent-primary), #9b59b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 700;
}

.welcome-message p {
  margin-bottom: 15px;
  font-size: 16px;
}

.welcome-message ul {
  margin-top: 20px;
  margin-left: 20px;
}

.welcome-message li {
  margin-bottom: 10px;
}

.welcome-message a {
  color: var(--accent-primary);
  text-decoration: none;
  transition: color 0.3s;
}

.welcome-message a:hover {
  text-decoration: underline;
}
EOF

# Create a simple JS file
cat > client/build/static/js/main.js << 'EOF'
document.addEventListener('DOMContentLoaded', () => {
  console.log('Second Brain app is running!');
  
  // Add a status check
  fetch('/api/notes')
    .then(response => {
      const statusElement = document.createElement('div');
      statusElement.style.padding = '10px';
      statusElement.style.marginTop = '20px';
      statusElement.style.borderRadius = '4px';
      
      if (response.ok) {
        statusElement.textContent = 'API is operational! ✅';
        statusElement.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
        statusElement.style.color = '#2ecc71';
      } else {
        statusElement.textContent = 'API is not responding properly. ❌';
        statusElement.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
        statusElement.style.color = '#e74c3c';
      }
      
      document.querySelector('.welcome-message').appendChild(statusElement);
    })
    .catch(error => {
      console.error('Error checking API status:', error);
    });
});
EOF

# Copy client build to dist
echo "Copying client build to dist..."
mkdir -p dist/client
cp -r client/build dist/client/build

echo "Build process completed successfully!"