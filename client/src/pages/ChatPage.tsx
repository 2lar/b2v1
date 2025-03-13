import React from 'react';
import ChatInterface from '../components/ChatInterface';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Chat with Your Second Brain</h1>
        <p className="chat-description">
          Choose a chat mode and ask questions to interact with your personal knowledge base in different ways.
        </p>
      </div>
      
      <div className="chat-features">
        <div className="feature-card">
          <h3>Multiple Chat Personas</h3>
          <p>
            Switch between different modes to interact with your notes in the way that suits your current needs.
            Each mode has a unique perspective and approach.
          </p>
        </div>
        
        <div className="feature-card">
          <h3>Personal Knowledge Integration</h3>
          <p>
            The chat automatically identifies and references relevant notes from your knowledge base,
            giving you personalized responses based on your thoughts.
          </p>
        </div>
      </div>
      
      <div className="api-key-notice">
        <p>
          <strong>Note:</strong> For full AI functionality, you need to add your Gemini API key in the 
          server's environment variables or configure it in the Settings page.
        </p>
      </div>
      
      <div className="chat-interface-container">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPage;