import React, { useState } from 'react';
import LlmSettings from '../components/Settings/LlmSettings';
import { categoryApi } from '../services/api';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [rebuildResult, setRebuildResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleRebuildCategories = async () => {
    if (isRebuilding) return;
    
    try {
      setIsRebuilding(true);
      setRebuildResult(null);
      
      const result = await categoryApi.rebuildCategories();
      
      setRebuildResult({
        success: true,
        message: `Successfully rebuilt categories for ${result.notesProcessed} notes.`
      });
    } catch (error) {
      setRebuildResult({
        success: false,
        message: 'Failed to rebuild categories. Please try again.'
      });
      console.error('Error rebuilding categories:', error);
    } finally {
      setIsRebuilding(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <section>
        <h2>AI Configuration</h2>
        <LlmSettings />
      </section>
      
      <section>
        <h2>Category Management</h2>
        <div className="category-settings">
          <p>
            Rebuild all categories for your notes. This can improve categorization after adding many notes or changing AI settings.
          </p>
          <button 
            className="rebuild-button"
            onClick={handleRebuildCategories}
            disabled={isRebuilding}
          >
            {isRebuilding ? 'Rebuilding...' : 'Rebuild Categories'}
          </button>
          
          {rebuildResult && (
            <div className={`rebuild-result ${rebuildResult.success ? 'success' : 'error'}`}>
              {rebuildResult.message}
            </div>
          )}
        </div>
      </section>
      
      <section>
        <h2>About</h2>
        <div className="about-card">
          <h3>Second Brain</h3>
          <p>A personal knowledge management system that helps you organize your thoughts and ideas.</p>
          <p>This application automatically creates connections between your notes and categorizes them using AI or simple text analysis.</p>
          
          <h4>Using Free AI Options</h4>
          <p>This application supports two free AI options:</p>
          <ul>
            <li><strong>Google Gemini</strong> - Free tier available with API key</li>
            <li><strong>Local LLM</strong> - Run your own model with Ollama</li>
          </ul>
          
          <h4>Local First</h4>
          <p>All your data is stored locally in JSON files within the application folder. No external database required.</p>
          
          <h4>Version</h4>
          <p>Version 1.0.0 - TypeScript Edition</p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;