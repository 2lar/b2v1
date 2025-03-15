import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMode } from '@b2/shared';
import { queryApi, chatModesApi, llmApi } from '../services/api';
import { FaInfoCircle, FaPaperPlane, FaRobot, FaExclamationTriangle, FaLink } from 'react-icons/fa';
import './ChatInterface.css';

const ChatInterface: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modes, setModes] = useState<ChatMode[]>([]);
  const [currentMode, setCurrentMode] = useState<string>('default');
  const [selectedModeData, setSelectedModeData] = useState<ChatMode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat modes and settings on component mount
  useEffect(() => {
    fetchChatModes();
    fetchSettings();
  }, []);

  // Fetch user settings to get the default agent
  const fetchSettings = async () => {
    try {
      const config = await llmApi.getConfig();
      if (config.selectedAgentId) {
        setCurrentMode(config.selectedAgentId);
      }
    } catch (error) {
      console.error('Error fetching LLM config:', error);
    }
  };

  // Fetch available chat modes
  const fetchChatModes = async () => {
    try {
      const modesData = await chatModesApi.getAllModes();
      setModes(modesData);
      
      // Set mode data once we have both the modes and the default mode ID
      if (modesData.length > 0) {
        const defaultMode = modesData.find(mode => mode.id === currentMode) || modesData[0];
        setSelectedModeData(defaultMode);
      }
    } catch (error) {
      console.error('Error fetching chat modes:', error);
    }
  };

  // Update selected mode data when currentMode changes
  useEffect(() => {
    if (modes.length > 0) {
      const modeData = modes.find(mode => mode.id === currentMode) || modes[0];
      setSelectedModeData(modeData);
    }
  }, [currentMode, modes]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle mode change
  const handleModeChange = (modeId: string) => {
    setCurrentMode(modeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      modeId: currentMode
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    try {
      // Send query to server with selected mode
      const response = await queryApi.sendQuery(query, currentMode);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        sources: response.sources,
        modeId: response.modeId || currentMode
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error processing your request.'
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="mode-selector">
          {modes.map(mode => (
            <button
              key={mode.id}
              className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
              onClick={() => handleModeChange(mode.id)}
            >
              {mode.name}
            </button>
          ))}
        </div>
        {selectedModeData && (
          <div className="mode-description">
            {selectedModeData.description}
          </div>
        )}
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <FaRobot />
            <p>No messages yet. Ask me something about your notes!</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`chat-message ${message.type}-message`}
            >
              <div className="message-content">
                {message.content}
              </div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <h4><FaLink /> Sources:</h4>
                  <ul>
                    {message.sources.map((source, index) => (
                      <li key={index}>
                        <div className="source-content">{source.content.substring(0, 100)}...</div>
                        <div className="source-relevance">Relevance: {Math.round(source.relevance * 100)}%</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="chat-message ai-message">
            <div className="message-loading">Thinking</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask ${selectedModeData?.name || 'the assistant'} a question...`}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !query.trim()}>
          <FaPaperPlane /> Send
        </button>
        {selectedModeData && (
          <div className="mode-info">
            <FaInfoCircle title={selectedModeData.description} />
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInterface;