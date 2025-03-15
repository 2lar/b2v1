// packages/server/src/services/categoryService.ts
import mongoose from 'mongoose';
import { Note, Category, CategoriesData } from '@b2/shared';
import { extractKeywords, calculateCosineSimilarity } from '../utils/textUtils';
import * as llmClient from './llmClient';
import {
  Category as CategoryModel,
  NoteCategory as NoteCategoryModel,
  CategoryHierarchy as CategoryHierarchyModel,
  Note as NoteModel
} from '../models';

interface CategoryResult {
  noteId: string;
  categories: Category[];
}

interface GeneratedCategories {
  categories: Category[];
}

interface ParentCategoryResult {
  sourceNoteId: string;
  targetNoteId: string;
  parentCategory: {
    id: string;
    name: string;
  };
}

/**
 * Find existing categories that match keywords
 */
const findMatchingCategories = async (keywords: string[]): Promise<Category[]> => {
  try {
    // Find categories that match any of the keywords
    const categories = await CategoryModel.find({
      name: {
        $regex: keywords.join('|'),
        $options: 'i'
      }
    });
    
    return categories.map(cat => cat.toObject() as Category);
  } catch (error) {
    console.error('Error finding matching categories:', error);
    return [];
  }
};

/**
 * Generate categories using LLM
 */
const generateCategoriesWithLLM = async (noteContent: string): Promise<GeneratedCategories | null> => {
  try {
    // Check if LLM is available
    const llmAvailable = await llmClient.isLlmAvailable();
    if (!llmAvailable) {
      return null;
    }
    
    // Get existing categories for context
    const existingCategories = await CategoryModel.find();
    const existingCategoryNames = existingCategories.map(c => c.name).join(', ');
    
    const prompt = `You are an expert at categorizing content. Please analyze this text and:
1. Identify 1-3 hierarchical categories for it (general → specific)
2. Consider existing categories in our system: [${existingCategoryNames}]
3. Return your response as a JSON object with this format:
{
  "categories": [
    {"name": "Category name", "level": 0},
    {"name": "More specific category", "level": 1},
    {"name": "Most specific category", "level": 2}
  ]
}

Text to categorize:
${noteContent}

Only respond with the JSON.`;
    
    const responseText = await llmClient.generateText(prompt, { 
      temperature: 0.5,
      maxTokens: 300
    });
    
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as GeneratedCategories;
      }
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error generating categories with LLM:', error);
    return null;
  }
};

/**
 * Assign categories to a note
 */
export const categorizeNote = async (note: Note): Promise<CategoryResult> => {
  try {
    // Extract keywords from note content
    const keywords = extractKeywords(note.content);
    
    // Find matching existing categories
    const matchingCategories = await findMatchingCategories(keywords);
    
    let noteCategories: Category[] = [];
    
    // Try LLM categorization first
    const aiCategories = await generateCategoriesWithLLM(note.content);
    
    if (aiCategories && aiCategories.categories && aiCategories.categories.length > 0) {
      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Process LLM-generated categories
        const processedCategories: Category[] = [];
        
        for (const cat of aiCategories.categories) {
          // Check if this category already exists
          let existingCategory = await CategoryModel.findOne({
            name: { $regex: new RegExp(`^${cat.name}$`, 'i') }
          }).session(session);
          
          if (existingCategory) {
            processedCategories.push(existingCategory.toObject() as Category);
          } else {
            // Create new category
            const newCategory = await CategoryModel.create([{
              name: cat.name,
              level: cat.level,
              noteCount: 0
            }], { session });
            
            processedCategories.push(newCategory[0].toObject() as Category);
          }
        }
        
        // Update note-category mappings
        const noteCategoryMappings = processedCategories.map(cat => ({
          noteId: note.id,
          categoryId: cat.id
        }));
        
        // Remove any existing mappings for this note
        await NoteCategoryModel.deleteMany({ noteId: note.id }, { session });
        
        // Create new mappings
        if (noteCategoryMappings.length > 0) {
          await NoteCategoryModel.insertMany(noteCategoryMappings, { session });
        }
        
        // Update category hierarchy
        for (let i = 0; i < processedCategories.length; i++) {
          const currentCat = processedCategories[i];
          
          // Find parent category (category with level-1)
          if (currentCat.level > 0) {
            const parentCat = processedCategories.find(c => c.level === currentCat.level - 1);
            
            if (parentCat) {
              // Check if hierarchy relation already exists
              const existingHierarchy = await CategoryHierarchyModel.findOne({
                parentId: parentCat.id,
                childId: currentCat.id
              }).session(session);
              
              if (!existingHierarchy) {
                await CategoryHierarchyModel.create([{
                  parentId: parentCat.id,
                  childId: currentCat.id
                }], { session });
              }
            }
          }
        }
        
        // Update note counts for categories
        for (const category of processedCategories) {
          await CategoryModel.findByIdAndUpdate(
            category.id,
            { $inc: { noteCount: 1 } },
            { session }
          );
        }
        
        // Commit transaction
        await session.commitTransaction();
        
        noteCategories = processedCategories;
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else if (matchingCategories.length > 0) {
      // Use matching categories if LLM categorization failed
      noteCategories = matchingCategories;
      
      // Create note-category mappings
      const noteCategoryMappings = matchingCategories.map(cat => ({
        noteId: note.id,
        categoryId: cat.id
      }));
      
      // Remove any existing mappings for this note
      await NoteCategoryModel.deleteMany({ noteId: note.id });
      
      // Create new mappings
      if (noteCategoryMappings.length > 0) {
        await NoteCategoryModel.insertMany(noteCategoryMappings);
      }
      
      // Update note counts for categories
      for (const category of matchingCategories) {
        await CategoryModel.findByIdAndUpdate(
          category.id,
          { $inc: { noteCount: 1 } }
        );
      }
    } else if (keywords.length > 0) {
      // Create a new category from top keywords if no matches
      const categoryName = keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1);
      
      const newCategory = await CategoryModel.create({
        name: categoryName,
        level: 0,
        noteCount: 1
      });
      
      // Create note-category mapping
      await NoteCategoryModel.create({
        noteId: note.id,
        categoryId: newCategory.id
      });
      
      noteCategories = [newCategory.toObject() as Category];
    }
    
    return {
      noteId: note.id,
      categories: noteCategories
    };
  } catch (error) {
    console.error('Error categorizing note:', error);
    return {
      noteId: note.id,
      categories: []
    };
  }
};

