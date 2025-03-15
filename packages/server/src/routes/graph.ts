import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { GraphData, Note, Connection } from '@b2/shared';
import { calculateSimilarity } from '../utils/textUtils';
import { updateCategoriesFromConnection } from '../services/categoryService';
import { 
  Note as NoteModel,
  Connection as ConnectionModel
} from '../models';

export const graphRouter = express.Router();

// Get graph data (notes + connections)
graphRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Get notes and connections from MongoDB
    const notes = await NoteModel.find();
    const connections = await ConnectionModel.find();
    
    // Format for visualization
    const nodes = notes.map(note => ({
      id: note.id,
      label: note.content.substring(0, 30) + (note.content.length > 30 ? '...' : ''),
      content: note.content,
      createdAt: note.createdAt.toString()
    }));
    
    const edges = connections.map(conn => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      strength: conn.strength,
      type: conn.type
    }));
    
    const graphData: GraphData = { nodes, edges };
    res.json(graphData);
  } catch (error) {
    console.error('Error retrieving graph data:', error);
    res.status(500).json({ error: 'Failed to retrieve graph data' });
  }
});

// Create a new connection
graphRouter.post('/connections', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, type = 'manual' } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Source and target IDs are required' });
    }
    
    // Verify that both notes exist
    const sourceNote = await NoteModel.findById(sourceId);
    const targetNote = await NoteModel.findById(targetId);
    
    if (!sourceNote || !targetNote) {
      return res.status(404).json({ error: 'One or both notes not found' });
    }
    
    // Calculate similarity for weight
    const similarity = calculateSimilarity(sourceNote.content, targetNote.content);
    
    // Create a new connection
    const newConnection = await ConnectionModel.create({
      sourceId,
      targetId,
      strength: type === 'manual' ? Math.max(similarity, 0.5) : similarity, // Manual connections have higher min strength
      type,
      createdAt: new Date()
    });
    
    // Update categories based on this new connection
    const categoryUpdate = await updateCategoriesFromConnection(sourceId, targetId, newConnection.strength);
    
    res.status(201).json({ 
      connection: newConnection,
      categoryUpdate
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

// Delete a connection
graphRouter.delete('/connections/:id', async (req: Request, res: Response) => {
  try {
    const result = await ConnectionModel.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// Get connections for a specific note
graphRouter.get('/connections/note/:noteId', async (req: Request, res: Response) => {
  try {
    const noteId = req.params.noteId;
    
    const noteConnections = await ConnectionModel.find({
      $or: [{ sourceId: noteId }, { targetId: noteId }]
    });
    
    res.json(noteConnections);
  } catch (error) {
    console.error('Error retrieving note connections:', error);
    res.status(500).json({ error: 'Failed to retrieve note connections' });
  }
});

// Recalculate all connections (useful after importing data)
graphRouter.post('/recalculate', async (req: Request, res: Response) => {
  try {
    // Get all notes
    const notes = await NoteModel.find();
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all automatic connections (keep manual ones)
      await ConnectionModel.deleteMany({ type: 'automatic' }, { session });
      
      // New connections to create
      const newConnectionsData = [];
      
      // Create connections between all notes with sufficient similarity
      for (let i = 0; i < notes.length; i++) {
        for (let j = i + 1; j < notes.length; j++) {
          const note1 = notes[i];
          const note2 = notes[j];
          
          const similarity = calculateSimilarity(note1.content, note2.content);
          
          if (similarity > 0.1) {
            newConnectionsData.push({
              sourceId: note1.id,
              targetId: note2.id,
              strength: similarity,
              type: 'automatic',
              createdAt: new Date()
            });
          }
        }
      }
      
      // Insert all new connections at once if any
      if (newConnectionsData.length > 0) {
        await ConnectionModel.insertMany(newConnectionsData, { session });
      }
      
      // For each connection, update categories
      for (const connData of newConnectionsData) {
        await updateCategoriesFromConnection(
          connData.sourceId, 
          connData.targetId, 
          connData.strength
        );
      }
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.json({ 
        message: 'Connections recalculated successfully',
        connectionCount: newConnectionsData.length
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error recalculating connections:', error);
    res.status(500).json({ error: 'Failed to recalculate connections' });
  }
});

// Add debug endpoint 
graphRouter.get('/debug', async (req: Request, res: Response) => {
  try {
    const noteCount = await NoteModel.countDocuments();
    const connectionCount = await ConnectionModel.countDocuments();
    
    const sampleNotes = await NoteModel.find().limit(2);
    const sampleConnections = await ConnectionModel.find().limit(2);
    
    const sampleSimilarity = sampleNotes.length >= 2 ? 
      calculateSimilarity(sampleNotes[0].content, sampleNotes[1].content) : 
      'Not enough notes';
    
    res.json({
      notesCount: noteCount,
      notes: sampleNotes,
      connectionsCount: connectionCount,
      connections: sampleConnections,
      sampleSimilarity
    });
  } catch (error) {
    console.error('Error in graph debug:', error);
    res.status(500).json({ error: 'Failed to retrieve debug information' });
  }
});