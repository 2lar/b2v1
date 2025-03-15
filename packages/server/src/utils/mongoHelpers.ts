import dotenv from 'dotenv';
import { Note, Connection, CategoriesData, LlmConfig, Category } from '@b2/shared';
import { Note as NoteModel } from '../models';
import { Connection as ConnectionModel } from '../models';
import { Category as CategoryModel } from '../models';
import { NoteCategory as NoteCategoryModel } from '../models';
import { CategoryHierarchy as CategoryHierarchyModel } from '../models';
import { LlmConfig as LlmConfigModel } from '../models';
import { LlmConfigDocument } from 'src/models/LlmConfig';

// Load environment variables
dotenv.config();

// Note functions
export const readNotes = async (): Promise<Note[]> => {
  try {
    const notes = await NoteModel.find().sort({ createdAt: -1 });
    return notes.map(note => note.toObject() as Note);
  } catch (error) {
    console.error('Error reading notes from MongoDB:', error);
    return [];
  }
};

export const writeNotes = async (notes: Note[]): Promise<boolean> => {
  try {
    // This is a full replace operation - be careful!
    // First delete all existing notes
    await NoteModel.deleteMany({});
    
    // Then insert all new notes
    if (notes.length > 0) {
      await NoteModel.insertMany(notes);
    }
    
    return true;
  } catch (error) {
    console.error('Error writing notes to MongoDB:', error);
    return false;
  }
};

// Connection functions
export const readConnections = async (): Promise<Connection[]> => {
  try {
    const connections = await ConnectionModel.find().sort({ createdAt: -1 });
    return connections.map(conn => conn.toObject() as Connection);
  } catch (error) {
    console.error('Error reading connections from MongoDB:', error);
    return [];
  }
};

export const writeConnections = async (connections: Connection[]): Promise<boolean> => {
  try {
    // This is a full replace operation
    await ConnectionModel.deleteMany({});
    
    if (connections.length > 0) {
      await ConnectionModel.insertMany(connections);
    }
    
    return true;
  } catch (error) {
    console.error('Error writing connections to MongoDB:', error);
    return false;
  }
};

// Categories functions
export const readCategories = async (): Promise<CategoriesData> => {
  try {
    // Get all categories
    const categories = await CategoryModel.find().sort({ level: 1, name: 1 });
    
    // Get note-category mappings
    const noteCategoryMappings = await NoteCategoryModel.find();
    
    // Get category hierarchy
    const categoryHierarchies = await CategoryHierarchyModel.find();
    
    // Build noteCategoryMap
    const noteCategoryMap: Record<string, string[]> = {};
    
    noteCategoryMappings.forEach(mapping => {
      if (!noteCategoryMap[mapping.noteId]) {
        noteCategoryMap[mapping.noteId] = [];
      }
      noteCategoryMap[mapping.noteId].push(mapping.categoryId);
    });
    
    // Build hierarchy
    const hierarchy: Record<string, string[]> = {};
    
    categoryHierarchies.forEach(relation => {
      if (!hierarchy[relation.parentId]) {
        hierarchy[relation.parentId] = [];
      }
      hierarchy[relation.parentId].push(relation.childId);
    });
    
    return {
      categories: categories.map(cat => cat.toObject() as Category),
      noteCategoryMap,
      hierarchy
    };
  } catch (error) {
    console.error('Error reading categories from MongoDB:', error);
    return { categories: [], noteCategoryMap: {}, hierarchy: {} };
  }
};

