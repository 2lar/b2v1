import React from 'react';
import ChatInterface from '../components/ChatInterface';
import './ChatPage.css';

const ChatPage = () => {
  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Chat with Your Second Brain</h1>
        <p className="chat-description">
          Ask questions about your notes and get AI-powered responses.
        </p>
      </div>
      
      <div className="api-key-notice">
        <p>
          <strong>Note:</strong> For full AI functionality, you need to add your OpenAI API key to the 
          server's environment variables. See README for instructions.
        </p>
      </div>
      
      <div className="chat-interface-container">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPage;