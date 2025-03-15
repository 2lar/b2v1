const fs = require('fs');
const path = require('path');

// Define paths relative to the current script
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

// Create shared directory in root if it doesn't exist
const rootSharedDir = path.join(rootDir, 'shared');
if (!fs.existsSync(rootSharedDir)) {
  fs.mkdirSync(rootSharedDir, { recursive: true });
  console.log(`Created shared directory in root: ${rootSharedDir}`);
}

// Create a basic types file if it doesn't exist
if (!fs.existsSync(sharedTypesPath)) {
  console.log(`Creating basic types file at: ${sharedTypesPath}`);
  const basicTypesContent = `
/**
 * Note model representing a user's thought or idea
 */
export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Connection model representing a relationship between two notes
 */
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  strength: number;
  type: 'automatic' | 'manual';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Category model for organizing notes
 */
export interface Category {
  id: string;
  name: string;
  level: number;
  noteCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * LLM provider configuration for AI features
 */
export interface LlmConfig {
  provider: 'none' | 'gemini' | 'local';
  geminiApiKey?: string;
  localLlmUrl?: string;
  localLlmModel?: string;
  model?: string;
  selectedAgentId?: string;
  generationConfig?: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * Graph data for visualization
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  label: string;
  content: string;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
  type: string;
}

/**
 * Categories data structure
 */
export interface CategoriesData {
  categories: Category[];
  noteCategoryMap: Record<string, string[]>;
  hierarchy: Record<string, string[]>;
}

/**
 * Chat message model
 */
export interface ChatMessage {
  id: number;
  type: 'user' | 'ai' | 'error';
  content: string;
  sources?: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
  modeId?: string;
}

/**
 * Chat mode / AI persona
 */
export interface ChatMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  promptTemplate: string;
}

/**
 * API Request and Response types
 */

export interface QueryRequest {
  query: string;
  modeId?: string;
}

export interface QueryResponse {
  response: string;
  sources: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
  modeId?: string;
}`;

  fs.writeFileSync(sharedTypesPath, basicTypesContent);
  console.log(`Created basic types file at ${sharedTypesPath}`);
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