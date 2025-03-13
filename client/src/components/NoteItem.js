import React from 'react';
import './NoteItem.css';

const NoteItem = ({ note }) => {
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <div className="note-item">
      <div className="note-content">{note.content}</div>
      <div className="note-timestamp">{formatDate(note.createdAt)}</div>
    </div>
  );
};

export default NoteItem;