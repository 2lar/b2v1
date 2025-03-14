#!/bin/bash
set -e

echo "Starting build process with npx approach..."

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

# Create a simple client build command
echo "Setting up client build..."
mkdir -p client

# Manually prepare the client directory
cd client

# Install create-react-app globally if needed
echo "Installing create-react-app globally..."
npm install -g create-react-app

# Install React and React scripts
echo "Installing client dependencies..."
npm install --no-package-lock react react-dom 
npm install --no-package-lock --save-dev react-scripts

# Ensure we have a valid package.json with build script
if [ ! -f "package.json" ] || ! grep -q '"build":' "package.json"; then
  echo "Creating/updating package.json with build script..."
  cat > package.json << 'EOF'
{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
fi

# Ensure we have a public directory with index.html
mkdir -p public
if [ ! -f "public/index.html" ]; then
  echo "Creating public/index.html..."
  cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Second Brain - Your personal knowledge management system" />
    <title>Second Brain</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF
fi

# Ensure we have a minimal src directory with index.js
mkdir -p src
if [ ! -f "src/index.js" ]; then
  echo "Creating minimal src/index.js..."
  cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Second Brain</h1>
      <p>Your personal knowledge management system is running!</p>
    </div>
  );
};

const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);
EOF
fi

echo "Building client with npx..."
npx react-scripts build
cd ..

# Copy client build to dist
echo "Copying client build to dist..."
mkdir -p dist/client
cp -r client/build dist/client/build

echo "Build process completed successfully!"