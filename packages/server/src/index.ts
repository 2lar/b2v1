import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { connectDB } from './config/db';
import { ensureDatabaseInitialized } from './utils/mongoHelpers';

// Import routes
import { notesRouter } from './routes/notes';
import { graphRouter } from './routes/graph';
import { queryRouter } from './routes/query';
import { llmRouter } from './routes/llm';
import { categoryRouter } from './routes/category';
import { chatModesRouter } from './routes/chatModes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(async () => {
  // Initialize database with any required default data
  console.log("tring to connect");
  await ensureDatabaseInitialized();
  console.log('Database initialized');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/notes', notesRouter);
app.use('/api/graph', graphRouter);
app.use('/api/query', queryRouter);
app.use('/api/llm', llmRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/chatModes', chatModesRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(process.cwd(), 'packages/server/dist/client/build');
  // Add these lines for debugging paths
  console.log(`__dirname is: ${__dirname}`);
  console.log(`Resolved client path is: ${path.join(__dirname, '../client/build')}`);
  console.log(`This path exists: ${fs.existsSync(path.join(__dirname, '../client/build'))}`);
  
  if (fs.existsSync(clientBuildPath)) {
    console.log(`Serving static files from: ${clientBuildPath}`);
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // All other requests go to the React app
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  } else {
    console.warn(`Client build directory not found at: ${clientBuildPath}`);
  }
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Current working directory: ${process.cwd()}`);
});