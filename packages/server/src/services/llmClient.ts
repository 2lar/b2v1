// packages/server/src/services/llmClient.ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import axios from 'axios';
import { LlmConfig } from '@b2/shared';
import { extractKeywords } from '../utils/textUtils';
import { LlmConfig as LlmConfigModel } from '../models';
import { LlmConfigDocument } from 'src/models/LlmConfig';
// import { getChatModeById, getDefaultChatMode } from '../../data/chatModes';

interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

// Initialize clients
let geminiClient: GoogleGenerativeAI | null = null;
let currentConfig: LlmConfig | null = null;

// Set default values for Gemini
const defaultGeminiConfig = {
  model: "gemini-2.0-flash",
  selectedAgentId: "default",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 1,
    topK: 1,
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
  ],
};

const convertLlmDocToInterface = (configDoc: any): LlmConfig => {
  if (!configDoc) return null;

  // Create a proper LlmConfig object with the model field set from modelName
  const config: LlmConfig = {
    provider: configDoc.provider,
    geminiApiKey: configDoc.geminiApiKey || '',
    localLlmUrl: configDoc.localLlmUrl,
    localLlmModel: configDoc.localLlmModel,
    model: configDoc.modelName, // Set model from modelName
    selectedAgentId: configDoc.selectedAgentId,
    generationConfig: configDoc.generationConfig,
    safetySettings: configDoc.safetySettings,
  };

  return config;
};

// Load config function
const loadConfig = async (): Promise<LlmConfig> => {
  if (currentConfig) {
    return currentConfig;
  }
  
  try {
    // Find the singleton config
    let configDoc = await LlmConfigModel.findById('config');
    
    if (!configDoc) {
      // Create default config if none exists
      const defaultConfig: Partial<LlmConfigDocument> = {
        provider: 'gemini',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        localLlmUrl: 'http://localhost:11434/api/generate',
        localLlmModel: 'mistral',
        modelName: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 1,
          topK: 1
        }
      };
      
      configDoc = await LlmConfigModel.create({
        _id: 'config',
        ...defaultConfig
      });
    }
    
    // Convert to LlmConfig interface
    const config = convertLlmDocToInterface(configDoc.toObject());
    
    // Override with environment variable if available
    if (process.env.GEMINI_API_KEY) {
      config.geminiApiKey = process.env.GEMINI_API_KEY;
    }
    
    currentConfig = config;
    
    // Initialize Gemini if configured
    if (config.provider === 'gemini' && (config.geminiApiKey || process.env.GEMINI_API_KEY)) {
      try {
        const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
        geminiClient = new GoogleGenerativeAI(apiKey);
        console.log('Gemini client initialized');
      } catch (error) {
        console.error('Error initializing Gemini client:', error);
      }
    }
    
    return config;
  } catch (error) {
    console.error('Error loading LLM config:', error);
    
    // Return default config if there's an error
    return {
      provider: 'gemini',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      localLlmUrl: 'http://localhost:11434/api/generate',
      localLlmModel: 'mistral',
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
        topK: 1
      }
    };
  }
};
// Initialize on module load
loadConfig().catch(err => {
  console.error('Error during initial LLM config load:', err);
});

/**
 * Generate text with Gemini
 */
const generateWithGemini = async (prompt: string, options: GenerateOptions = {}): Promise<string> => {
  if (!geminiClient) {
    throw new Error('Gemini is not configured');
  }
  
  // Ensure config is loaded
  const config = await loadConfig();

  try {
    // Use Gemini model from config or default to gemini-pro
    const modelName = config.model || "gemini-2.0-flash";
    const model = geminiClient.getGenerativeModel({ model: modelName });
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || config.generationConfig?.temperature || 0.7,
        maxOutputTokens: options.maxTokens || config.generationConfig?.maxOutputTokens || 1000,
        topP: config.generationConfig?.topP || 1,
        topK: config.generationConfig?.topK || 1,
      },
      safetySettings: config.safetySettings ? 
        config.safetySettings.map(s => ({
          category: s.category as unknown as HarmCategory,
          threshold: s.threshold as unknown as HarmBlockThreshold
        })) : 
        defaultGeminiConfig.safetySettings
    });

    return result.response.text();
  } catch (error) {
    console.error('Error with Gemini generation:', error);
    throw error;
  }
};

/**
 * Generate text with a local model (assumes Ollama is running)
 */
