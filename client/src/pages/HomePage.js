import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NoteForm from '../components/NoteForm';
import NoteItem from '../components/NoteItem';
import './HomePage.css';

const HomePage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notes');
      
      // Sort by creation date (newest first)
      const sortedNotes = response.data.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setNotes(sortedNotes);
      setError('');
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = (newNote) => {
    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  return (
    <div className="home-page">
      <h1>Your Thoughts</h1>
      
      <NoteForm onNoteAdded={handleNoteAdded} />
      
      <div className="notes-container">
        <h2>Recent Thoughts</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading-message">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="empty-message">No thoughts yet. Add one above!</div>
        ) : (
          <div className="notes-list">
            {notes.map(note => (
              <NoteItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;