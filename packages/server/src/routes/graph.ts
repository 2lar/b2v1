import express from 'express';
import { readNotes, readConnections, writeConnections } from '../utils/fileHelpers';
import { calculateSimilarity } from '../utils/textUtils';
import { updateCategoriesFromConnection } from '../services/categoryService';
import { Connection, GraphData, Note } from '@b2/shared';

export const graphRouter = express.Router();

// Get graph data (notes + connections)
graphRouter.get('/', (req, res) => {
  try {
    const notes: Note[] = readNotes();
    const connections = readConnections();
    
    // Format for visualization
    const nodes = notes.map(note => ({
      id: note.id,
      label: note.content.substring(0, 30) + (note.content.length > 30 ? '...' : ''),
      content: note.content,
      createdAt: note.createdAt
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
graphRouter.post('/connections', async (req, res) => {
  try {
    const { sourceId, targetId, type = 'manual' } = req.body;
    
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'Source and target IDs are required' });
    }
    
    const notes: Note[] = readNotes();
    const connections = readConnections();
    
    // Verify that both notes exist
    const sourceNote = notes.find(note => note.id === sourceId);
    const targetNote = notes.find(note => note.id === targetId);
    
    if (!sourceNote || !targetNote) {
      return res.status(404).json({ error: 'One or both notes not found' });
    }
    
    // Calculate similarity for weight
    const similarity = calculateSimilarity(sourceNote.content, targetNote.content);
    
    const newConnection: Connection = {
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      sourceId,
      targetId,
      strength: type === 'manual' ? Math.max(similarity, 0.5) : similarity, // Manual connections have higher min strength
      type,
      createdAt: new Date().toISOString()
    };
    
    connections.push(newConnection);
    writeConnections(connections);
    
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
graphRouter.delete('/connections/:id', (req, res) => {
  try {
    const connections = readConnections();
    const filteredConnections = connections.filter(c => c.id !== req.params.id);
    
    if (filteredConnections.length === connections.length) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    writeConnections(filteredConnections);
    
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

// Get connections for a specific note
graphRouter.get('/connections/note/:noteId', (req, res) => {
  try {
    const noteId = req.params.noteId;
    const connections = readConnections();
    
    const noteConnections = connections.filter(
      conn => conn.sourceId === noteId || conn.targetId === noteId
    );
    
    res.json(noteConnections);
  } catch (error) {
    console.error('Error retrieving note connections:', error);
    res.status(500).json({ error: 'Failed to retrieve note connections' });
  }
});

// Recalculate all connections (useful after importing data)
graphRouter.post('/recalculate', async (req, res) => {
  try {
    const notes = readNotes();
    const newConnections: Connection[] = [];
    
    // Create connections between all notes with sufficient similarity
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const note1: Note = notes[i];
        const note2: Note = notes[j];
        
        const similarity = calculateSimilarity(note1.content, note2.content);
        
        if (similarity > 0.1) {
          const connection: Connection = {
            id: Date.now() + '_' + Math.random().toString(36).substring(2, 9),
            sourceId: note1.id,
            targetId: note2.id,
            strength: similarity,
            type: 'automatic',
            createdAt: new Date().toISOString()
          };
          
          newConnections.push(connection);
          
          // Update categories based on this connection
          await updateCategoriesFromConnection(note1.id, note2.id, similarity);
        }
      }
    }
    
    writeConnections(newConnections);
    
    res.json({ 
      message: 'Connections recalculated successfully',
      connectionCount: newConnections.length
    });
  } catch (error) {
    console.error('Error recalculating connections:', error);
    res.status(500).json({ error: 'Failed to recalculate connections' });
  }
});