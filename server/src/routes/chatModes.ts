import express from 'express';
import { getAllChatModes, getChatModeById } from '../../data/chatModes';

export const chatModesRouter = express.Router();

// Get all available chat modes
chatModesRouter.get('/', (req, res) => {
  try {
    const modes = getAllChatModes();
    res.json(modes);
  } catch (error) {
    console.error('Error retrieving chat modes:', error);
    res.status(500).json({ error: 'Failed to retrieve chat modes' });
  }
});

// Get a specific chat mode by ID
chatModesRouter.get('/:id', (req, res) => {
  try {
    const mode = getChatModeById(req.params.id);
    
    if (!mode) {
      return res.status(404).json({ error: 'Chat mode not found' });
    }
    
    res.json(mode);
  } catch (error) {
    console.error('Error retrieving chat mode:', error);
    res.status(500).json({ error: 'Failed to retrieve chat mode' });
  }
});