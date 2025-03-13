import React, { useState, useEffect } from 'react';
import { Note } from '../../../shared/types';
import { notesApi } from '../services/api';
import NoteForm from '../components/NoteForm';
import NoteItem from '../components/NoteItem';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalNotes: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    currentPage: 1,
    totalPages: 1,
    totalNotes: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch notes on component mount or page change
  useEffect(() => {
    fetchNotes(page);
  }, [page]);

  const fetchNotes = async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await notesApi.getRecentNotes(pageNum);
      setNotes(response.notes);
      setPagination(response.pagination);
      setError('');
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = (newNote: Note) => {
    setNotes(prevNotes => [newNote, ...prevNotes]);
    
    // Refetch to update pagination
    fetchNotes(1);
  };

  const handleNoteDeleted = async (noteId: string) => {
    try {
      await notesApi.deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Refetch to update pagination
      fetchNotes(page);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
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
          <>
            <div className="notes-list">
              {notes.map(note => (
                <NoteItem 
                  key={note.id} 
                  note={note} 
                  onDelete={handleNoteDeleted} 
                />
              ))}
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;