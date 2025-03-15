const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure data files exist
const notesPath = path.join(dataDir, 'notes.json');
const connectionsPath = path.join(dataDir, 'connections.json');

if (!fs.existsSync(notesPath)) {
  fs.writeFileSync(notesPath, JSON.stringify([]));
}

if (!fs.existsSync(connectionsPath)) {
  fs.writeFileSync(connectionsPath, JSON.stringify([]));
}

// Helper to read data
const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// Helper to write data
const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// Calculate simple similarity between two texts
const calculateSimilarity = (text1, text2) => {
  // Very simple approach - count common words
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const uniqueWords = [...new Set([...words1, ...words2])];
  
  return commonWords.length / uniqueWords.length;
};

// Create connections for a note
const createConnections = (noteId, content) => {
  const notes = readData(notesPath);
  const connections = readData(connectionsPath);
  
  // Find other notes to connect to
  const otherNotes = notes.filter(note => note.id !== noteId);
  const newConnections = [];
  
  for (const otherNote of otherNotes) {
    const similarity = calculateSimilarity(content, otherNote.content);
    
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
  
  if (newConnections.length > 0) {
    writeData(connectionsPath, [...connections, ...newConnections]);
  }
  
  return newConnections;
};

// API Routes

// Get all notes
app.get('/api/notes', (req, res) => {
  const notes = readData(notesPath);
  res.json(notes);
});

// Create a new note
app.post('/api/notes', (req, res) => {
  const notes = readData(notesPath);
  
  const newNote = {
    id: Date.now().toString(),
    content: req.body.content || '',
    createdAt: new Date().toISOString()
  };
  
  notes.push(newNote);
  writeData(notesPath, notes);
  
  // Create connections for the new note
  const connections = createConnections(newNote.id, newNote.content);
  
  res.status(201).json({ 
    note: newNote,
    connections
  });
});

// Get all connections (graph data)
app.get('/api/graph', (req, res) => {
  const notes = readData(notesPath);
  const connections = readData(connectionsPath);
  
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
  
  res.json({ nodes, edges });
});

// Initialize OpenAI (if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Query the LLM
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // If OpenAI isn't configured, return a simple response
    if (!openai) {
      return res.json({ 
        response: "I'm in offline mode. Add your OpenAI API key to enable AI responses.",
        sources: []
      });
    }
    
    // Find relevant notes
    const notes = readData(notesPath);
    const relevantNotes = notes
      .map(note => ({
        ...note,
        relevance: calculateSimilarity(query, note.content)
      }))
      .filter(note => note.relevance > 0.1)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
    
    // Create context from relevant notes
    let context = '';
    if (relevantNotes.length > 0) {
      context = "Here are some notes that might be relevant:\n\n" +
        relevantNotes.map((note, i) => 
          `[${i+1}] ${note.content}`
        ).join('\n\n');
    }
    
    // Query OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that answers questions based on the user's notes."
        },
        {
          role: "user",
          content: `${context}\n\nQuery: ${query}`
        }
      ],
      max_tokens: 500
    });
    
    res.json({
      response: completion.choices[0].message.content,
      sources: relevantNotes.map(note => ({
        id: note.id,
        content: note.content,
        relevance: note.relevance
      }))
    });
    
  } catch (error) {
    console.error('Error in query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Add these routes to your server/index.js file

// Get LLM configuration
app.get('/api/llm/config', (req, res) => {
  try {
    const config = llmClient.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting LLM config:', error);
    res.status(500).json({ error: 'Failed to get LLM configuration' });
  }
});

// Update LLM configuration
app.put('/api/llm/config', (req, res) => {
  try {
    const success = llmClient.updateConfig(req.body);
    if (success) {
      res.json({ success: true, config: llmClient.getConfig() });
    } else {
      res.status(500).json({ error: 'Failed to update LLM configuration' });
    }
  } catch (error) {
    console.error('Error updating LLM config:', error);
    res.status(500).json({ error: 'Failed to update LLM configuration' });
  }
});

// Check LLM availability
app.get('/api/llm/status', async (req, res) => {
  try {
    const available = await llmClient.isLlmAvailable();
    res.json({ available });
  } catch (error) {
    console.error('Error checking LLM status:', error);
    res.status(500).json({ error: 'Failed to check LLM status' });
  }
});

// Add to your server/index.js imports
const llmClient = require('./services/llmClient');