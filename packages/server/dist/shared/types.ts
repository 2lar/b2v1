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
    modeId?: string;
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
    model?: string;
    selectedAgentId?: string; // ID of the selected agent/chat mode
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

  export interface ChatMode {
    id: string;
    name: string;
    description: string;
    promptTemplate: string;
    icon?: string; // Optional icon identifier (for UI)
  }
  
  /**
   * Updated Query Request with chat mode
   */
  export interface QueryRequest {
    query: string;
    modeId?: string; // The selected chat mode ID
  }
  
  /**
   * Update ChatMessage to potentially include the mode
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
    modeId?: string; // Track which mode was used
  }