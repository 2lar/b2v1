import React from 'react';
import { Note } from '../../../shared/types';
import { FaClock, FaPen, FaTrash } from 'react-icons/fa';
import './NoteItem.css';

interface NoteItemProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onEdit, onDelete }) => {
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
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
      <div className="note-footer">
        <div className="note-timestamp">
          <FaClock size={12} /> {formatDate(note.createdAt)}
        </div>
        {(onEdit || onDelete) && (
          <div className="note-actions">
            {onEdit && (
              <button 
                className="edit-button" 
                onClick={() => onEdit(note)}
                aria-label="Edit note"
              >
                <FaPen size={12} /> Edit
              </button>
            )}
            {onDelete && (
              <button 
                className="delete-button" 
                onClick={() => onDelete(note.id)}
                aria-label="Delete note"
              >
                <FaTrash size={12} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteItem;