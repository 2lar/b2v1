import { Note, Connection } from '@b2/shared';

/**
 * API Response wrapper for consistent response format
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: Record<string, any>;
  }
  
  /**
   * Note API endpoints
   */
  export interface CreateNoteRequest {
    content: string;
  }
  
  export interface CreateNoteResponse {
    note: Note;
    connections: Connection[];
  }
  
  /**
   * Chat API endpoints
   */
  export interface QueryRequest {
    query: string;
  }
  
  export interface QueryResponse {
    response: string;
    sources: Array<{
      id: string;
      content: string;
      relevance: number;
    }>;
  }
  
  /**
   * LLM API endpoints
   */
  export interface UpdateLlmConfigRequest {
    provider: 'none' | 'gemini' | 'local';
    geminiApiKey?: string;
    localLlmUrl?: string;
    localLlmModel?: string;
  }
  
  export interface LlmStatusResponse {
    available: boolean;
  }