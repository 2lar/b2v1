// Shared type definitions between client and server

export interface Note {
    id: string;
    content: string;
    createdAt: string;
  }
  
  export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    strength: number;
    type: 'automatic' | 'manual';
    createdAt: string;
  }
  
  export interface GraphData {
    nodes: {
      id: string;
      label: string;
      content: string;
      createdAt: string;
    }[];
    edges: {
      id: string;
      source: string;
      target: string;
      strength: number;
      type: string;
    }[];
  }
  
  export interface LlmConfig {
    provider: 'none' | 'gemini' | 'local';
    geminiApiKey: string;
    localLlmUrl: string;
    localLlmModel: string;
  }
  
  export interface Category {
    id: string;
    name: string;
    level: number;
    noteCount?: number;
  }
  
  export interface CategoriesData {
    categories: Category[];
    noteCategoryMap: Record<string, string[]>;
    hierarchy: Record<string, string[]>;
  }
  
  export interface ChatMessage {
    id: number;
    type: 'user' | 'ai' | 'error';
    content: string;
    sources?: {
      id: string;
      content: string;
      relevance: number;
    }[];
  }
  
  export interface QueryResponse {
    response: string;
    sources: {
      id: string;
      content: string;
      relevance: number;
    }[];
  }

  export interface LlmConfig {
    provider: 'none' | 'gemini' | 'local';
    geminiApiKey: string;
    localLlmUrl: string;
    localLlmModel: string;
    model?: string; // For Gemini model selection
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
    };
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;
  }