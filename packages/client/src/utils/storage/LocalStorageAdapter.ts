import { Note, Connection } from '@b2/shared';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, createDir, exists } from '@tauri-apps/api/fs';
import { StorageAdapter } from './StorageAdapter';

export class LocalStorageAdapter implements StorageAdapter {
  private vaultPath: string | null = null;
  
  constructor() {
    // Load saved vault path
    this.initVault();
  }
  
  private async initVault() {
    try {
      const configDir = await appConfigDir();
      const configPath = await join(configDir, 'config.json');
      
      if (await exists(configPath)) {
        const config = JSON.parse(await readTextFile(configPath));
        this.vaultPath = config.vaultPath || null;
      }
    } catch (error) {
      console.error('Failed to initialize vault:', error);
      this.vaultPath = null;
    }
  }
  
  async isVaultReady(): Promise<boolean> {
    return this.vaultPath !== null;
  }
  
  async selectVault(): Promise<boolean> {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Second Brain Vault'
      });
      
      if (selected) {
        this.vaultPath = selected as string;
        
        // Save vault path
        const configDir = await appConfigDir();
        const configPath = await join(configDir, 'config.json');
        await createDir(configDir, { recursive: true });
        await writeTextFile(configPath, JSON.stringify({ vaultPath: this.vaultPath }));
        
        // Ensure the notes directory exists
        const notesDir = await join(this.vaultPath, 'notes');
        if (!(await exists(notesDir))) {
          await createDir(notesDir, { recursive: true });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to select vault:', error);
      return false;
    }
  }
  
  async getNotes(): Promise<Note[]> {
    if (!this.vaultPath) {
      return [];
    }
    
    try {
      const notesPath = await join(this.vaultPath, 'notes.json');
      
      if (!(await exists(notesPath))) {
        // Create an empty notes file if it doesn't exist
        await writeTextFile(notesPath, JSON.stringify([]));
        return [];
      }
      
      const notesJson = await readTextFile(notesPath);
      return JSON.parse(notesJson);
    } catch (error) {
      console.error('Failed to read notes:', error);
      return [];
    }
  }
  
  async getNote(id: string): Promise<Note | null> {
    const notes = await this.getNotes();
    return notes.find(note => note.id === id) || null;
  }
  
  async saveNote(note: Note): Promise<boolean> {
    if (!this.vaultPath) {
      return false;
    }
    
    try {
      // Get existing notes
      const notes = await this.getNotes();
      const index = notes.findIndex(n => n.id === note.id);
      
      if (index >= 0) {
        notes[index] = note;
      } else {
        notes.push(note);
      }
      
      // Save all notes
      const notesPath = await join(this.vaultPath, 'notes.json');
      await writeTextFile(notesPath, JSON.stringify(notes, null, 2));
      
      return true;
    } catch (error) {
      console.error('Failed to save note:', error);
      return false;
    }
  }
  
  async deleteNote(id: string): Promise<boolean> {
    if (!this.vaultPath) {
      return false;
    }
    
    try {
      const notes = await this.getNotes();
      const filteredNotes = notes.filter(note => note.id !== id);
      
      if (filteredNotes.length === notes.length) {
        return false; // Note not found
      }
      
      const notesPath = await join(this.vaultPath, 'notes.json');
      await writeTextFile(notesPath, JSON.stringify(filteredNotes, null, 2));
      
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }
  
  async getConnections(): Promise<Connection[]> {
    if (!this.vaultPath) {
      return [];
    }
    
    try {
      const connectionsPath = await join(this.vaultPath, 'connections.json');
      
      if (!(await exists(connectionsPath))) {
        // Create an empty connections file if it doesn't exist
        await writeTextFile(connectionsPath, JSON.stringify([]));
        return [];
      }
      
      const connectionsJson = await readTextFile(connectionsPath);
      return JSON.parse(connectionsJson);
    } catch (error) {
      console.error('Failed to read connections:', error);
      return [];
    }
  }
  
  async saveConnection(connection: Connection): Promise<boolean> {
    if (!this.vaultPath) {
      return false;
    }
    
    try {
      const connections = await this.getConnections();
      const index = connections.findIndex(c => c.id === connection.id);
      
      if (index >= 0) {
        connections[index] = connection;
      } else {
        connections.push(connection);
      }
      
      const connectionsPath = await join(this.vaultPath, 'connections.json');
      await writeTextFile(connectionsPath, JSON.stringify(connections, null, 2));
      
      return true;
    } catch (error) {
      console.error('Failed to save connection:', error);
      return false;
    }
  }
  
  async deleteConnection(id: string): Promise<boolean> {
    if (!this.vaultPath) {
      return false;
    }
    
    try {
      const connections = await this.getConnections();
      const filteredConnections = connections.filter(c => c.id !== id);
      
      if (filteredConnections.length === connections.length) {
        return false; // Connection not found
      }
      
      const connectionsPath = await join(this.vaultPath, 'connections.json');
      await writeTextFile(connectionsPath, JSON.stringify(filteredConnections, null, 2));
      
      return true;
    } catch (error) {
      console.error('Failed to delete connection:', error);
      return false;
    }
  }
}