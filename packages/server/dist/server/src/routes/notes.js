"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notesRouter = void 0;
const express_1 = __importDefault(require("express"));
const fileHelpers_1 = require("../utils/fileHelpers");
const textUtils_1 = require("../utils/textUtils");
const categoryService_1 = require("../services/categoryService");
exports.notesRouter = express_1.default.Router();
// Create connections for a note
const createConnections = (noteId, content) => {
    const notes = (0, fileHelpers_1.readNotes)();
    // Find other notes to connect to
    const otherNotes = notes.filter(note => note.id !== noteId);
    const newConnections = [];
    for (const otherNote of otherNotes) {
        const similarity = (0, textUtils_1.calculateSimilarity)(content, otherNote.content);
        // Only create connection if similarity is above threshold
        if (similarity > 0.1) {
            const connection = {
                id: Date.now() + Math.random().toString(36).substring(2, 9),
                sourceId: noteId,
                targetId: otherNote.id,
                strength: similarity,
                type: 'automatic',
                createdAt: new Date().toISOString()
            };
            newConnections.push(connection);
        }
    }
    return newConnections;
};
// Get all notes
exports.notesRouter.get('/', (req, res) => {
    try {
        const notes = (0, fileHelpers_1.readNotes)();
        res.json(notes);
    }
    catch (error) {
        console.error('Error retrieving notes:', error);
        res.status(500).json({ error: 'Failed to retrieve notes' });
    }
});
// Get a single note by ID
exports.notesRouter.get('/:id', (req, res) => {
    try {
        const notes = (0, fileHelpers_1.readNotes)();
        const note = notes.find(n => n.id === req.params.id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(note);
    }
    catch (error) {
        console.error('Error retrieving note:', error);
        res.status(500).json({ error: 'Failed to retrieve note' });
    }
});
// Create a new note
exports.notesRouter.post('/', async (req, res) => {
    try {
        const notes = (0, fileHelpers_1.readNotes)();
        if (!req.body.content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const newNote = {
            id: Date.now().toString(),
            content: req.body.content,
            createdAt: new Date().toISOString()
        };
        notes.push(newNote);
        (0, fileHelpers_1.writeNotes)(notes);
        // Create connections for the new note
        const connections = createConnections(newNote.id, newNote.content);
        // Categorize the note
        const categoryResult = await (0, categoryService_1.categorizeNote)(newNote);
        res.status(201).json({
            note: newNote,
            connections,
            categories: categoryResult.categories
        });
    }
    catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});
// Update a note
exports.notesRouter.put('/:id', async (req, res) => {
    try {
        const notes = (0, fileHelpers_1.readNotes)();
        const noteIndex = notes.findIndex(n => n.id === req.params.id);
        if (noteIndex === -1) {
            return res.status(404).json({ error: 'Note not found' });
        }
        if (!req.body.content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        const updatedNote = {
            ...notes[noteIndex],
            content: req.body.content,
            // You might want to add an updatedAt field here
        };
        notes[noteIndex] = updatedNote;
        (0, fileHelpers_1.writeNotes)(notes);
        // Recategorize the note
        const categoryResult = await (0, categoryService_1.categorizeNote)(updatedNote);
        res.json({
            note: updatedNote,
            categories: categoryResult.categories
        });
    }
    catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});
// Delete a note
exports.notesRouter.delete('/:id', (req, res) => {
    try {
        const notes = (0, fileHelpers_1.readNotes)();
        const filteredNotes = notes.filter(n => n.id !== req.params.id);
        if (filteredNotes.length === notes.length) {
            return res.status(404).json({ error: 'Note not found' });
        }
        (0, fileHelpers_1.writeNotes)(filteredNotes);
        res.json({ message: 'Note deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});
// Get recent notes with pagination
exports.notesRouter.get('/list/recent', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const notes = (0, fileHelpers_1.readNotes)();
        // Sort by creation date (newest first)
        const sortedNotes = [...notes].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedNotes = sortedNotes.slice(startIndex, endIndex);
        // Calculate total pages
        const totalNotes = notes.length;
        const totalPages = Math.ceil(totalNotes / limit);
        res.json({
            notes: paginatedNotes,
            pagination: {
                currentPage: page,
                totalPages,
                totalNotes,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    }
    catch (error) {
        console.error('Error retrieving recent notes:', error);
        res.status(500).json({ error: 'Failed to retrieve recent notes' });
    }
});