const generateWithLocalModel = async (prompt: string, options: GenerateOptions = {}): Promise<string> => {
  // Ensure config is loaded
  const config = await loadConfig();
  
  // Fix the TypeScript error by providing a default value for localLlmUrl
  const localLlmUrl = config.localLlmUrl || 'http://localhost:11434/api/generate';
  const localLlmModel = config.localLlmModel || 'mistral';
  
  try {
    const response = await axios.post(
      localLlmUrl,
      {
        model: localLlmModel,
        prompt,
        stream: false,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }
    );
    
    return response.data.response;
  } catch (error) {
    console.error('Error with local model generation:', error);
    throw error;
  }
};

/**
 * Generate text with fallback (no AI)
 */
const generateWithFallback = (prompt: string): string => {
  // Extract keywords from the prompt to make a simple response
  const relevantWords = extractKeywords(prompt, 5);
  
  if (prompt.includes('categories') || prompt.includes('categorize')) {
    // Simple categorization logic based on word frequency
    return JSON.stringify({
      categories: [
        { name: relevantWords[0] ? relevantWords[0].charAt(0).toUpperCase() + relevantWords[0].slice(1) : 'General', level: 0 },
        { name: relevantWords[1] ? relevantWords[1].charAt(0).toUpperCase() + relevantWords[1].slice(1) : 'Uncategorized', level: 1 }
      ]
    });
  }
  
  return 'I need an LLM configuration to generate better responses. Please configure either Gemini or a local model.';
};

/**
 * Generate text with whatever model is configured
 */
export const generateText = async (prompt: string, options: GenerateOptions = {}): Promise<string> => {
  // Ensure config is loaded
  const config = await loadConfig();
  
  try {
    switch (config.provider) {
      case 'gemini':
        return await generateWithGemini(prompt, options);
      case 'local':
        return await generateWithLocalModel(prompt, options);
      default:
        return generateWithFallback(prompt);
    }
  } catch (error) {
    console.error('Text generation failed:', error);
    return generateWithFallback(prompt);
  }
};

/**
 * Update the LLM configuration
 */
export const updateConfig = async (newConfig: Partial<LlmConfig>): Promise<boolean> => {
  try {
    // Load current config
    const config = await loadConfig();
    
    // Update config
    const updatedConfig = { ...config, ...newConfig };
    
    // Make sure we have a default selectedAgentId if not provided
    if (!updatedConfig.selectedAgentId) {
      updatedConfig.selectedAgentId = 'default';
    }
    
    // Convert model to modelName for MongoDB
    const dbConfig: any = { ...updatedConfig };
    if (updatedConfig.model) {
      dbConfig.modelName = updatedConfig.model;
      delete dbConfig.model;
    }
    
    // Update in database
    await LlmConfigModel.findByIdAndUpdate('config', dbConfig, { upsert: true });
    
    // Update in memory
    currentConfig = updatedConfig;
    
    // Initialize clients if needed
    if (updatedConfig.provider === 'gemini' && updatedConfig.geminiApiKey) {
      try {
        geminiClient = new GoogleGenerativeAI(updatedConfig.geminiApiKey);
      } catch (error) {
        console.error('Error initializing Gemini client:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating config:', error);
    return false;
  }
};

/**
 * Check if LLM is available
 */
export const isLlmAvailable = async (): Promise<boolean> => {
  // Ensure config is loaded
  const config = await loadConfig();
  
  if (config.provider === 'none') {
    return false;
  }
  
  if (config.provider === 'gemini' && geminiClient) {
    try {
      // Try to get the model to verify the API key works
      const modelName = config.model || "gemini-2.0-flash";
      geminiClient.getGenerativeModel({ model: modelName });
      return true;
    } catch (error) {
      console.error('Error checking Gemini availability:', error);
      return false;
    }
  }
  
  if (config.provider === 'local') {
    try {
      // Fix the TypeScript error by adding a check for undefined and providing a default
      const localLlmUrl = config.localLlmUrl || 'http://localhost:11434/api/generate';
      await axios.get(localLlmUrl.replace('/generate', '/models'));
      return true;
    } catch (error) {
      return false;
    }
  }
  
  return false;
};

/**
 * Get the current configuration
 */
export const getConfig = async (): Promise<Omit<LlmConfig, 'geminiApiKey'> & { geminiApiKey: string }> => {
  // Ensure config is loaded
  const config = await loadConfig();
  
  // Don't return the actual API key
  return {
    ...config,
    geminiApiKey: config.geminiApiKey ? '[CONFIGURED]' : '',
  };
};

/**
 * Get the default agent ID from config
 */
export const getDefaultAgentId = async (): Promise<string> => {
  // Ensure config is loaded
  const config = await loadConfig();
  
  return config.selectedAgentId || 'default';
};

export default {
  generateText,
  updateConfig,
  getConfig,
  isLlmAvailable,
  getDefaultAgentId,
};