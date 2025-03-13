const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Config file for LLM settings
const configPath = path.join(__dirname, '../data/llm-config.json');

// Default config
const defaultConfig = {
  provider: 'none', // 'none', 'local', 'gemini'
  geminiApiKey: '',
  localLlmUrl: 'http://localhost:11434/api/generate',
  localLlmModel: 'mistral',
};

// Ensure config file exists
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
}

// Read config
const readConfig = () => {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading LLM config:', error);
    return defaultConfig;
  }
};

// Write config
const writeConfig = (config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing LLM config:', error);
    return false;
  }
};

// Initialize clients
let geminiClient = null;
const config = readConfig();

// Set up Gemini if configured
if (config.provider === 'gemini' && config.geminiApiKey) {
  try {
    geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (error) {
    console.error('Error initializing Gemini client:', error);
  }
}

/**
 * Generate text with Gemini
 */
const generateWithGemini = async (prompt, options = {}) => {
  if (!geminiClient) {
    throw new Error('Gemini is not configured');
  }

  try {
    // Use Gemini Pro model
    const model = geminiClient.getGenerativeModel({ model: 'gemini-pro' });
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1000,
      },
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
const generateWithLocalModel = async (prompt, options = {}) => {
  const config = readConfig();
  
  try {
    const response = await axios.post(
      config.localLlmUrl,
      {
        model: config.localLlmModel,
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
const generateWithFallback = (prompt) => {
  // Extract keywords from the prompt to make a simple response
  const words = prompt.toLowerCase().split(/\W+/).filter(word => word.length > 3);
  const uniqueWords = [...new Set(words)];
  const relevantWords = uniqueWords
    .filter(word => !['what', 'when', 'where', 'which', 'with', 'would', 'will', 'have', 'this', 'that', 'there'].includes(word))
    .slice(0, 5);
  
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
const generateText = async (prompt, options = {}) => {
  const config = readConfig();
  
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
const updateConfig = (newConfig) => {
  const currentConfig = readConfig();
  const updatedConfig = { ...currentConfig, ...newConfig };
  
  // Initialize clients if needed
  if (updatedConfig.provider === 'gemini' && updatedConfig.geminiApiKey) {
    try {
      geminiClient = new GoogleGenerativeAI(updatedConfig.geminiApiKey);
    } catch (error) {
      console.error('Error initializing Gemini client:', error);
    }
  }
  
  return writeConfig(updatedConfig);
};

/**
 * Check if LLM is available
 */
const isLlmAvailable = async () => {
  const config = readConfig();
  
  if (config.provider === 'none') {
    return false;
  }
  
  if (config.provider === 'gemini' && geminiClient) {
    return true;
  }
  
  if (config.provider === 'local') {
    try {
      await axios.get(config.localLlmUrl.replace('/generate', '/models'));
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
const getConfig = () => {
  const config = readConfig();
  // Don't return the API key
  return {
    ...config,
    geminiApiKey: config.geminiApiKey ? '[CONFIGURED]' : '',
  };
};

module.exports = {
  generateText,
  updateConfig,
  getConfig,
  isLlmAvailable,
};