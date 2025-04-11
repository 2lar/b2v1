import React, { useState, useEffect } from 'react';
import { Note } from '@b2/shared';
import { notesApi, categoryApi } from '../services/api';
import NoteForm from '../components/NoteForm';
import NoteItem from '../components/NoteItem';
import NotesSidebar from '../components/NotesSidebar';
import { 
  FaStream, 
  FaChevronLeft, 
  FaChevronRight, 
  FaExclamationTriangle, 
  FaSpinner, 
  FaLightbulb,
  FaFolder,
  FaAngleDown,
  FaAngleUp
} from 'react-icons/fa';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 992);
  const [directoryVisible, setDirectoryVisible] = useState<boolean>(window.innerWidth >= 992);
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

  // Set up responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      
      // Auto-show directory on larger screens, auto-hide on mobile
      if (!mobile && !directoryVisible) {
        setDirectoryVisible(true);
      } else if (mobile && !isMobile) {
        setDirectoryVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, directoryVisible]);

  // Fetch notes based on currently selected category or recent notes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchNotesByCategory(selectedCategoryId);
    } else {
      fetchRecentNotes(page);
    }
  }, [page, selectedCategoryId]);

  const toggleDirectory = () => {
    setDirectoryVisible(!directoryVisible);
  };

  const fetchRecentNotes = async (pageNum: number) => {
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

  const fetchNotesByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const categoryNotes = await categoryApi.getNotesByCategory(categoryId);
      setNotes(categoryNotes);
      // Reset pagination when viewing by category
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalNotes: categoryNotes.length,
        hasNextPage: false,
        hasPrevPage: false
      });
      setError('');
    } catch (err) {
      console.error('Error fetching notes by category:', err);
      setError('Failed to load notes for this category.');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteAdded = (newNote: Note) => {
    if (!selectedCategoryId) {
      // If viewing recent notes, add to top of list
      setNotes(prevNotes => [newNote, ...prevNotes]);
      // Refetch to update pagination
      fetchRecentNotes(1);
    } else {
      // If viewing a category, refetch that category's notes
      fetchNotesByCategory(selectedCategoryId);
    }
  };

  const handleNoteDeleted = async (noteId: string) => {
    try {
      await notesApi.deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Refetch based on current view
      if (selectedCategoryId) {
        fetchNotesByCategory(selectedCategoryId);
      } else {
        fetchRecentNotes(page);
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setPage(1); // Reset to first page when changing categories
    
    // Auto-hide directory on mobile after selection
    if (isMobile) {
      setDirectoryVisible(false);
    }
  };

  const handleShowAllNotes = () => {
    setSelectedCategoryId(undefined);
    setPage(1);
  };

  return (
    <div className="home-page">
      <h1>Your Thoughts</h1>
      
      {/* Directory toggle button (only visible on mobile) */}
      <button className="directory-toggle" onClick={toggleDirectory}>
        <span>
          <FaFolder /> {directoryVisible ? 'Hide Directory' : 'Show Directory'}
        </span>
        {directoryVisible ? <FaAngleUp /> : <FaAngleDown />}
      </button>
      
      <div className="home-content">
        {directoryVisible && (
          <div className="notes-sidebar">
            <NotesSidebar 
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategoryId}
            />
          </div>
        )}
        
        <div className="notes-main">
          <NoteForm onNoteAdded={handleNoteAdded} />
          
          <div className="notes-container">
            <h2>
              <FaStream /> 
              {selectedCategoryId ? 'Category Notes' : 'Recent Thoughts'}
              
              {selectedCategoryId && (
                <button 
                  className="show-all-button" 
                  onClick={handleShowAllNotes}
                >
                  Show All Notes
                </button>
              )}
            </h2>
            
            {error && (
              <div className="error-message">
                <FaExclamationTriangle /> {error}
              </div>
            )}
            
            {loading ? (
              <div className="loading-message">
                <FaSpinner />
                <p>Loading your thoughts...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="empty-message">
                <FaLightbulb />
                <p>No thoughts yet. Add one above to start building your knowledge network!</p>
              </div>
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
                
                {!selectedCategoryId && pagination.totalPages > 1 && (
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
      </div>
    </div>
  );
};

export default HomePage;