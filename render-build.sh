#!/bin/bash
set -e

echo "Starting build process with simplified approach..."

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

# Install client dependencies and build
echo "Installing client dependencies and building..."
cd client
npm install --no-package-lock
npm run build
cd ..

# Copy client build to dist
echo "Copying client build to dist..."
mkdir -p dist/client
cp -r client/build dist/client/build

echo "Build process completed successfully!"