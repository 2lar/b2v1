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
}