/**
 * Get categories for a note
 */
export const getNoteCategories = async (noteId: string): Promise<Category[]> => {
  try {
    // Find all category mappings for the note
    const noteCategoryMappings = await NoteCategoryModel.find({ noteId });
    
    if (noteCategoryMappings.length === 0) {
      return [];
    }
    
    // Get all category IDs
    const categoryIds = noteCategoryMappings.map(mapping => mapping.categoryId);
    
    // Find all categories
    const categories = await CategoryModel.find({ _id: { $in: categoryIds } });
    
    return categories.map(cat => cat.toObject() as Category);
  } catch (error) {
    console.error('Error getting note categories:', error);
    return [];
  }
};

/**
 * Get all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await CategoryModel.find().sort({ level: 1, name: 1 });
    return categories.map(cat => cat.toObject() as Category);
  } catch (error) {
    console.error('Error getting all categories:', error);
    return [];
  }
};

/**
 * Get category hierarchy
 */
export const getCategoryHierarchy = async (): Promise<{ categories: Category[], hierarchy: Record<string, string[]> }> => {
  try {
    // Get all categories
    const categories = await CategoryModel.find().sort({ level: 1, name: 1 });
    
    // Get category hierarchy
    const hierarchyRelations = await CategoryHierarchyModel.find();
    
    // Build hierarchy map
    const hierarchy: Record<string, string[]> = {};
    
    hierarchyRelations.forEach(relation => {
      if (!hierarchy[relation.parentId]) {
        hierarchy[relation.parentId] = [];
      }
      hierarchy[relation.parentId].push(relation.childId);
    });
    
    return {
      categories: categories.map(cat => cat.toObject() as Category),
      hierarchy
    };
  } catch (error) {
    console.error('Error getting category hierarchy:', error);
    return { categories: [], hierarchy: {} };
  }
};

/**
 * Get notes by category
 */
export const getNotesByCategory = async (categoryId: string): Promise<Note[]> => {
  try {
    // Find all note-category mappings for this category
    const noteCategoryMappings = await NoteCategoryModel.find({ categoryId });
    
    if (noteCategoryMappings.length === 0) {
      return [];
    }
    
    // Get all note IDs
    const noteIds = noteCategoryMappings.map(mapping => mapping.noteId);
    
    // Find all notes
    const notes = await NoteModel.find({ _id: { $in: noteIds } });
    
    return notes.map(note => note.toObject() as Note);
  } catch (error) {
    console.error('Error getting notes by category:', error);
    return [];
  }
};

/**
 * Rebuild categories for all notes
 */
export const rebuildAllCategories = async (): Promise<CategoryResult[]> => {
  try {
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Clear existing category data
      await CategoryModel.deleteMany({}, { session });
      await NoteCategoryModel.deleteMany({}, { session });
      await CategoryHierarchyModel.deleteMany({}, { session });
      
      // Commit the first phase of clearing data
      await session.commitTransaction();
      
      // Start a new transaction for rebuilding
      session.startTransaction();
      
      // Get all notes
      const notes = await NoteModel.find();
      const results: CategoryResult[] = [];
      
      // Categorize each note
      for (const note of notes) {
        const result = await categorizeNote(note.toObject() as Note);
        results.push(result);
      }
      
      // Commit the rebuild
      await session.commitTransaction();
      
      return results;
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error rebuilding categories:', error);
    return [];
  }
};

