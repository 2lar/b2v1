import fs from 'fs';
import path from 'path';
import { Note, Connection, CategoriesData, LlmConfig } from '../../shared';

const dataDir = path.join(__dirname, '../data');

// Default data
const defaultNotes: Note[] = [];
const defaultConnections: Connection[] = [];
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

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create or update notes.json
const notesPath = path.join(dataDir, 'notes.json');
if (!fs.existsSync(notesPath)) {
  console.log('Creating notes.json...');
  fs.writeFileSync(notesPath, JSON.stringify(defaultNotes, null, 2));
}

// Create or update connections.json
const connectionsPath = path.join(dataDir, 'connections.json');
if (!fs.existsSync(connectionsPath)) {
  console.log('Creating connections.json...');
  fs.writeFileSync(connectionsPath, JSON.stringify(defaultConnections, null, 2));
}

// Create or update categories.json
const categoriesPath = path.join(dataDir, 'categories.json');
if (!fs.existsSync(categoriesPath)) {
  console.log('Creating categories.json...');
  fs.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
}

// Create or update llm-config.json
const llmConfigPath = path.join(dataDir, 'llm-config.json');
if (!fs.existsSync(llmConfigPath)) {
  console.log('Creating llm-config.json...');
  fs.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig, null, 2));
}

console.log('Data initialization complete!');