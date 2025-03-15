"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilePaths = exports.writeLlmConfig = exports.readLlmConfig = exports.writeCategories = exports.readCategories = exports.writeConnections = exports.readConnections = exports.writeNotes = exports.readNotes = exports.writeData = exports.readData = exports.ensureDataDirectory = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Determine data directory based on environment
const getDataDir = () => {
    // Check if we're on Render with a disk mount
    if (process.env.RENDER && process.env.RENDER_DISK_MOUNT_PATH) {
        const renderDataDir = path_1.default.join(process.env.RENDER_DISK_MOUNT_PATH, 'data');
        console.log(`Using Render disk mount for data: ${renderDataDir}`);
        return renderDataDir;
    }
    // Check possible data locations
    const possiblePaths = [
        path_1.default.join(process.cwd(), 'data'),
        path_1.default.join(process.cwd(), 'dist', 'data'),
        path_1.default.join(__dirname, '../../../data') // Relative to current file
    ];
    // Use the first path that exists or create the first one
    for (const dirPath of possiblePaths) {
        if (fs_1.default.existsSync(dirPath)) {
            console.log(`Using existing data directory: ${dirPath}`);
            return dirPath;
        }
    }
    // If no path exists, create one in root
    const rootDataDir = possiblePaths[0];
    console.log(`Creating data directory: ${rootDataDir}`);
    return rootDataDir;
};
const dataDir = getDataDir();
console.log(`Data directory set to: ${dataDir}`);
const notesPath = path_1.default.join(dataDir, 'notes.json');
const connectionsPath = path_1.default.join(dataDir, 'connections.json');
const categoriesPath = path_1.default.join(dataDir, 'categories.json');
const llmConfigPath = path_1.default.join(dataDir, 'llm-config.json');
// Default configurations
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
// Ensure data directory exists
const ensureDataDirectory = () => {
    console.log(`Ensuring data directory exists at: ${dataDir}`);
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
    }
    // Ensure notes file exists
    if (!fs_1.default.existsSync(notesPath)) {
        fs_1.default.writeFileSync(notesPath, JSON.stringify([]));
        console.log(`Created notes file: ${notesPath}`);
    }
    // Ensure connections file exists
    if (!fs_1.default.existsSync(connectionsPath)) {
        fs_1.default.writeFileSync(connectionsPath, JSON.stringify([]));
        console.log(`Created connections file: ${connectionsPath}`);
    }
    // Ensure categories file exists
    if (!fs_1.default.existsSync(categoriesPath)) {
        fs_1.default.writeFileSync(categoriesPath, JSON.stringify(defaultCategories));
        console.log(`Created categories file: ${categoriesPath}`);
    }
    // Ensure LLM config file exists
    if (!fs_1.default.existsSync(llmConfigPath)) {
        fs_1.default.writeFileSync(llmConfigPath, JSON.stringify(defaultLlmConfig));
        console.log(`Created LLM config file: ${llmConfigPath}`);
    }
};
exports.ensureDataDirectory = ensureDataDirectory;
// Read data from a file
const readData = (filePath) => {
    try {
        console.log(`Reading from: ${filePath}`);
        const data = fs_1.default.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        // Return appropriate default values based on file type
        if (filePath === notesPath || filePath === connectionsPath) {
            return [];
        }
        else if (filePath === categoriesPath) {
            return defaultCategories;
        }
        else if (filePath === llmConfigPath) {
            return defaultLlmConfig;
        }
        throw error;
    }
};
exports.readData = readData;
// Write data to a file
const writeData = (filePath, data) => {
    try {
        console.log(`Writing to: ${filePath}`);
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    }
    catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
        return false;
    }
};
exports.writeData = writeData;
// Helper functions for specific data types
const readNotes = () => (0, exports.readData)(notesPath);
exports.readNotes = readNotes;
const writeNotes = (notes) => (0, exports.writeData)(notesPath, notes);
exports.writeNotes = writeNotes;
const readConnections = () => (0, exports.readData)(connectionsPath);
exports.readConnections = readConnections;
const writeConnections = (connections) => (0, exports.writeData)(connectionsPath, connections);
exports.writeConnections = writeConnections;
const readCategories = () => (0, exports.readData)(categoriesPath);
exports.readCategories = readCategories;
const writeCategories = (categories) => (0, exports.writeData)(categoriesPath, categories);
exports.writeCategories = writeCategories;
const readLlmConfig = () => {
    // Check for environment variable for API key first
    const config = (0, exports.readData)(llmConfigPath);
    // Override with environment variable if available
    if (process.env.GEMINI_API_KEY) {
        config.geminiApiKey = process.env.GEMINI_API_KEY;
        config.provider = 'gemini'; // Enable Gemini if API key is provided
    }
    return config;
};
exports.readLlmConfig = readLlmConfig;
const writeLlmConfig = (config) => (0, exports.writeData)(llmConfigPath, config);
exports.writeLlmConfig = writeLlmConfig;
// Get file paths (for use in other modules)
const getFilePaths = () => ({
    dataDir,
    notesPath,
    connectionsPath,
    categoriesPath,
    llmConfigPath
});
exports.getFilePaths = getFilePaths;
