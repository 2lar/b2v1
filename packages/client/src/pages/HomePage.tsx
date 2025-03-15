import React, { useState } from 'react';
import { Note } from '@b2/shared';
import NoteForm from '../components/NoteForm';
import NoteItem from '../components/NoteItem';
import { useStorage } from '../context/StorageContext'; // New import
import { FaStream, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaSpinner, FaLightbulb, FaFolder } from 'react-icons/fa';
import './HomePage.css';

const HomePage: React.FC = () => {
  // Use the storage context instead of direct API calls
  const { 
    notes, 
    addNote, 
    deleteNote, 
    loading, 
    error: storageError, 
    storageMode, 
    isVaultSelected,
    selectVault 
  } = useStorage();
  
  const [page, setPage] = useState<number>(1);
  const [error, setError] = useState<string>('');
  
  // Calculate pagination based on the current page
  const ITEMS_PER_PAGE = 10;
  const paginatedNotes = notes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(notes.length / ITEMS_PER_PAGE);
  
  const pagination = {
    currentPage: page,
    totalPages,
    totalNotes: notes.length,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };

  const handleNoteAdded = async (content: string) => {
    try {
      const newNote = await addNote(content);
      if (!newNote) {
        setError('Failed to add note. Please try again.');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    }
  };

  const handleNoteDeleted = async (noteId: string) => {
    try {
      const success = await deleteNote(noteId);
      if (!success) {
        setError('Failed to delete note. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle vault selection for local storage mode
  const handleSelectVault = async () => {
    try {
      await selectVault();
    } catch (err) {
      console.error('Error selecting vault:', err);
      setError('Failed to select vault. Please try again.');
    }
  };

  return (
    <div className="home-page">
      <h1>Your Thoughts</h1>
      
      {/* Show vault selection message for local mode with no vault */}
      {storageMode === 'local' && !isVaultSelected && (
        <div className="vault-selection">
          <div className="vault-message">
            <FaFolder className="vault-icon" />
            <div>
              <h3>Select a Vault to Store Your Notes</h3>
              <p>You're in local storage mode, but no vault has been selected.</p>
            </div>
          </div>
          <button onClick={handleSelectVault} className="vault-button">
            Select Vault Location
          </button>
        </div>
      )}
      
      {/* Only show note form if vault is selected in local mode, or if in cloud mode */}
      {(storageMode === 'cloud' || (storageMode === 'local' && isVaultSelected)) && (
        <NoteForm onSubmit={handleNoteAdded} />
      )}
      
      <div className="notes-container">
        <h2><FaStream /> Recent Thoughts</h2>
        
        {(error || storageError) && (
          <div className="error-message">
            <FaExclamationTriangle /> {error || storageError}
          </div>
        )}
        
        {loading ? (
          <div className="loading-message">
            <FaSpinner className="spinner" />
            <p>Loading your thoughts...</p>
          </div>
        ) : paginatedNotes.length === 0 ? (
          <div className="empty-message">
            <FaLightbulb />
            <p>No thoughts yet. Add one above to start building your knowledge network!</p>
          </div>
        ) : (
          <>
            <div className="notes-list">
              {paginatedNotes.map(note => (
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
                  <FaChevronLeft /> Previous
                </button>
                
                <span className="pagination-info">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="pagination-btn"
                >
                  Next <FaChevronRight />
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