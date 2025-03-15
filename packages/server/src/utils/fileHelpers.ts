import fs from 'fs';
import path from 'path';
import { Note, Connection, CategoriesData, LlmConfig } from '@b2/shared';

// Determine data directory based on environment
const getDataDir = (): string => {
  // Check if we're on Render with a disk mount
  if (process.env.RENDER && process.env.RENDER_DISK_MOUNT_PATH) {
    const renderDataDir = path.join(process.env.RENDER_DISK_MOUNT_PATH);
    console.log(`Using Render disk mount for data: ${renderDataDir}`);
    return renderDataDir;
  }
  
  // Check possible data locations
  const possiblePaths = [
    path.join(process.cwd(), 'data'),           // Root directory
    path.join(process.cwd(), 'dist', 'data'),   // Dist directory
    path.join(__dirname, '../../../data')       // Relative to current file
  ];

  // Use the first path that exists or create the first one
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(`Using existing data directory: ${dirPath}`);
      return dirPath;
    }
  }

  // If no path exists, create one in root
  const rootDataDir = possiblePaths[0];
  console.log(`Creating data directory: ${rootDataDir}`);
  fs.mkdirSync(rootDataDir, { recursive: true });
  return rootDataDir;
};

const dataDir = getDataDir();
console.log(`Data directory set to: ${dataDir}`);

// Rest of the file remains the same...
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
  console.log(`Ensuring data directory exists at: ${dataDir}`);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }

  // Ensure notes file exists
  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, JSON.stringify([]));
    console.log(`Created notes file: ${notesPath}`);
  }

  // Ensure connections file exists
  if (!fs.existsSync(connectionsPath)) {
    fs.writeFileSync(connectionsPath, JSON.stringify([]));
    console.log(`Created connections file: ${connectionsPath}`);
  }

  // Ensure categories file exists
  if (!fs.existsSync(categoriesPath)) {
    fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories));
    console.log(`Created categories file: ${categoriesPath}`);
  }

  // Ensure LLM config file exists
  if (!fs.existsSync(llmConfigPath)) {
    fs.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig));
    console.log(`Created LLM config file: ${llmConfigPath}`);
  }
};

// Read data from a file
export const readData = <T>(filePath: string): T => {
  try {
    console.log(`Reading from: ${filePath}`);
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
    console.log(`Writing to: ${filePath}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

let inMemoryStorage = {
  notes: [],
  connections: [],
  categories: { categories: [], noteCategoryMap: {}, hierarchy: {} },
  llmConfig: {
    provider: 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    localLlmUrl: 'http://localhost:11434/api/generate',
    localLlmModel: 'mistral'
  }
};

// Replace disk reading functions
export const readNotes = () => inMemoryStorage.notes;
export const writeNotes = (notes: never[]) => { inMemoryStorage.notes = notes; };

export const readConnections = (): Connection[] => readData<Connection[]>(connectionsPath);
export const writeConnections = (connections: Connection[]): boolean => writeData(connectionsPath, connections);

export const readCategories = (): CategoriesData => readData<CategoriesData>(categoriesPath);
export const writeCategories = (categories: CategoriesData): boolean => writeData(categoriesPath, categories);

export const readLlmConfig = (): LlmConfig => {
  // Check for environment variable for API key first
  const config = readData<LlmConfig>(llmConfigPath);
  
  // Override with environment variable if available
  if (process.env.GEMINI_API_KEY) {
    config.geminiApiKey = process.env.GEMINI_API_KEY;
    config.provider = 'gemini'; // Enable Gemini if API key is provided
  }
  
  return config;
};

export const writeLlmConfig = (config: LlmConfig): boolean => writeData(llmConfigPath, config);

// Get file paths (for use in other modules)
export const getFilePaths = () => ({
  dataDir,
  notesPath,
  connectionsPath,
  categoriesPath,
  llmConfigPath
});