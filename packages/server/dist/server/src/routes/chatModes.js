"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModesRouter = void 0;
const express_1 = __importDefault(require("express"));
const chatModes_1 = require("../../data/chatModes");
exports.chatModesRouter = express_1.default.Router();
// Get all available chat modes
exports.chatModesRouter.get('/', (req, res) => {
    try {
        const modes = (0, chatModes_1.getAllChatModes)();
        res.json(modes);
    }
    catch (error) {
        console.error('Error retrieving chat modes:', error);
        res.status(500).json({ error: 'Failed to retrieve chat modes' });
    }
});
// Get a specific chat mode by ID
exports.chatModesRouter.get('/:id', (req, res) => {
    try {
        const mode = (0, chatModes_1.getChatModeById)(req.params.id);
        if (!mode) {
            return res.status(404).json({ error: 'Chat mode not found' });
        }
        res.json(mode);
    }
    catch (error) {
        console.error('Error retrieving chat mode:', error);
        res.status(500).json({ error: 'Failed to retrieve chat mode' });
    }
});
