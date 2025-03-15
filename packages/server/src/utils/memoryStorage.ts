import { Note, Connection, CategoriesData, LlmConfig } from '@b2/shared';

// In-memory storage
export const memoryStore = {
  notes: [] as Note[],
  connections: [] as Connection[],
  categories: {
    categories: [],
    noteCategoryMap: {},
    hierarchy: {}
  } as CategoriesData,
  llmConfig: {
    provider: 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    localLlmUrl: 'http://localhost:11434/api/generate',
    localLlmModel: 'mistral',
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 1,
      topK: 1
    }
  } as LlmConfig
};