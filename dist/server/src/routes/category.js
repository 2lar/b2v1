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
exports.categoryRouter = void 0;
const express_1 = __importDefault(require("express"));
const categoryService = __importStar(require("../services/categoryService"));
exports.categoryRouter = express_1.default.Router();
// Get all categories
exports.categoryRouter.get('/', (req, res) => {
    try {
        const categories = categoryService.getAllCategories();
        res.json(categories);
    }
    catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
});
// Get category hierarchy
exports.categoryRouter.get('/hierarchy', (req, res) => {
    try {
        const hierarchy = categoryService.getCategoryHierarchy();
        res.json(hierarchy);
    }
    catch (error) {
        console.error('Error retrieving category hierarchy:', error);
        res.status(500).json({ error: 'Failed to retrieve category hierarchy' });
    }
});
// Get notes by category
exports.categoryRouter.get('/:categoryId/notes', (req, res) => {
    try {
        const notes = categoryService.getNotesByCategory(req.params.categoryId);
        res.json(notes);
    }
    catch (error) {
        console.error('Error retrieving notes by category:', error);
        res.status(500).json({ error: 'Failed to retrieve notes by category' });
    }
});
// Get categories for a note
exports.categoryRouter.get('/note/:noteId', (req, res) => {
    try {
        const categories = categoryService.getNoteCategories(req.params.noteId);
        res.json(categories);
    }
    catch (error) {
        console.error('Error retrieving note categories:', error);
        res.status(500).json({ error: 'Failed to retrieve note categories' });
    }
});
// Rebuild all categories
exports.categoryRouter.post('/rebuild', async (req, res) => {
    try {
        const results = await categoryService.rebuildAllCategories();
        res.json({
            message: 'Categories rebuilt successfully',
            notesProcessed: results.length,
            results
        });
    }
    catch (error) {
        console.error('Error rebuilding categories:', error);
        res.status(500).json({ error: 'Failed to rebuild categories' });
    }
});
