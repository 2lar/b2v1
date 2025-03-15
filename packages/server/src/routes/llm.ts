import express, { Request, Response } from 'express';
import * as llmClient from '../services/llmClient';
import { LlmConfig } from '@b2/shared';

export const llmRouter = express.Router();

// Get LLM configuration
llmRouter.get('/config', (req: Request, res: Response) => {
  try {
    const config = llmClient.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting LLM config:', error);
    res.status(500).json({ error: 'Failed to get LLM configuration' });
  }
});

// Update LLM configuration
llmRouter.put('/config', (req: Request, res: Response) => {
  try {
    const newConfig = req.body as Partial<LlmConfig>;
    const success = llmClient.updateConfig(newConfig);
    
    if (success) {
      res.json({ 
        success: true, 
        config: llmClient.getConfig() 
      });
    } else {
      res.status(500).json({ error: 'Failed to update LLM configuration' });
    }
  } catch (error) {
    console.error('Error updating LLM config:', error);
    res.status(500).json({ error: 'Failed to update LLM configuration' });
  }
});

// Check LLM availability
llmRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const available = await llmClient.isLlmAvailable();
    res.json({ available });
  } catch (error) {
    console.error('Error checking LLM status:', error);
    res.status(500).json({ error: 'Failed to check LLM status' });
  }
});

// Test LLM with a simple prompt
llmRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const { prompt = "Summarize what you can do in one sentence." } = req.body;
    
    const isAvailable = await llmClient.isLlmAvailable();
    if (!isAvailable) {
      return res.status(400).json({ 
        error: 'LLM is not available. Please check your configuration.',
        available: false 
      });
    }
    
    const response = await llmClient.generateText(prompt, { 
      temperature: 0.7,
      maxTokens: 100
    });
    
    res.json({
      available: true,
      response
    });
  } catch (error) {
    console.error('Error testing LLM:', error);
    res.status(500).json({ 
      error: 'Failed to test LLM',
      available: false 
    });
  }
});