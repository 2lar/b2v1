import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
// Import from shared package
import { Note, Connection } from '@b2/shared';
import { calculateSimilarity } from '../utils/textUtils';
import { categorizeNote } from '../services/categoryService';
import { readNotes, writeNotes, readConnections, writeConnections, readCategories, writeCategories } from '../utils/fileHelpers';

export const notesRouter = express.Router();

// Create connections for a note
const createConnections = (noteId: string, content: string): Connection[] => {
  const notes = readNotes();
  const connections = readConnections();
  
  // Find other notes to connect to
  const otherNotes = notes.filter(note => note.id !== noteId);
  const newConnections: Connection[] = [];
  
  for (const otherNote of otherNotes) {
    const similarity = calculateSimilarity(content, otherNote.content);
    
    // Only create connection if similarity is above threshold
    if (similarity > 0.1) {
      const connection: Connection = {
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
  if (newConnections.length > 0) {
    writeConnections([...connections, ...newConnections]);
  }
  
  return newConnections;
};

// Get all notes
notesRouter.get('/', (req: Request, res: Response) => {
  try {
    const notes = readNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error retrieving notes:', error);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// Get a specific note by ID
notesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const notes = readNotes();
    const note = notes.find(note => note.id === req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error retrieving note:', error);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
});

// Create a new note
notesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const notes = readNotes();
    
    if (!req.body.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const newNote: Note = {
      id: Date.now().toString(),
      content: req.body.content,
      createdAt: new Date().toISOString()
    };
    
    notes.push(newNote);
    writeNotes(notes);
    
    // Create connections for the new note
    const connections = createConnections(newNote.id, newNote.content);
    
    // Categorize the note
    const categoryResult = await categorizeNote(newNote);
    
    res.status(201).json({ 
      note: newNote,
      connections,
      categories: categoryResult?.categories || []
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update an existing note
notesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const notes = readNotes();
    const noteIndex = notes.findIndex(note => note.id === req.params.id);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (!req.body.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const updatedNote: Note = {
      ...notes[noteIndex],
      content: req.body.content,
      updatedAt: new Date().toISOString()
    };
    
    notes[noteIndex] = updatedNote;
    writeNotes(notes);
    
    // Recategorize the note
    const categoryResult = await categorizeNote(updatedNote);
    
    res.json({ 
      note: updatedNote,
      categories: categoryResult?.categories || []
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note and its associated connections
notesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const noteId = req.params.id;
    
    // Get current data
    const notes = readNotes();
    const connections = readConnections();
    const categoriesData = readCategories();
    
    // Check if note exists
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Remove note
    notes.splice(noteIndex, 1);
    writeNotes(notes);
    
    // Remove any connections involving this note
    const filteredConnections = connections.filter(
      conn => conn.sourceId !== noteId && conn.targetId !== noteId
    );
    writeConnections(filteredConnections);
    
    // Remove note from category mappings
    if (categoriesData.noteCategoryMap[noteId]) {
      delete categoriesData.noteCategoryMap[noteId];
      writeCategories(categoriesData);
    }
    
    res.json({ 
      message: 'Note deleted successfully',
      connectionsRemoved: connections.length - filteredConnections.length
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get recent notes with pagination
notesRouter.get('/list/recent', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const notes = readNotes();
    
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
  } catch (error) {
    console.error('Error retrieving recent notes:', error);
    res.status(500).json({ error: 'Failed to retrieve recent notes' });
  }
});