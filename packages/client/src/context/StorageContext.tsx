// packages/client/src/context/StorageContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Note, Connection } from '@b2/shared';
import { StorageAdapter } from '../utils/storage/StorageAdapter';
import { CloudStorageAdapter } from '../utils/storage/CloudStorageAdapter';
import { LocalStorageAdapter } from '../utils/storage/LocalStorageAdapter';

// Define storage modes
export type StorageMode = 'local' | 'cloud';

interface StorageContextValue {
  notes: Note[];
  connections: Connection[];
  loading: boolean;
  error: string | null;
  storageMode: StorageMode;
  isVaultSelected: boolean;
  switchStorageMode: (mode: StorageMode) => Promise<void>;
  addNote: (content: string) => Promise<Note | null>;
  updateNote: (id: string, content: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  addConnection: (sourceId: string, targetId: string) => Promise<Connection | null>;
  deleteConnection: (id: string) => Promise<boolean>;
  selectVault: () => Promise<boolean>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export const StorageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [storageMode, setStorageMode] = useState<StorageMode>('cloud');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVaultSelected, setIsVaultSelected] = useState<boolean>(false);
  
  // Adapters
  const [cloudAdapter] = useState<StorageAdapter>(new CloudStorageAdapter());
  const [localAdapter] = useState<StorageAdapter>(new LocalStorageAdapter());
  
  // Current adapter based on mode
  const getAdapter = (): StorageAdapter => {
    return storageMode === 'local' ? localAdapter : cloudAdapter;
  };
  
  // Determine if we're in a Tauri context (desktop app)
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
  
  // Initialize based on environment
  useEffect(() => {
    async function initialize() {
      try {
        // Default to cloud in web app, local in desktop app
        const defaultMode = isTauri ? 'local' : 'cloud';
        await switchStorageMode(defaultMode);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to initialize storage:', error);
        setError(`Failed to initialize storage: ${error.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    }
    
    initialize();
  }, []);
  
  // Switch between storage modes
  const switchStorageMode = async (mode: StorageMode) => {
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'local') {
        if (!isTauri) {
          throw new Error('Local storage mode is only available in the desktop app');
        }
        
        // Check if vault is selected
        try {
          const localAdapterWithMethods = localAdapter as LocalStorageAdapter;
          const vaultReady = await localAdapterWithMethods.isVaultReady();
          setIsVaultSelected(vaultReady);
          
          if (!vaultReady) {
            setStorageMode(mode);
            setNotes([]);
            setConnections([]);
            return;
          }
        } catch (err) {
          setIsVaultSelected(false);
          setStorageMode(mode);
          setNotes([]);
          setConnections([]);
          return;
        }
      }
      
      // Get the adapter for the selected mode
      const adapter = mode === 'local' ? localAdapter : cloudAdapter;
      
      // Load data from the adapter
      const loadedNotes = await adapter.getNotes();
      const loadedConnections = await adapter.getConnections();
      
      setNotes(loadedNotes);
      setConnections(loadedConnections);
      setStorageMode(mode);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to switch storage mode:', error);
      setError(`Failed to switch to ${mode} storage: ${error.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new note
  const addNote = async (content: string): Promise<Note | null> => {
    try {
      const newNote: Note = {
        id: Date.now().toString(),
        content,
        createdAt: new Date().toISOString()
      };
      
      const success = await getAdapter().saveNote(newNote);
      
      if (success) {
        setNotes(prev => [...prev, newNote]);
        return newNote;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to add note:', err);
      return null;
    }
  };
  
  // Update an existing note
  const updateNote = async (id: string, content: string): Promise<boolean> => {
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return false;
      
      const updatedNote = {
        ...note,
        content,
        updatedAt: new Date().toISOString()
      };
      
      const success = await getAdapter().saveNote(updatedNote);
      
      if (success) {
        setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to update note:', err);
      return false;
    }
  };
  
  // Delete a note
  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const success = await getAdapter().deleteNote(id);
      
      if (success) {
        setNotes(prev => prev.filter(n => n.id !== id));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to delete note:', err);
      return false;
    }
  };
  
  // Add a connection
  const addConnection = async (sourceId: string, targetId: string): Promise<Connection | null> => {
    try {
      const newConnection: Connection = {
        id: Date.now().toString(),
        sourceId,
        targetId,
        strength: 0.5, // Default strength
        type: 'manual',
        createdAt: new Date().toISOString()
      };
      
      const success = await getAdapter().saveConnection(newConnection);
      
      if (success) {
        setConnections(prev => [...prev, newConnection]);
        return newConnection;
      }
      
      return null;
    } catch (err) {
      console.error('Failed to add connection:', err);
      return null;
    }
  };
  
  // Delete a connection
  const deleteConnection = async (id: string): Promise<boolean> => {
    try {
      const success = await getAdapter().deleteConnection(id);
      
      if (success) {
        setConnections(prev => prev.filter(c => c.id !== id));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to delete connection:', err);
      return false;
    }
  };
  
  // Select vault for local storage
  const selectVault = async (): Promise<boolean> => {
    if (storageMode === 'local') {
      const localAdapterWithMethods = localAdapter as LocalStorageAdapter;
      const success = await localAdapterWithMethods.selectVault();
      
      if (success) {
        setIsVaultSelected(true);
        
        // Reload data after vault selection
        const loadedNotes = await localAdapter.getNotes();
        const loadedConnections = await localAdapter.getConnections();
        
        setNotes(loadedNotes);
        setConnections(loadedConnections);
      }
      
      return success;
    }
    
    return false;
  };
  
  return (
    <StorageContext.Provider value={{
      notes,
      connections,
      loading,
      error,
      storageMode,
      isVaultSelected,
      switchStorageMode,
      addNote,
      updateNote,
      deleteNote,
      addConnection,
      deleteConnection,
      selectVault
    }}>
      {children}
    </StorageContext.Provider>
  );
};

// Custom hook for using the storage context
export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}