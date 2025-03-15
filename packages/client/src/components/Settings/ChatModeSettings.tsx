import React, { useState, useEffect } from 'react';
import { ChatMode } from '@b2/shared';
import { chatModesApi } from '../../services/api';
import './ChatModeSettings.css';

const ChatModeSettings: React.FC = () => {
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    fetchModes();
  }, []);
  
  const fetchModes = async () => {
    try {
      setLoading(true);
      const modesData = await chatModesApi.getAllModes();
      setModes(modesData);
    } catch (error) {
      console.error('Error fetching chat modes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div className="chat-mode-settings-loading">Loading chat modes...</div>;
  }
  
  return (
    <div className="chat-mode-settings">
      <h3>Chat Modes</h3>
      
      <p className="settings-description">
        These are the different personas available when chatting with your Second Brain. 
        Each mode offers a different way to interact with your notes.
      </p>
      
      <div className="modes-grid">
        {modes.map(mode => (
          <div key={mode.id} className="mode-card">
            <div className="mode-card-header">
              <h4>{mode.name}</h4>
            </div>
            <div className="mode-card-body">
              <p>{mode.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="future-feature">
        <h4>Coming Soon: Custom Chat Modes</h4>
        <p>
          In a future update, you'll be able to create and customize your own chat modes with specialized prompts.
          This will allow you to tailor the AI's approach to your specific needs.
        </p>
      </div>
    </div>
  );
};

export default ChatModeSettings;