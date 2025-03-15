import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import axios from 'axios';
import { LlmConfig } from '@b2/shared';
import { readLlmConfig, writeLlmConfig } from '../utils/fileHelpers';
import { extractKeywords } from '../utils/textUtils';
// import { getChatModeById, getDefaultChatMode } from '../../data/chatModes';

interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

// Initialize clients
let geminiClient: GoogleGenerativeAI | null = null;
let currentConfig = readLlmConfig();

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

// Initialize Gemini if configured
if (currentConfig.provider === 'gemini' && (currentConfig.geminiApiKey || process.env.GEMINI_API_KEY)) {
  try {
    const apiKey = currentConfig.geminiApiKey || process.env.GEMINI_API_KEY || '';
    geminiClient = new GoogleGenerativeAI(apiKey);
    
    // Add default Gemini configuration if not already present
    if (!currentConfig.model) {
      currentConfig = {
        ...currentConfig,
        ...defaultGeminiConfig
      };
    }
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
  }
}

/**
 * Generate text with Gemini
 */
const generateWithGemini = async (prompt: string, options: GenerateOptions = {}): Promise<string> => {
  if (!geminiClient) {
    throw new Error('Gemini is not configured');
  }

  try {
    // Use Gemini model from config or default to gemini-pro
    const modelName = currentConfig.model || "gemini-2.0-flash";
    const model = geminiClient.getGenerativeModel({ model: modelName });
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || currentConfig.generationConfig?.temperature || 0.7,
        maxOutputTokens: options.maxTokens || currentConfig.generationConfig?.maxOutputTokens || 1000,
        topP: currentConfig.generationConfig?.topP || 1,
        topK: currentConfig.generationConfig?.topK || 1,
      },
      safetySettings: currentConfig.safetySettings ? 
        currentConfig.safetySettings.map(s => ({
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
  const config = readLlmConfig();
  
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
  const config = readLlmConfig();
  
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
export const updateConfig = (newConfig: Partial<LlmConfig>): boolean => {
  try {
    currentConfig = { ...currentConfig, ...newConfig };
    
    // Make sure we have a default selectedAgentId if not provided
    if (!currentConfig.selectedAgentId) {
      currentConfig.selectedAgentId = 'default';
    }
    
    // Initialize clients if needed
    if (currentConfig.provider === 'gemini' && currentConfig.geminiApiKey) {
      try {
        geminiClient = new GoogleGenerativeAI(currentConfig.geminiApiKey);
      } catch (error) {
        console.error('Error initializing Gemini client:', error);
      }
    }
    
    return writeLlmConfig(currentConfig);
  } catch (error) {
    console.error('Error updating config:', error);
    return false;
  }
};

/**
 * Check if LLM is available
 */
export const isLlmAvailable = async (): Promise<boolean> => {
  if (currentConfig.provider === 'none') {
    return false;
  }
  
  if (currentConfig.provider === 'gemini' && geminiClient) {
    try {
      // Try to get the model to verify the API key works
      const modelName = currentConfig.model || "gemini-2.0-flash";
      geminiClient.getGenerativeModel({ model: modelName });
      return true;
    } catch (error) {
      console.error('Error checking Gemini availability:', error);
      return false;
    }
  }
  
  if (currentConfig.provider === 'local') {
    try {
      // Fix the TypeScript error by adding a check for undefined and providing a default
      const localLlmUrl = currentConfig.localLlmUrl || 'http://localhost:11434/api/generate';
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
export const getConfig = (): Omit<LlmConfig, 'geminiApiKey'> & { geminiApiKey: string } => {
  // Don't return the actual API key
  return {
    ...currentConfig,
    geminiApiKey: currentConfig.geminiApiKey ? '[CONFIGURED]' : '',
  };
};

/**
 * Get the default agent ID from config
 */
export const getDefaultAgentId = (): string => {
  return currentConfig.selectedAgentId || 'default';
};

export default {
  generateText,
  updateConfig,
  getConfig,
  isLlmAvailable,
  getDefaultAgentId,
};