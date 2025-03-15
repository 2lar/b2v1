import express, { Request, Response } from 'express';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { readNotes, readLlmConfig } from '../utils/fileHelpers';
import { calculateSimilarity } from '../utils/textUtils';
import { QueryResponse, QueryRequest, Note } from '@b2/shared';
import { getDefaultChatMode, getChatModeById } from '../../data/chatModes';

export const queryRouter = express.Router();

// Initialize Gemini
let geminiClient: GoogleGenerativeAI | null = null;
const config = readLlmConfig();

// Setup Gemini if API key is available
if ((config.geminiApiKey || process.env.GEMINI_API_KEY) && config.provider === 'gemini') {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
  geminiClient = new GoogleGenerativeAI(apiKey);
  console.log('Gemini client initialized for query router');
}

/**
 * Process a template string by replacing variable placeholders
 */
function processTemplate(template: string, variables: Record<string, string>): string {
  let processed = template;
  
  // Basic template processing
  for (const [key, value] of Object.entries(variables)) {
    // Replace {{variable}} pattern
    const pattern = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(pattern, value);
    
    // Handle conditional blocks {{#if variable}}content{{/if}}
    const ifPattern = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
    if (value) {
      processed = processed.replace(ifPattern, '$1');
    } else {
      processed = processed.replace(ifPattern, '');
    }
  }
  
  // Process remaining conditional blocks - treat as false and remove
  processed = processed.replace(/{{#if [^}]*}}[\s\S]*?{{\/if}}/g, '');
  
  return processed;
}

// Query the LLM
queryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { query, modeId } = req.body as QueryRequest;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Get chat mode (default if not specified)
    const chatMode = modeId ? getChatModeById(modeId) : getDefaultChatMode();
    
    // If Gemini isn't configured, return a simple response
    if (!geminiClient) {
      return res.json({ 
        response: "I'm in offline mode. Configure your Gemini API key in the Settings page to enable AI responses.",
        sources: [],
        modeId: chatMode?.id
      } as QueryResponse);
    }
    
    // Find relevant notes
    const notes: Note[] = readNotes();
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
      context = relevantNotes.map((note, i) => 
        `[${i+1}] ${note.content}`
      ).join('\n\n');
    }
    
    // Get the model name from config or use default
    const modelName = config.model || "gemini-2.0-flash";
    const model = geminiClient.getGenerativeModel({ model: modelName });
    
    // Process the prompt template with variables
    const prompt = processTemplate(chatMode?.promptTemplate || getDefaultChatMode().promptTemplate, {
      query,
      context
    });
    
    // Generate content with more specific options
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.generationConfig?.temperature || 0.7,
        maxOutputTokens: config.generationConfig?.maxOutputTokens || 500,
        topP: config.generationConfig?.topP || 1,
        topK: config.generationConfig?.topK || 1,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ]
    });
    
    const messageContent = result.response.text() || '';
    
    const response: QueryResponse = {
      response: messageContent,
      sources: relevantNotes.map(note => ({
        id: note.id,
        content: note.content,
        relevance: note.relevance
      })),
      modeId: chatMode?.id
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error in query:', error);
    
    // Improved error handling
    if (error instanceof Error) {
      if (error.message.includes("400")) {
        res.status(400).json({ error: 'Bad Request: Invalid query format or parameters.' });
      } else if (error.message.includes("429")) {
        res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
      } else {
        res.status(500).json({ 
          error: 'Failed to process query', 
          details: error.message 
        });
      }
    } else {
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
});

// Simple query without AI (for testing or if Gemini is not configured)
queryRouter.post('/simple', (req: Request, res: Response) => {
  try {
    const { query, modeId } = req.body as QueryRequest;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Get chat mode (default if not specified)
    const chatMode = modeId ? getChatModeById(modeId) : getDefaultChatMode();
    
    // Find relevant notes
    const notes: Note[] = readNotes();
    const relevantNotes = notes
      .map(note => ({
        ...note,
        relevance: calculateSimilarity(query, note.content)
      }))
      .filter(note => note.relevance > 0.1)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5);
    
    const response: QueryResponse = {
      response: relevantNotes.length > 0 
        ? `I found ${relevantNotes.length} notes that might be relevant to your query.` 
        : "I couldn't find any notes relevant to your query.",
      sources: relevantNotes.map(note => ({
        id: note.id,
        content: note.content,
        relevance: note.relevance
      })),
      modeId: chatMode?.id
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in simple query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});