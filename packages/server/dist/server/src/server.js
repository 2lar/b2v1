"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const notes_1 = require("./routes/notes");
const graph_1 = require("./routes/graph");
const query_1 = require("./routes/query");
const llm_1 = require("./routes/llm");
const category_1 = require("./routes/category");
const chatModes_1 = require("./routes/chatModes");
const fileHelpers_1 = require("./utils/fileHelpers");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Log configuration
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
// Output whether Gemini API key is configured
if (process.env.GEMINI_API_KEY) {
    console.log('Gemini API key is configured.');
}
else {
    console.log('Warning: Gemini API key is not configured. AI features will be limited.');
}
// Ensure data directory and files exist
(0, fileHelpers_1.ensureDataDirectory)();
// API Routes
app.use('/api/notes', notes_1.notesRouter);
app.use('/api/graph', graph_1.graphRouter);
app.use('/api/query', query_1.queryRouter);
app.use('/api/llm', llm_1.llmRouter);
app.use('/api/categories', category_1.categoryRouter);
app.use('/api/chatModes', chatModes_1.chatModesRouter);
// Determine the correct client build path
let clientBuildPath = path_1.default.join(__dirname, '../../client/build');
// Check if directory exists, if not try alternate path for Render
if (!require('fs').existsSync(clientBuildPath)) {
    const alternatePath = path_1.default.join(__dirname, '../../client/build');
    if (require('fs').existsSync(alternatePath)) {
        clientBuildPath = alternatePath;
        console.log(`Using alternate client build path: ${clientBuildPath}`);
    }
    else {
        console.log(`Warning: Client build not found at expected locations. Tried:\n- ${clientBuildPath}\n- ${alternatePath}`);
    }
}
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    console.log(`Serving static files from: ${clientBuildPath}`);
    // Serve static files
    app.use(express_1.default.static(clientBuildPath));
    // All other requests go to the React app
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
    });
}
// Start the server
function startServer() {
    return app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        // Log some path info for debugging
        console.log(`Current working directory: ${process.cwd()}`);
        console.log(`Server file location: ${__dirname}`);
    });
}
exports.startServer = startServer;
// Export app for testing
exports.default = app;
