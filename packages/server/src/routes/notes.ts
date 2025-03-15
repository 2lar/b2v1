// packages/server/src/routes/notes.ts
import express, { Request, Response } from 'express';
import { Note, Connection } from '@b2/shared';
import { calculateSimilarity } from '../utils/textUtils';
import { categorizeNote } from '../services/categoryService';
import { 
  Note as NoteModel,
  Connection as ConnectionModel,
  NoteCategory as NoteCategoryModel
} from '../models';

export const notesRouter = express.Router();

// Create connections for a note
const createConnections = async (noteId: string, content: string): Promise<Connection[]> => {
  try {
    // Find other notes to connect to
    const notes = await NoteModel.find({ _id: { $ne: noteId } });
    const newConnections: Connection[] = [];
    
    for (const otherNote of notes) {
      const similarity = calculateSimilarity(content, otherNote.content);
      
      // Only create connection if similarity is above threshold
      if (similarity > 0.1) {
        const connection = new ConnectionModel({
          sourceId: noteId,
          targetId: otherNote.id,
          strength: similarity,
          type: 'automatic',
          createdAt: new Date()
        });
        
        await connection.save();
        newConnections.push(connection.toObject() as Connection);
      }
    }
    
    return newConnections;
  } catch (error) {
    console.error('Error creating connections:', error);
    return [];
  }
};

// Get all notes
notesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const notes = await NoteModel.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error retrieving notes:', error);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// Get a specific note by ID
notesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const note = await NoteModel.findById(req.params.id);
    
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
    if (!req.body.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Create a new note
    const newNote = new NoteModel({
      content: req.body.content,
      createdAt: new Date()
    });
    
    await newNote.save();
    
    // Create connections for the new note
    const connections = await createConnections(newNote.id, newNote.content);
    
    // Categorize the note
    const categoryResult = await categorizeNote(newNote.toObject() as Note);
    
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
    if (!req.body.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Find and update the note
    const updatedNote = await NoteModel.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Recategorize the note
    const categoryResult = await categorizeNote(updatedNote.toObject() as Note);
    
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
notesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const noteId = req.params.id;
    
    // Check if note exists
    const note = await NoteModel.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Start a session for transaction
    const session = await NoteModel.startSession();
    session.startTransaction();
    
    try {
      // Delete note
      await NoteModel.findByIdAndDelete(noteId, { session });
      
      // Delete connections involving this note
      const deletedConnections = await ConnectionModel.deleteMany(
        { $or: [{ sourceId: noteId }, { targetId: noteId }] },
        { session }
      );
      
      // Delete note-category mappings
      await NoteCategoryModel.deleteMany({ noteId }, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.json({ 
        message: 'Note deleted successfully',
        connectionsRemoved: deletedConnections.deletedCount
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get recent notes with pagination
notesRouter.get('/list/recent', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination metadata
    const totalNotes = await NoteModel.countDocuments();
    
    // Get paginated notes
    const notes = await NoteModel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalNotes / limit);
    
    res.json({
      notes,
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