export const writeCategories = async (categoriesData: CategoriesData): Promise<boolean> => {
  try {
    // Begin a transaction/session
    const session = await CategoryModel.startSession();
    session.startTransaction();
    
    try {
      // Clear all existing data
      await CategoryModel.deleteMany({}, { session });
      await NoteCategoryModel.deleteMany({}, { session });
      await CategoryHierarchyModel.deleteMany({}, { session });
      
      // Insert new categories
      if (categoriesData.categories.length > 0) {
        await CategoryModel.insertMany(
          categoriesData.categories.map(cat => ({
            _id: cat.id,
            name: cat.name,
            level: cat.level,
            noteCount: cat.noteCount || 0,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : undefined
          })),
          { session }
        );
      }
      
      // Insert note-category mappings
      const noteCategoryMappings = [];
      for (const [noteId, categoryIds] of Object.entries(categoriesData.noteCategoryMap)) {
        for (const categoryId of categoryIds) {
          noteCategoryMappings.push({
            noteId,
            categoryId
          });
        }
      }
      
      if (noteCategoryMappings.length > 0) {
        await NoteCategoryModel.insertMany(noteCategoryMappings, { session });
      }
      
      // Insert category hierarchy
      const hierarchyMappings = [];
      for (const [parentId, childIds] of Object.entries(categoriesData.hierarchy)) {
        for (const childId of childIds) {
          hierarchyMappings.push({
            parentId,
            childId
          });
        }
      }
      
      if (hierarchyMappings.length > 0) {
        await CategoryHierarchyModel.insertMany(hierarchyMappings, { session });
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      return true;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error writing categories to MongoDB:', error);
    return false;
  }
};

const convertLlmDocToInterface = (configDoc: any): LlmConfig => {
    if (!configDoc) return null;
  
    // Create a proper LlmConfig object with the model field set from modelName
    const config: LlmConfig = {
      provider: configDoc.provider,
      geminiApiKey: configDoc.geminiApiKey || '',
      localLlmUrl: configDoc.localLlmUrl,
      localLlmModel: configDoc.localLlmModel,
      model: configDoc.modelName, // Set model from modelName
      selectedAgentId: configDoc.selectedAgentId,
      generationConfig: configDoc.generationConfig,
      safetySettings: configDoc.safetySettings
    };
  
    return config;
  };

// LLM Config functions
export const readLlmConfig = async (): Promise<LlmConfig> => {
    try {
      // Try to find the singleton config
      let configDoc = await LlmConfigModel.findById('config');
      
      // If no config exists, create a default one
      if (!configDoc) {
        const defaultConfig: Partial<LlmConfigDocument> = {
          provider: 'gemini',
          geminiApiKey: process.env.GEMINI_API_KEY || '',
          localLlmUrl: 'http://localhost:11434/api/generate',
          localLlmModel: 'mistral',
          modelName: 'gemini-2.0-flash',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 1,
            topK: 1
          }
        };
        
        configDoc = await LlmConfigModel.create({ _id: 'config', ...defaultConfig });
      }
      
      // Convert to LlmConfig interface
      const config = convertLlmDocToInterface(configDoc.toObject());
      
      // Prioritize environment variable for API key if available
      if (process.env.GEMINI_API_KEY) {
        config.geminiApiKey = process.env.GEMINI_API_KEY;
      }
      
      return config;
    } catch (error) {
      console.error('Error reading LLM config from MongoDB:', error);
      
      // Return default config if there's an error
      return {
        provider: 'gemini',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        localLlmUrl: 'http://localhost:11434/api/generate',
        localLlmModel: 'mistral',
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 1,
          topK: 1
        }
      };
    }
  };

export const writeLlmConfig = async (config: LlmConfig): Promise<boolean> => {
  try {
    // Update or create the config
    await LlmConfigModel.findByIdAndUpdate(
      'config',
      { ...config },
      { upsert: true, new: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error writing LLM config to MongoDB:', error);
    return false;
  }
};

// Add more specific methods for individual operations (for efficiency)
// These methods avoid loading/saving the entire collection

// Notes operations
export const findNoteById = async (id: string): Promise<Note | null> => {
  try {
    const note = await NoteModel.findById(id);
    return note ? note.toObject() as Note : null;
  } catch (error) {
    console.error(`Error finding note with ID ${id}:`, error);
    return null;
  }
};

export const createNote = async (content: string): Promise<Note | null> => {
  try {
    const note = await NoteModel.create({
      content,
      createdAt: new Date()
    });
    
    return note.toObject() as Note;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
};

export const updateNote = async (id: string, content: string): Promise<Note | null> => {
  try {
    const note = await NoteModel.findByIdAndUpdate(
      id,
      {
        content,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    return note ? note.toObject() as Note : null;
  } catch (error) {
    console.error(`Error updating note with ID ${id}:`, error);
    return null;
  }
};

export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const result = await NoteModel.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error(`Error deleting note with ID ${id}:`, error);
    return false;
  }
};

// Connections operations
export const createConnection = async (connection: Connection): Promise<Connection | null> => {
  try {
    const newConnection = await ConnectionModel.create(connection);
    return newConnection.toObject() as Connection;
  } catch (error) {
    console.error('Error creating connection:', error);
    return null;
  }
};

export const deleteConnection = async (id: string): Promise<boolean> => {
  try {
    const result = await ConnectionModel.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    console.error(`Error deleting connection with ID ${id}:`, error);
    return false;
  }
};

export const findConnectionsForNote = async (noteId: string): Promise<Connection[]> => {
  try {
    const connections = await ConnectionModel.find({
      $or: [{ sourceId: noteId }, { targetId: noteId }]
    });
    
    return connections.map(conn => conn.toObject() as Connection);
  } catch (error) {
    console.error(`Error finding connections for note with ID ${noteId}:`, error);
    return [];
  }
};

// Create a function to ensure the database is initialized with default values
export const ensureDatabaseInitialized = async (): Promise<void> => {
  try {
    // Check if we have any LLM config
    const configCount = await LlmConfigModel.countDocuments();
    if (configCount === 0) {
      // Create default LLM config
      const defaultConfig: LlmConfig = {
        provider: 'gemini',
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        localLlmUrl: 'http://localhost:11434/api/generate',
        localLlmModel: 'mistral',
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 1,
          topK: 1
        }
      };
      
      await LlmConfigModel.create({ _id: 'config', ...defaultConfig });
      console.log('Created default LLM configuration');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Export a function to get a connection status
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple query to check if the database is available
    await NoteModel.findOne();
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};