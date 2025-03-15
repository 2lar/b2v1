import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { notesRouter } from './routes/notes';
import { graphRouter } from './routes/graph';
import { queryRouter } from './routes/query';
import { llmRouter } from './routes/llm';
import { categoryRouter } from './routes/category';
import { chatModesRouter } from './routes/chatModes';
import { ensureDataDirectory } from './utils/fileHelpers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Log configuration
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);

// Output whether Gemini API key is configured
if (process.env.GEMINI_API_KEY) {
  console.log('Gemini API key is configured.');
} else {
  console.log('Warning: Gemini API key is not configured. AI features will be limited.');
}

// Ensure data directory and files exist
ensureDataDirectory();

// API Routes
app.use('/api/notes', notesRouter);
app.use('/api/graph', graphRouter);
app.use('/api/query', queryRouter);
app.use('/api/llm', llmRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/chatModes', chatModesRouter);

// Determine the correct client build path
let clientBuildPath = path.join(__dirname, '../../client/build');

// Check if directory exists, if not try alternate path for Render
if (!require('fs').existsSync(clientBuildPath)) {
  const alternatePath = path.join(__dirname, '../../client/build');
  
  if (require('fs').existsSync(alternatePath)) {
    clientBuildPath = alternatePath;
    console.log(`Using alternate client build path: ${clientBuildPath}`);
  } else {
    console.log(`Warning: Client build not found at expected locations. Tried:\n- ${clientBuildPath}\n- ${alternatePath}`);
  }
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log(`Serving static files from: ${clientBuildPath}`);
  
  // Serve static files
  app.use(express.static(clientBuildPath));
  
  // All other requests go to the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start the server
export function startServer() {
  return app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Log some path info for debugging
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Server file location: ${__dirname}`);
  });
}

// Export app for testing
export default app;