import React, { useState } from 'react';
import axios from 'axios';
import './NoteForm.css';

const NoteForm = ({ onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (content.trim() === '') {
      setError('Please enter some content');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await axios.post('/api/notes', { content });
      
      // Clear form and notify parent
      setContent('');
      if (onNoteAdded) {
        onNoteAdded(response.data.note);
      }
    } catch (err) {
      setError('Failed to add note. Please try again.');
      console.error('Error adding note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="note-form-container">
      <h2>Add New Thought</h2>
      
      <form className="note-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          disabled={isSubmitting}
        />
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Thought'}
        </button>
      </form>
    </div>
  );
};

export default NoteForm;