"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultAgentId = exports.getConfig = exports.isLlmAvailable = exports.updateConfig = exports.generateText = void 0;
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const fileHelpers_1 = require("../utils/fileHelpers");
const textUtils_1 = require("../utils/textUtils");
// Initialize clients
let geminiClient = null;
let currentConfig = (0, fileHelpers_1.readLlmConfig)();
// Set default values for Gemini
const defaultGeminiConfig = {
    model: "gemini-2.0-flash",
    selectedAgentId: "default",
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
        topK: 1,
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
    ],
};
// Initialize Gemini if configured
if (currentConfig.provider === 'gemini' && (currentConfig.geminiApiKey || process.env.GEMINI_API_KEY)) {
    try {
        const apiKey = currentConfig.geminiApiKey || process.env.GEMINI_API_KEY || '';
        geminiClient = new generative_ai_1.GoogleGenerativeAI(apiKey);
        // Add default Gemini configuration if not already present
        if (!currentConfig.model) {
            currentConfig = {
                ...currentConfig,
                ...defaultGeminiConfig
            };
        }
    }
    catch (error) {
        console.error('Error initializing Gemini client:', error);
    }
}
/**
 * Generate text with Gemini
 */
const generateWithGemini = async (prompt, options = {}) => {
    var _a, _b, _c, _d;
    if (!geminiClient) {
        throw new Error('Gemini is not configured');
    }
    try {
        // Use Gemini model from config or default to gemini-pro
        const modelName = currentConfig.model || "gemini-2.0-flash";
        const model = geminiClient.getGenerativeModel({ model: modelName });
        // Generate content
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature || ((_a = currentConfig.generationConfig) === null || _a === void 0 ? void 0 : _a.temperature) || 0.7,
                maxOutputTokens: options.maxTokens || ((_b = currentConfig.generationConfig) === null || _b === void 0 ? void 0 : _b.maxOutputTokens) || 1000,
                topP: ((_c = currentConfig.generationConfig) === null || _c === void 0 ? void 0 : _c.topP) || 1,
                topK: ((_d = currentConfig.generationConfig) === null || _d === void 0 ? void 0 : _d.topK) || 1,
            },
            safetySettings: currentConfig.safetySettings ?
                currentConfig.safetySettings.map(s => ({
                    category: s.category,
                    threshold: s.threshold
                })) :
                defaultGeminiConfig.safetySettings
        });
        return result.response.text();
    }
    catch (error) {
        console.error('Error with Gemini generation:', error);
        throw error;
    }
};
/**
 * Generate text with a local model (assumes Ollama is running)
 */
const generateWithLocalModel = async (prompt, options = {}) => {
    const config = (0, fileHelpers_1.readLlmConfig)();
    try {
        const response = await axios_1.default.post(config.localLlmUrl, {
            model: config.localLlmModel,
            prompt,
            stream: false,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1000,
        });
        return response.data.response;
    }
    catch (error) {
        console.error('Error with local model generation:', error);
        throw error;
    }
};
/**
 * Generate text with fallback (no AI)
 */
const generateWithFallback = (prompt) => {
    // Extract keywords from the prompt to make a simple response
    const relevantWords = (0, textUtils_1.extractKeywords)(prompt, 5);
    if (prompt.includes('categories') || prompt.includes('categorize')) {
        // Simple categorization logic based on word frequency
        return JSON.stringify({
            categories: [
                { name: relevantWords[0] ? relevantWords[0].charAt(0).toUpperCase() + relevantWords[0].slice(1) : 'General', level: 0 },
                { name: relevantWords[1] ? relevantWords[1].charAt(0).toUpperCase() + relevantWords[1].slice(1) : 'Uncategorized', level: 1 }
            ]
        });
    }
    return 'I need an LLM configuration to generate better responses. Please configure either Gemini or a local model.';
};
/**
 * Generate text with whatever model is configured
 */
const generateText = async (prompt, options = {}) => {
    const config = (0, fileHelpers_1.readLlmConfig)();
    try {
        switch (config.provider) {
            case 'gemini':
                return await generateWithGemini(prompt, options);
            case 'local':
                return await generateWithLocalModel(prompt, options);
            default:
                return generateWithFallback(prompt);
        }
    }
    catch (error) {
        console.error('Text generation failed:', error);
        return generateWithFallback(prompt);
    }
};
exports.generateText = generateText;
/**
 * Update the LLM configuration
 */
const updateConfig = (newConfig) => {
    try {
        currentConfig = { ...currentConfig, ...newConfig };
        // Make sure we have a default selectedAgentId if not provided
        if (!currentConfig.selectedAgentId) {
            currentConfig.selectedAgentId = 'default';
        }
        // Initialize clients if needed
        if (currentConfig.provider === 'gemini' && currentConfig.geminiApiKey) {
            try {
                geminiClient = new generative_ai_1.GoogleGenerativeAI(currentConfig.geminiApiKey);
            }
            catch (error) {
                console.error('Error initializing Gemini client:', error);
            }
        }
        return (0, fileHelpers_1.writeLlmConfig)(currentConfig);
    }
    catch (error) {
        console.error('Error updating config:', error);
        return false;
    }
};
exports.updateConfig = updateConfig;
/**
 * Check if LLM is available
 */
const isLlmAvailable = async () => {
    if (currentConfig.provider === 'none') {
        return false;
    }
    if (currentConfig.provider === 'gemini' && geminiClient) {
        try {
            // Try to get the model to verify the API key works
            const modelName = currentConfig.model || "gemini-2.0-flash";
            geminiClient.getGenerativeModel({ model: modelName });
            return true;
        }
        catch (error) {
            console.error('Error checking Gemini availability:', error);
            return false;
        }
    }
    if (currentConfig.provider === 'local') {
        try {
            await axios_1.default.get(currentConfig.localLlmUrl.replace('/generate', '/models'));
            return true;
        }
        catch (error) {
            return false;
        }
    }
    return false;
};
exports.isLlmAvailable = isLlmAvailable;
/**
 * Get the current configuration
 */
const getConfig = () => {
    // Don't return the actual API key
    return {
        ...currentConfig,
        geminiApiKey: currentConfig.geminiApiKey ? '[CONFIGURED]' : '',
    };
};
exports.getConfig = getConfig;
/**
 * Get the default agent ID from config
 */
const getDefaultAgentId = () => {
    return currentConfig.selectedAgentId || 'default';
};
exports.getDefaultAgentId = getDefaultAgentId;
exports.default = {
    generateText: exports.generateText,
    updateConfig: exports.updateConfig,
    getConfig: exports.getConfig,
    isLlmAvailable: exports.isLlmAvailable,
    getDefaultAgentId: exports.getDefaultAgentId,
};
