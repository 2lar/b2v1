import express, { Request, Response } from 'express';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { calculateSimilarity } from '../utils/textUtils';
import { QueryResponse, QueryRequest } from '@b2/shared';
import { getDefaultChatMode, getChatModeById } from '../../data/chatModes';
import { Note as NoteModel } from '../models';
import { LlmConfig as LlmConfigModel } from '../models';
import { LlmConfigDocument } from '../models/LlmConfig';

export const queryRouter = express.Router();

// Initialize Gemini
let geminiClient: GoogleGenerativeAI | null = null;

// Helper function to convert LlmConfigDocument to a usable object
const convertLlmDocToInterface = (configDoc: any) => {
  if (!configDoc) return null;
  
  return {
    provider: configDoc.provider,
    geminiApiKey: configDoc.geminiApiKey || '',
    localLlmUrl: configDoc.localLlmUrl,
    localLlmModel: configDoc.localLlmModel,
    model: configDoc.modelName, // Map from modelName
    selectedAgentId: configDoc.selectedAgentId,
    generationConfig: configDoc.generationConfig,
    safetySettings: configDoc.safetySettings
  };
};

// Get LLM config
const getLlmConfig = async () => {
  try {
    // Try to find the singleton config
    let configDoc = await LlmConfigModel.findById('config');
    
    if (!configDoc) {
      return null;
    }
    
    const config = convertLlmDocToInterface(configDoc.toObject());
    
    // Prioritize environment variable for API key if available
    if (process.env.GEMINI_API_KEY) {
      config.geminiApiKey = process.env.GEMINI_API_KEY;
    }
    
    return config;
  } catch (error) {
    console.error('Error loading LLM config:', error);
    return null;
  }
};

// Initialize Gemini client
const initializeGemini = async () => {
  const config = await getLlmConfig();
  
  if (config && config.provider === 'gemini' && (config.geminiApiKey || process.env.GEMINI_API_KEY)) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    try {
      geminiClient = new GoogleGenerativeAI(apiKey);
      console.log('Gemini client initialized for query router');
      return true;
    } catch (error) {
      console.error('Error initializing Gemini client:', error);
    }
  }
  
  return false;
};

// Initialize on server start
initializeGemini();

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
      // Try to initialize again just in case
      const initialized = await initializeGemini();
      
      if (!initialized) {
        return res.json({ 
          response: "I'm in offline mode. Configure your Gemini API key in the Settings page to enable AI responses.",
          sources: [],
          modeId: chatMode?.id
        } as QueryResponse);
      }
    }
    
    // Find relevant notes
    const notes = await NoteModel.find();
    
    const relevantNotes = notes
      .map(note => ({
        ...note.toObject(),
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
    
    // Get the LLM config
    const config = await getLlmConfig();
    
    if (!config) {
      return res.status(500).json({ error: 'LLM config not found' });
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
queryRouter.post('/simple', async (req: Request, res: Response) => {
  try {
    const { query, modeId } = req.body as QueryRequest;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Get chat mode (default if not specified)
    const chatMode = modeId ? getChatModeById(modeId) : getDefaultChatMode();
    
    // Find relevant notes
    const notes = await NoteModel.find();
    
    const relevantNotes = notes
      .map(note => ({
        ...note.toObject(),
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