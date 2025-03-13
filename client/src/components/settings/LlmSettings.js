import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LlmSettings.css';

const LlmSettings = () => {
  const [config, setConfig] = useState({
    provider: 'none',
    geminiApiKey: '',
    localLlmUrl: 'http://localhost:11434/api/generate',
    localLlmModel: 'mistral',
  });
  
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
    checkLlmStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/llm/config');
      setConfig(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching LLM config:', err);
      setError('Failed to load LLM configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkLlmStatus = async () => {
    try {
      const response = await axios.get('/api/llm/status');
      setIsAvailable(response.data.available);
    } catch (err) {
      console.error('Error checking LLM status:', err);
      setIsAvailable(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user changes input
    setSuccess('');
    setError('');
  };

  const handleProviderChange = (e) => {
    const provider = e.target.value;
    setConfig(prev => ({
      ...prev,
      provider
    }));
    
    // Clear messages when user changes provider
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await axios.put('/api/llm/config', config);
      
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
          <label>LLM Provider</label>
          <select 
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
          <div className="form-group">
            <label>Gemini API Key</label>
            <input 
              type="password"
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
        )}
        
        {config.provider === 'local' && (
          <>
            <div className="form-group">
              <label>Local LLM URL</label>
              <input 
                type="text"
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
              <label>Model Name</label>
              <input 
                type="text"
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