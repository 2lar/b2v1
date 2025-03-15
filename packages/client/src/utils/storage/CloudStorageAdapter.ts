// packages/client/src/utils/storage/CloudStorageAdapter.ts
import { Note, Connection } from '@b2/shared';
import { notesApi, graphApi } from '../../services/api';
import { StorageAdapter } from './StorageAdapter';

export class CloudStorageAdapter implements StorageAdapter {
  async getNotes(): Promise<Note[]> {
    try {
      return await notesApi.getAllNotes();
    } catch (error) {
      console.error('Failed to get notes from API:', error);
      return [];
    }
  }
  
  async getNote(id: string): Promise<Note | null> {
    try {
      return await notesApi.getNote(id);
    } catch (error) {
      console.error(`Failed to get note ${id} from API:`, error);
      return null;
    }
  }
  
  async saveNote(note: Note): Promise<boolean> {
    try {
      if (note.id && await this.getNote(note.id)) {
        // Update existing note
        await notesApi.updateNote(note.id, note.content);
      } else {
        // Create new note
        await notesApi.createNote(note.content);
      }
      return true;
    } catch (error) {
      console.error('Failed to save note to API:', error);
      return false;
    }
  }
  
  async deleteNote(id: string): Promise<boolean> {
    try {
      await notesApi.deleteNote(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete note ${id} from API:`, error);
      return false;
    }
  }
  
  async getConnections(): Promise<Connection[]> {
    try {
      const graphData = await graphApi.getGraphData();
      // Map GraphEdges to Connections
      return graphData.edges.map(edge => ({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        strength: edge.strength,
        type: edge.type as 'automatic' | 'manual',
        createdAt: new Date().toISOString() // Assume current time if missing
      }));
    } catch (error) {
      console.error('Failed to get connections from API:', error);
      return [];
    }
  }
  
  async saveConnection(connection: Connection): Promise<boolean> {
    try {
      await graphApi.createConnection(connection.sourceId, connection.targetId, connection.type);
      return true;
    } catch (error) {
      console.error('Failed to save connection to API:', error);
      return false;
    }
  }
  
  async deleteConnection(id: string): Promise<boolean> {
    try {
      await graphApi.deleteConnection(id);
      return true;
    } catch (error) {
      console.error(`Failed to delete connection ${id} from API:`, error);
      return false;
    }
  }
}