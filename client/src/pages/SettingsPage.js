import React from 'react';
import LlmSettings from '../components/Settings/LlmSettings';
import './SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      
      <section>
        <h2>AI Configuration</h2>
        <LlmSettings />
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
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;