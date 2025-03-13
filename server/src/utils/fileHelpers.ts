import fs from 'fs';
import path from 'path';
import { Note, Connection, CategoriesData, LlmConfig } from '../../../shared/types';

const dataDir = path.join(__dirname, '../../data');
const notesPath = path.join(dataDir, 'notes.json');
const connectionsPath = path.join(dataDir, 'connections.json');
const categoriesPath = path.join(dataDir, 'categories.json');
const llmConfigPath = path.join(dataDir, 'llm-config.json');

// Default configurations
const defaultCategories: CategoriesData = {
  categories: [],
  noteCategoryMap: {},
  hierarchy: {}
};

const defaultLlmConfig: LlmConfig = {
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

// Ensure data directory exists
export const ensureDataDirectory = (): void => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure notes file exists
  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, JSON.stringify([]));
  }

  // Ensure connections file exists
  if (!fs.existsSync(connectionsPath)) {
    fs.writeFileSync(connectionsPath, JSON.stringify([]));
  }

  // Ensure categories file exists
  if (!fs.existsSync(categoriesPath)) {
    fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories));
  }

  // Ensure LLM config file exists
  if (!fs.existsSync(llmConfigPath)) {
    fs.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig));
  }
};

// Read data from a file
export const readData = <T>(filePath: string): T => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    
    // Return appropriate default values based on file type
    if (filePath === notesPath || filePath === connectionsPath) {
      return [] as unknown as T;
    } else if (filePath === categoriesPath) {
      return defaultCategories as unknown as T;
    } else if (filePath === llmConfigPath) {
      return defaultLlmConfig as unknown as T;
    }
    
    throw error;
  }
};

// Write data to a file
export const writeData = <T>(filePath: string, data: T): boolean => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// Helper functions for specific data types
export const readNotes = (): Note[] => readData<Note[]>(notesPath);
export const writeNotes = (notes: Note[]): boolean => writeData(notesPath, notes);

export const readConnections = (): Connection[] => readData<Connection[]>(connectionsPath);
export const writeConnections = (connections: Connection[]): boolean => writeData(connectionsPath, connections);

export const readCategories = (): CategoriesData => readData<CategoriesData>(categoriesPath);
export const writeCategories = (categories: CategoriesData): boolean => writeData(categoriesPath, categories);

export const readLlmConfig = (): LlmConfig => readData<LlmConfig>(llmConfigPath);
export const writeLlmConfig = (config: LlmConfig): boolean => writeData(llmConfigPath, config);

// Get file paths (for use in other modules)
export const getFilePaths = () => ({
  dataDir,
  notesPath,
  connectionsPath,
  categoriesPath,
  llmConfigPath
});