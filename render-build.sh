#!/bin/bash
set -e

echo "Starting build process..."

# Create shared types directory and file
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

echo "Installing root dependencies..."
npm install

echo "Installing server dependencies..."
cd server
npm install
npm install typescript

echo "Building server with TypeScript..."
npx tsc
cd ..

echo "Creating dist/shared directory..."
mkdir -p dist/shared
cp shared/types.ts dist/shared/

echo "Building client..."
cd client
npm install
npm run build
cd ..

echo "Copying client build to dist..."
mkdir -p dist/client
cp -r client/build dist/client/build

echo "Build process completed successfully!"