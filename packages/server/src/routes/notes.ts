import express from 'express';
import fs from 'fs';
import path from 'path';
// Import from shared package
import { Note, Connection } from '@b2/shared';
import { calculateSimilarity } from '../utils/textUtils';
import { categorizeNote } from '../services/categoryService';
import { readNotes, writeNotes, readConnections, writeConnections } from '../utils/fileHelpers';

export const notesRouter = express.Router();

// // these functions are already defined in the filehelper
// // Helper functions for file operations
// const readNotes = (): Note[] => {
//   const filePath = path.join(__dirname, '../../data/notes.json');
//   try {
//     const data = fs.readFileSync(filePath, 'utf8');
//     return JSON.parse(data);
//   } catch (error) {
//     console.error(`Error reading notes:`, error);
//     return [];
//   }
// };

// const writeNotes = (notes: Note[]): void => {
//   const filePath = path.join(__dirname, '../../data/notes.json');
//   try {
//     fs.writeFileSync(filePath, JSON.stringify(notes, null, 2));
//   } catch (error) {
//     console.error(`Error writing notes:`, error);
//   }
// };

// const readConnections = (): Connection[] => {
//   const filePath = path.join(__dirname, '../../data/connections.json');
//   try {
//     const data = fs.readFileSync(filePath, 'utf8');
//     return JSON.parse(data);
//   } catch (error) {
//     console.error(`Error reading connections:`, error);
//     return [];
//   }
// };

// const writeConnections = (connections: Connection[]): void => {
//   const filePath = path.join(__dirname, '../../data/connections.json');
//   try {
//     fs.writeFileSync(filePath, JSON.stringify(connections, null, 2));
//   } catch (error) {
//     console.error(`Error writing connections:`, error);
//   }
// };

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
notesRouter.get('/', (req, res) => {
  try {
    const notes = readNotes();
    res.json(notes);
  } catch (error) {
    console.error('Error retrieving notes:', error);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// Create a new note
notesRouter.post('/', async (req, res) => {
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

// Get recent notes with pagination
notesRouter.get('/list/recent', (req, res) => {
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