/**
 * Update categories when notes are connected
 */
export const updateCategoriesFromConnection = async (
  sourceNoteId: string, 
  targetNoteId: string, 
  strength: number
): Promise<ParentCategoryResult | null> => {
  try {
    if (strength < 0.5) return null;
    
    // Find the source and target notes
    const sourceNote = await NoteModel.findById(sourceNoteId);
    const targetNote = await NoteModel.findById(targetNoteId);
    
    if (!sourceNote || !targetNote) return null;
    
    // Get existing categories for both notes
    const sourceCategories = await getNoteCategories(sourceNoteId);
    const targetCategories = await getNoteCategories(targetNoteId);
    
    // Only proceed if the notes have different categories
    if (sourceCategories.length === 0 || targetCategories.length === 0) return null;
    
    // Find common topics between the notes
    const combinedText = sourceNote.content + ' ' + targetNote.content;
    const keywords = extractKeywords(combinedText);
    
    // Determine if we need to create a higher-level category
    const sourceCategoryNames = sourceCategories.map(c => c.name.toLowerCase());
    const targetCategoryNames = targetCategories.map(c => c.name.toLowerCase());
    
    // Check if there's considerable overlap in keywords but different categories
    const hasOverlap = sourceCategoryNames.some(name => 
      targetCategoryNames.some(targetName => 
        calculateCosineSimilarity(name, targetName) > 0.3
      )
    );
    
    if (hasOverlap) {
      // Create or find a parent category that can group these
      const aiResponse = await generateCategoriesWithLLM(
        `Note 1: ${sourceNote.content}\nNote 2: ${targetNote.content}`
      );
      
      if (aiResponse && aiResponse.categories && aiResponse.categories.length > 0) {
        // Get the highest level (most general) category
        const parentCategory = aiResponse.categories.reduce(
          (prev, current) => (current.level < prev.level ? current : prev),
          aiResponse.categories[0]
        );
        
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
          // Create or find this category
          let parentCategoryDoc = await CategoryModel.findOne({
            name: { $regex: new RegExp(`^${parentCategory.name}$`, 'i') }
          }).session(session);
          
          if (!parentCategoryDoc) {
            parentCategoryDoc = (await CategoryModel.create([{
              name: parentCategory.name,
              level: 0, // This is a parent category
              noteCount: 0
            }], { session }))[0];
          }
          
          const parentCategoryId = parentCategoryDoc.id;
          
          // Link source categories to this parent
          for (const sourceCategory of sourceCategories) {
            // Check if hierarchy relation already exists
            const existingHierarchy = await CategoryHierarchyModel.findOne({
              parentId: parentCategoryId,
              childId: sourceCategory.id
            }).session(session);
            
            if (!existingHierarchy) {
              await CategoryHierarchyModel.create([{
                parentId: parentCategoryId,
                childId: sourceCategory.id
              }], { session });
            }
          }
          
          // Link target categories to this parent
          for (const targetCategory of targetCategories) {
            // Check if hierarchy relation already exists
            const existingHierarchy = await CategoryHierarchyModel.findOne({
              parentId: parentCategoryId,
              childId: targetCategory.id
            }).session(session);
            
            if (!existingHierarchy) {
              await CategoryHierarchyModel.create([{
                parentId: parentCategoryId,
                childId: targetCategory.id
              }], { session });
            }
          }
          
          // Add parent category to both notes
          for (const noteId of [sourceNoteId, targetNoteId]) {
            // Check if mapping already exists
            const existingMapping = await NoteCategoryModel.findOne({
              noteId,
              categoryId: parentCategoryId
            }).session(session);
            
            if (!existingMapping) {
              await NoteCategoryModel.create([{
                noteId,
                categoryId: parentCategoryId
              }], { session });
              
              // Update note count
              await CategoryModel.findByIdAndUpdate(
                parentCategoryId,
                { $inc: { noteCount: 1 } },
                { session }
              );
            }
          }
          
          // Commit the transaction
          await session.commitTransaction();
          
          return {
            sourceNoteId,
            targetNoteId,
            parentCategory: {
              id: parentCategoryId,
              name: parentCategory.name
            }
          };
        } catch (error) {
          // Abort transaction on error
          await session.abortTransaction();
          throw error;
        } finally {
          session.endSession();
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error updating categories from connection:', error);
    return null;
  }
};