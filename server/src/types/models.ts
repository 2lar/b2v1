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
    noteCount: number;
    createdAt?: string;
    updatedAt?: string;
  }
  
  /**
   * LLM provider configuration for AI features
   */
  export interface LlmConfig {
    provider: 'none' | 'gemini' | 'local';
    geminiApiKey: string;
    localLlmUrl: string;
    localLlmModel: string;
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