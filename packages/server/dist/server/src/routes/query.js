"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryRouter = void 0;
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const fileHelpers_1 = require("../utils/fileHelpers");
const textUtils_1 = require("../utils/textUtils");
const chatModes_1 = require("../../data/chatModes");
exports.queryRouter = express_1.default.Router();
// Initialize Gemini
let geminiClient = null;
const config = (0, fileHelpers_1.readLlmConfig)();
// Setup Gemini if API key is available
if ((config.geminiApiKey || process.env.GEMINI_API_KEY) && config.provider === 'gemini') {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    geminiClient = new generative_ai_1.GoogleGenerativeAI(apiKey);
    console.log('Gemini client initialized for query router');
}
/**
 * Process a template string by replacing variable placeholders
 */
function processTemplate(template, variables) {
    let processed = template;
    // Basic template processing
    for (const [key, value] of Object.entries(variables)) {
        // Replace {{variable}} pattern
        const pattern = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(pattern, value);
        // Handle conditional blocks {{#if variable}}content{{/if}}
        const ifPattern = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
        if (value) {
            processed = processed.replace(ifPattern, '$1');
        }
        else {
            processed = processed.replace(ifPattern, '');
        }
    }
    // Process remaining conditional blocks - treat as false and remove
    processed = processed.replace(/{{#if [^}]*}}[\s\S]*?{{\/if}}/g, '');
    return processed;
}
// Query the LLM
exports.queryRouter.post('/', async (req, res) => {
    var _a, _b, _c, _d;
    try {
        const { query, modeId } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        // Get chat mode (default if not specified)
        const chatMode = modeId ? (0, chatModes_1.getChatModeById)(modeId) : (0, chatModes_1.getDefaultChatMode)();
        // If Gemini isn't configured, return a simple response
        if (!geminiClient) {
            return res.json({
                response: "I'm in offline mode. Configure your Gemini API key in the Settings page to enable AI responses.",
                sources: [],
                modeId: chatMode === null || chatMode === void 0 ? void 0 : chatMode.id
            });
        }
        // Find relevant notes
        const notes = (0, fileHelpers_1.readNotes)();
        const relevantNotes = notes
            .map(note => ({
            ...note,
            relevance: (0, textUtils_1.calculateSimilarity)(query, note.content)
        }))
            .filter(note => note.relevance > 0.1)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 3);
        // Create context from relevant notes
        let context = '';
        if (relevantNotes.length > 0) {
            context = relevantNotes.map((note, i) => `[${i + 1}] ${note.content}`).join('\n\n');
        }
        // Get the model name from config or use default
        const modelName = config.model || "gemini-2.0-flash";
        const model = geminiClient.getGenerativeModel({ model: modelName });
        // Process the prompt template with variables
        const prompt = processTemplate((chatMode === null || chatMode === void 0 ? void 0 : chatMode.promptTemplate) || (0, chatModes_1.getDefaultChatMode)().promptTemplate, {
            query,
            context
        });
        // Generate content with more specific options
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: ((_a = config.generationConfig) === null || _a === void 0 ? void 0 : _a.temperature) || 0.7,
                maxOutputTokens: ((_b = config.generationConfig) === null || _b === void 0 ? void 0 : _b.maxOutputTokens) || 500,
                topP: ((_c = config.generationConfig) === null || _c === void 0 ? void 0 : _c.topP) || 1,
                topK: ((_d = config.generationConfig) === null || _d === void 0 ? void 0 : _d.topK) || 1,
            },
            safetySettings: [
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ]
        });
        const messageContent = result.response.text() || '';
        const response = {
            response: messageContent,
            sources: relevantNotes.map(note => ({
                id: note.id,
                content: note.content,
                relevance: note.relevance
            })),
            modeId: chatMode === null || chatMode === void 0 ? void 0 : chatMode.id
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error in query:', error);
        // Improved error handling
        if (error instanceof Error) {
            if (error.message.includes("400")) {
                res.status(400).json({ error: 'Bad Request: Invalid query format or parameters.' });
            }
            else if (error.message.includes("429")) {
                res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
            }
            else {
                res.status(500).json({
                    error: 'Failed to process query',
                    details: error.message
                });
            }
        }
        else {
            res.status(500).json({ error: 'Failed to process query' });
        }
    }
});
// Simple query without AI (for testing or if Gemini is not configured)
exports.queryRouter.post('/simple', (req, res) => {
    try {
        const { query, modeId } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        // Get chat mode (default if not specified)
        const chatMode = modeId ? (0, chatModes_1.getChatModeById)(modeId) : (0, chatModes_1.getDefaultChatMode)();
        // Find relevant notes
        const notes = (0, fileHelpers_1.readNotes)();
        const relevantNotes = notes
            .map(note => ({
            ...note,
            relevance: (0, textUtils_1.calculateSimilarity)(query, note.content)
        }))
            .filter(note => note.relevance > 0.1)
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 5);
        const response = {
            response: relevantNotes.length > 0
                ? `I found ${relevantNotes.length} notes that might be relevant to your query.`
                : "I couldn't find any notes relevant to your query.",
            sources: relevantNotes.map(note => ({
                id: note.id,
                content: note.content,
                relevance: note.relevance
            })),
            modeId: chatMode === null || chatMode === void 0 ? void 0 : chatMode.id
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error in simple query:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
});
