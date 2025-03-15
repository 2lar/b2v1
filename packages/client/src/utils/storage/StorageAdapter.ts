// packages/client/src/utils/storage/StorageAdapter.ts
import { Note, Connection } from '@b2/shared';

export interface StorageAdapter {
  // Notes operations
  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | null>;
  saveNote(note: Note): Promise<boolean>;
  deleteNote(id: string): Promise<boolean>;
  
  // Connections operations
  getConnections(): Promise<Connection[]>;
  saveConnection(connection: Connection): Promise<boolean>;
  deleteConnection(id: string): Promise<boolean>;
}