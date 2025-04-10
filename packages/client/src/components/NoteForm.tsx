import React, { useState } from 'react';
import { Note } from '@b2/shared';
import { notesApi } from '../services/api';
import { FaBrain, FaExclamationTriangle, FaPaperPlane } from 'react-icons/fa';
import './NoteForm.css';

interface NoteFormProps {
  onNoteAdded?: (note: Note) => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ onNoteAdded }) => {
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (content.trim() === '') {
      setError('Please enter some content');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await notesApi.createNote(content);
      
      // Clear form and notify parent
      setContent('');
      if (onNoteAdded) {
        onNoteAdded(response.note);
      }
    } catch (err) {
      setError('Failed to add note. Please try again.');
      console.error('Error adding note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check if Enter key is pressed without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line
      handleSubmit(e as unknown as React.FormEvent);
    }
    // If Shift+Enter is pressed, it will create a new line by default
  };

  return (
    <div className="note-form-container">
      <h2><FaBrain /> Add New Thought</h2>
      
      <form className="note-form" onSubmit={handleSubmit}>
        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Add your thoughts here to expand your knowledge network... (Press Enter to submit, Shift+Enter for new line)"
          disabled={isSubmitting}
        />
        
        <button type="submit" disabled={isSubmitting}>
          <FaPaperPlane /> {isSubmitting ? 'Adding...' : 'Add Thought'}
        </button>
      </form>
    </div>
  );
};

export default NoteForm;