"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmRouter = void 0;
const express_1 = __importDefault(require("express"));
const llmClient = __importStar(require("../services/llmClient"));
exports.llmRouter = express_1.default.Router();
// Get LLM configuration
exports.llmRouter.get('/config', (req, res) => {
    try {
        const config = llmClient.getConfig();
        res.json(config);
    }
    catch (error) {
        console.error('Error getting LLM config:', error);
        res.status(500).json({ error: 'Failed to get LLM configuration' });
    }
});
// Update LLM configuration
exports.llmRouter.put('/config', (req, res) => {
    try {
        const newConfig = req.body;
        const success = llmClient.updateConfig(newConfig);
        if (success) {
            res.json({
                success: true,
                config: llmClient.getConfig()
            });
        }
        else {
            res.status(500).json({ error: 'Failed to update LLM configuration' });
        }
    }
    catch (error) {
        console.error('Error updating LLM config:', error);
        res.status(500).json({ error: 'Failed to update LLM configuration' });
    }
});
// Check LLM availability
exports.llmRouter.get('/status', async (req, res) => {
    try {
        const available = await llmClient.isLlmAvailable();
        res.json({ available });
    }
    catch (error) {
        console.error('Error checking LLM status:', error);
        res.status(500).json({ error: 'Failed to check LLM status' });
    }
});
// Test LLM with a simple prompt
exports.llmRouter.post('/test', async (req, res) => {
    try {
        const { prompt = "Summarize what you can do in one sentence." } = req.body;
        const isAvailable = await llmClient.isLlmAvailable();
        if (!isAvailable) {
            return res.status(400).json({
                error: 'LLM is not available. Please check your configuration.',
                available: false
            });
        }
        const response = await llmClient.generateText(prompt, {
            temperature: 0.7,
            maxTokens: 100
        });
        res.json({
            available: true,
            response
        });
    }
    catch (error) {
        console.error('Error testing LLM:', error);
        res.status(500).json({
            error: 'Failed to test LLM',
            available: false
        });
    }
});
