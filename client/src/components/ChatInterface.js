import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatInterface.css';

const ChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    
    try {
      // Send query to server
      const response = await axios.post('/api/query', { query });
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        sources: response.data.sources
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending query:', error);
      
      // Add error message
      const errorMessage = {
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
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
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
                  <h4>Sources:</h4>
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
            <div className="message-loading">Thinking...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me about your notes..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !query.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;