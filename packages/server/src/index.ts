import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory: ${dataDir}`);
}

// Ensure all required data files exist
const requiredFiles = {
  'notes.json': '[]',
  'connections.json': '[]',
  'categories.json': '{"categories":[],"noteCategoryMap":{},"hierarchy":{}}',
  'llm-config.json': '{"provider":"gemini","geminiApiKey":"","localLlmUrl":"http://localhost:11434/api/generate","localLlmModel":"mistral"}'
};

Object.entries(requiredFiles).forEach(([filename, defaultContent]) => {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContent);
    console.log(`Created ${filename} with default values`);
  }
});

// Import routes
import { notesRouter } from './routes/notes';
import { graphRouter } from './routes/graph';
import { queryRouter } from './routes/query';
import { llmRouter } from './routes/llm';
import { categoryRouter } from './routes/category';
import { chatModesRouter } from './routes/chatModes';

// API Routes
app.use('/api/notes', notesRouter);
app.use('/api/graph', graphRouter);
app.use('/api/query', queryRouter);
app.use('/api/llm', llmRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/chatModes', chatModesRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  
  if (fs.existsSync(clientBuildPath)) {
    console.log(`Serving static files from: ${clientBuildPath}`);
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // All other requests go to the React app
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.warn(`Client build directory not found at: ${clientBuildPath}`);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Current working directory: ${process.cwd()}`);
});