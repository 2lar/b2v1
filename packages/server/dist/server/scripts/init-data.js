"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dataDir = path_1.default.join(__dirname, '../data');
// Default data
const defaultNotes = [];
const defaultConnections = [];
const defaultCategories = {
    categories: [],
    noteCategoryMap: {},
    hierarchy: {}
};
const defaultLlmConfig = {
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
if (!fs_1.default.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
// Create or update notes.json
const notesPath = path_1.default.join(dataDir, 'notes.json');
if (!fs_1.default.existsSync(notesPath)) {
    console.log('Creating notes.json...');
    fs_1.default.writeFileSync(notesPath, JSON.stringify(defaultNotes, null, 2));
}
// Create or update connections.json
const connectionsPath = path_1.default.join(dataDir, 'connections.json');
if (!fs_1.default.existsSync(connectionsPath)) {
    console.log('Creating connections.json...');
    fs_1.default.writeFileSync(connectionsPath, JSON.stringify(defaultConnections, null, 2));
}
// Create or update categories.json
const categoriesPath = path_1.default.join(dataDir, 'categories.json');
if (!fs_1.default.existsSync(categoriesPath)) {
    console.log('Creating categories.json...');
    fs_1.default.writeFileSync(categoriesPath, JSON.stringify(defaultCategories, null, 2));
}
// Create or update llm-config.json
const llmConfigPath = path_1.default.join(dataDir, 'llm-config.json');
if (!fs_1.default.existsSync(llmConfigPath)) {
    console.log('Creating llm-config.json...');
    fs_1.default.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig, null, 2));
}
console.log('Data initialization complete!');
