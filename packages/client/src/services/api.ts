import axios from 'axios';
import { 
  Note, 
  Connection, 
  GraphData, 
  Category, 
  LlmConfig, 
  QueryResponse,
  ChatMode
} from '@B2/packages/shared';

// Determine base URL based on environment
const getBaseUrl = () => {
  // In production, use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // In development, use the proxy from package.json or default to localhost
  return '/api';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Notes API
export const notesApi = {
  getAllNotes: async (): Promise<Note[]> => {
    const response = await api.get<Note[]>('/notes');
    return response.data;
  },
  
  getNote: async (id: string): Promise<Note> => {
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },
  
  createNote: async (content: string): Promise<{ note: Note, connections: Connection[], categories: Category[] }> => {
    const response = await api.post('/notes', { content });
    return response.data;
  },
  
  updateNote: async (id: string, content: string): Promise<{ note: Note, categories: Category[] }> => {
    const response = await api.put(`/notes/${id}`, { content });
    return response.data;
  },
  
  deleteNote: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
  
  getRecentNotes: async (page: number = 1, limit: number = 10): Promise<{ 
    notes: Note[], 
    pagination: {
      currentPage: number,
      totalPages: number,
      totalNotes: number,
      hasNextPage: boolean,
      hasPrevPage: boolean
    }
  }> => {
    const response = await api.get(`/notes/list/recent?page=${page}&limit=${limit}`);
    return response.data;
  }
};

// Graph API
export const graphApi = {
  getGraphData: async (): Promise<GraphData> => {
    const response = await api.get<GraphData>('/graph');
    return response.data;
  },
  
  createConnection: async (sourceId: string, targetId: string, type: 'manual' | 'automatic' = 'manual'): Promise<{
    connection: Connection,
    categoryUpdate: any
  }> => {
    const response = await api.post('/graph/connections', { sourceId, targetId, type });
    return response.data;
  },
  
  deleteConnection: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/graph/connections/${id}`);
    return response.data;
  },
  
  getNoteConnections: async (noteId: string): Promise<Connection[]> => {
    const response = await api.get<Connection[]>(`/graph/connections/note/${noteId}`);
    return response.data;
  },
  
  recalculateConnections: async (): Promise<{ message: string, connectionCount: number }> => {
    const response = await api.post('/graph/recalculate');
    return response.data;
  }
};

// Category API
export const categoryApi = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },
  
  getCategoryHierarchy: async (): Promise<{ categories: Category[], hierarchy: Record<string, string[]> }> => {
    const response = await api.get('/categories/hierarchy');
    return response.data;
  },
  
  getNotesByCategory: async (categoryId: string): Promise<Note[]> => {
    const response = await api.get<Note[]>(`/categories/${categoryId}/notes`);
    return response.data;
  },
  
  getNoteCategories: async (noteId: string): Promise<Category[]> => {
    const response = await api.get<Category[]>(`/categories/note/${noteId}`);
    return response.data;
  },
  
  rebuildCategories: async (): Promise<{ 
    message: string, 
    notesProcessed: number,
    results: Array<{ noteId: string, categories: Category[] }>
  }> => {
    const response = await api.post('/categories/rebuild');
    return response.data;
  }
};

// LLM API
export const llmApi = {
  getConfig: async (): Promise<Omit<LlmConfig, 'geminiApiKey'> & { geminiApiKey: string }> => {
    const response = await api.get('/llm/config');
    return response.data;
  },
  
  updateConfig: async (config: Partial<LlmConfig>): Promise<{ 
    success: boolean, 
    config: Omit<LlmConfig, 'geminiApiKey'> & { geminiApiKey: string } 
  }> => {
    const response = await api.put('/llm/config', config);
    return response.data;
  },
  
  checkStatus: async (): Promise<{ available: boolean }> => {
    const response = await api.get('/llm/status');
    return response.data;
  },
  
  testLlm: async (prompt?: string): Promise<{ available: boolean, response: string }> => {
    const response = await api.post('/llm/test', { prompt });
    return response.data;
  }
};

// Chat Modes API
export const chatModesApi = {
  getAllModes: async (): Promise<ChatMode[]> => {
    const response = await api.get<ChatMode[]>('/chatModes');
    return response.data;
  },
  
  getMode: async (id: string): Promise<ChatMode> => {
    const response = await api.get<ChatMode>(`/chatModes/${id}`);
    return response.data;
  }
};

// Query API
export const queryApi = {
  sendQuery: async (query: string, modeId?: string): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>('/query', { query, modeId });
    return response.data;
  },
  
  sendSimpleQuery: async (query: string, modeId?: string): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>('/query/simple', { query, modeId });
    return response.data;
  }
};

export default {
  notesApi,
  graphApi,
  categoryApi,
  llmApi,
  queryApi,
  chatModesApi
};