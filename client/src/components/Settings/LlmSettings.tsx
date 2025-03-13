import React, { useState, useEffect } from 'react';
import { LlmConfig } from '../../../../shared/types';
import { llmApi } from '../../services/api';
import './LlmSettings.css';

const LlmSettings: React.FC = () => {
  const [config, setConfig] = useState<LlmConfig>({
    provider: 'gemini',
    geminiApiKey: '',
    localLlmUrl: 'http://localhost:11434/api/generate',
    localLlmModel: 'mistral',
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      topP: 1,
      topK: 1
    }
  });
  
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
    checkLlmStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await llmApi.getConfig();
      setConfig(response as LlmConfig);
      setError(null);
    } catch (err) {
      console.error('Error fetching LLM config:', err);
      setError('Failed to load LLM configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkLlmStatus = async () => {
    try {
      const response = await llmApi.checkStatus();
      setIsAvailable(response.available);
    } catch (err) {
      console.error('Error checking LLM status:', err);
      setIsAvailable(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user changes input
    setSuccess(null);
    setError(null);
  };

  const handleAdvancedSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: number | string = value;
    
    // Convert to number for numeric inputs
    if (e.target.type === 'number' || e.target.type === 'range') {
      parsedValue = parseFloat(value);
    }
    
    setConfig(prev => ({
      ...prev,
      generationConfig: {
        ...prev.generationConfig,
        [name]: parsedValue
      }
    }));
    
    // Clear messages when user changes input
    setSuccess(null);
    setError(null);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as LlmConfig['provider'];
    setConfig(prev => ({
      ...prev,
      provider
    }));
    
    // Clear messages when user changes provider
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await llmApi.updateConfig(config);
      
      setSuccess('LLM configuration saved successfully');
      checkLlmStatus(); // Check if the new configuration works
    } catch (err) {
      console.error('Error saving LLM config:', err);
      setError('Failed to save LLM configuration');
    } finally {
      setSaving(false);
    }
  };
  

  if (loading) {
    return <div className="llm-settings-loading">Loading LLM settings...</div>;
  }

  return (
    <div className="llm-settings-container">
      <h3>LLM Configuration</h3>
      
      <div className="llm-status">
        <span className="status-label">LLM Status:</span>
        <span className={`status-value ${isAvailable ? 'status-available' : 'status-unavailable'}`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
      
      {error && <div className="llm-error">{error}</div>}
      {success && <div className="llm-success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="llm-form">
        <div className="form-group">
          <label htmlFor="provider">LLM Provider</label>
          <select 
            id="provider"
            name="provider" 
            value={config.provider}
            onChange={handleProviderChange}
            disabled={saving}
          >
            <option value="none">None (Use basic categorization)</option>
            <option value="gemini">Google Gemini (Free tier available)</option>
            <option value="local">Local LLM (Ollama)</option>
          </select>
        </div>
        
        {config.provider === 'gemini' && (
          <>
            <div className="form-group">
              <label htmlFor="geminiApiKey">Gemini API Key</label>
              <input 
                type="password"
                id="geminiApiKey"
                name="geminiApiKey"
                value={config.geminiApiKey}
                onChange={handleInputChange}
                placeholder="Your Gemini API key"
                disabled={saving}
              />
              <div className="form-help">
                Get your free Google Gemini API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="model">Gemini Model</label>
              <select
                id="model"
                name="model"
                value={config.model || 'gemini-2.0-flash'}
                onChange={handleInputChange}
                disabled={saving}
              >
                <option value="gemini-2.0-flash">Gemini Pro (Default)</option>
                <option value="gemini-2.0-flash-vision">Gemini Pro Vision</option>
              </select>
              <div className="form-help">
                The model to use for AI responses
              </div>
            </div>
            
            <details className="advanced-settings">
              <summary>Advanced Settings</summary>
              <div className="advanced-settings-content">
                <div className="form-group">
                  <label htmlFor="temperature">Temperature</label>
                  <input
                    type="range"
                    id="temperature"
                    name="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.generationConfig?.temperature || 0.7}
                    onChange={handleAdvancedSettingChange}
                    disabled={saving}
                  />
                  <span className="setting-value">{config.generationConfig?.temperature || 0.7}</span>
                  <div className="form-help">
                    Controls randomness: lower values are more deterministic, higher values more creative
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="maxOutputTokens">Max Output Tokens</label>
                  <input
                    type="number"
                    id="maxOutputTokens"
                    name="maxOutputTokens"
                    min="50"
                    max="8192"
                    value={config.generationConfig?.maxOutputTokens || 1000}
                    onChange={handleAdvancedSettingChange}
                    disabled={saving}
                  />
                  <div className="form-help">
                    Maximum number of tokens to generate in a response
                  </div>
                </div>
              </div>
            </details>
          </>
        )}
        
        {config.provider === 'local' && (
          <>
            <div className="form-group">
              <label htmlFor="localLlmUrl">Local LLM URL</label>
              <input 
                type="text"
                id="localLlmUrl"
                name="localLlmUrl"
                value={config.localLlmUrl}
                onChange={handleInputChange}
                placeholder="http://localhost:11434/api/generate"
                disabled={saving}
              />
              <div className="form-help">
                Defaults to Ollama API endpoint. Make sure your local LLM server is running.
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="localLlmModel">Model Name</label>
              <input 
                type="text"
                id="localLlmModel"
                name="localLlmModel"
                value={config.localLlmModel}
                onChange={handleInputChange}
                placeholder="mistral"
                disabled={saving}
              />
              <div className="form-help">
                For Ollama, common models include: mistral, llama2, gemma, etc.
              </div>
            </div>
          </>
        )}
        
        <div className="llm-description">
          {config.provider === 'none' && (
            <p>
              Without an LLM, the system will use basic keyword analysis for categorization. 
              For better results, configure either Gemini or a local LLM.
            </p>
          )}
          
          {config.provider === 'gemini' && (
            <p>
              Google Gemini offers a free tier that works well for categorization. 
              Just sign up at Google AI Studio and enter your API key.
            </p>
          )}
          
          {config.provider === 'local' && (
            <p>
              Using a local LLM requires running a separate LLM server like Ollama.
              <a href="https://ollama.com/" target="_blank" rel="noopener noreferrer">Learn how to set up Ollama</a>
            </p>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="save-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LlmSettings;