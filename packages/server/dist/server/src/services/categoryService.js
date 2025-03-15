"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategoriesFromConnection = exports.rebuildAllCategories = exports.getNotesByCategory = exports.getCategoryHierarchy = exports.getAllCategories = exports.getNoteCategories = exports.categorizeNote = void 0;
const fileHelpers_1 = require("../utils/fileHelpers");
const textUtils_1 = require("../utils/textUtils");
const llmClient = __importStar(require("./llmClient"));
/**
 * Find existing categories that match keywords
 */
const findMatchingCategories = (keywords, categories) => {
    const matches = [];
    for (const category of categories) {
        // Check if any keyword is in the category name
        const categoryWords = category.name.toLowerCase().split(/\s+/);
        const hasMatch = keywords.some(keyword => categoryWords.includes(keyword) ||
            categoryWords.some(word => word.includes(keyword) || keyword.includes(word)));
        if (hasMatch) {
            matches.push({
                id: category.id,
                name: category.name,
                level: category.level || 0,
            });
        }
    }
    return matches;
};
/**
 * Generate categories using LLM
 */
const generateCategoriesWithLLM = async (noteContent, existingCategories) => {
    try {
        // Check if LLM is available
        const llmAvailable = await llmClient.isLlmAvailable();
        if (!llmAvailable) {
            return null;
        }
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
                return JSON.parse(jsonMatch[0]);
            }
        }
        catch (parseError) {
            console.error('Error parsing LLM response:', parseError);
        }
        return null;
    }
    catch (error) {
        console.error('Error generating categories with LLM:', error);
        return null;
    }
};
/**
 * Assign categories to a note
 */
const categorizeNote = async (note) => {
    const categoriesData = (0, fileHelpers_1.readCategories)();
    const { categories, noteCategoryMap, hierarchy } = categoriesData;
    // Extract keywords from note content
    const keywords = (0, textUtils_1.extractKeywords)(note.content);
    // Find matching existing categories
    const matchingCategories = findMatchingCategories(keywords, categories);
    let noteCategories = [];
    // Try LLM categorization first
    const aiCategories = await generateCategoriesWithLLM(note.content, categories);
    if (aiCategories && aiCategories.categories && aiCategories.categories.length > 0) {
        // Process LLM-generated categories
        noteCategories = aiCategories.categories.map(cat => {
            // Check if this category already exists
            const existingCategory = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase());
            if (existingCategory) {
                return {
                    id: existingCategory.id,
                    name: existingCategory.name,
                    level: cat.level
                };
            }
            else {
                // Create new category
                const newCategoryId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                return {
                    id: newCategoryId,
                    name: cat.name,
                    level: cat.level
                };
            }
        });
    }
    else if (matchingCategories.length > 0) {
        // Use matching categories if LLM categorization failed
        noteCategories = matchingCategories;
    }
    else if (keywords.length > 0) {
        // Create a new category from top keywords if no matches
        const categoryName = keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1);
        const categoryId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        noteCategories = [{
                id: categoryId,
                name: categoryName,
                level: 0
            }];
    }
    // Update categories and hierarchy
    const updatedCategories = [...categories];
    for (const category of noteCategories) {
        // Add category if it doesn't exist
        if (!updatedCategories.some(c => c.id === category.id)) {
            updatedCategories.push({
                id: category.id,
                name: category.name,
                level: category.level || 0,
                noteCount: 0
            });
        }
        // Update hierarchy
        if (category.level > 0) {
            // Find parent category (category with level-1)
            const parentCategory = noteCategories.find(c => c.level === category.level - 1);
            if (parentCategory) {
                if (!hierarchy[parentCategory.id]) {
                    hierarchy[parentCategory.id] = [];
                }
                if (!hierarchy[parentCategory.id].includes(category.id)) {
                    hierarchy[parentCategory.id].push(category.id);
                }
            }
        }
    }
    // Update note category map and note counts
    const updatedNoteCategoryMap = { ...noteCategoryMap };
    updatedNoteCategoryMap[note.id] = noteCategories.map(c => c.id);
    // Update note counts for categories
    for (const categoryId of updatedNoteCategoryMap[note.id]) {
        const categoryIndex = updatedCategories.findIndex(c => c.id === categoryId);
        if (categoryIndex !== -1) {
            updatedCategories[categoryIndex] = {
                ...updatedCategories[categoryIndex],
                noteCount: (updatedCategories[categoryIndex].noteCount || 0) + 1
            };
        }
    }
    // Save categories data
    (0, fileHelpers_1.writeCategories)({
        categories: updatedCategories,
        noteCategoryMap: updatedNoteCategoryMap,
        hierarchy
    });
    return {
        noteId: note.id,
        categories: noteCategories
    };
};
exports.categorizeNote = categorizeNote;
/**
 * Get categories for a note
 */
const getNoteCategories = (noteId) => {
    const categoriesData = (0, fileHelpers_1.readCategories)();
    const { categories, noteCategoryMap } = categoriesData;
    const categoryIds = noteCategoryMap[noteId] || [];
    return categoryIds.map(id => {
        const category = categories.find(c => c.id === id);
        return category || null;
    }).filter((category) => category !== null);
};
exports.getNoteCategories = getNoteCategories;
/**
 * Get all categories
 */
const getAllCategories = () => {
    const categoriesData = (0, fileHelpers_1.readCategories)();
    return categoriesData.categories;
};
exports.getAllCategories = getAllCategories;
/**
 * Get category hierarchy
 */
const getCategoryHierarchy = () => {
    const categoriesData = (0, fileHelpers_1.readCategories)();
    return {
        categories: categoriesData.categories,
        hierarchy: categoriesData.hierarchy
    };
};
exports.getCategoryHierarchy = getCategoryHierarchy;
/**
 * Get notes by category
 */
const getNotesByCategory = (categoryId) => {
    const categoriesData = (0, fileHelpers_1.readCategories)();
    const { noteCategoryMap } = categoriesData;
    const notes = (0, fileHelpers_1.readNotes)();
    // Find all notes with this category
    const noteIds = Object.entries(noteCategoryMap)
        .filter(([_, categories]) => categories.includes(categoryId))
        .map(([noteId]) => noteId);
    return notes.filter(note => noteIds.includes(note.id));
};
exports.getNotesByCategory = getNotesByCategory;
/**
 * Rebuild categories for all notes
 * This can be useful to run periodically to refine categories as new content is added
 */
const rebuildAllCategories = async () => {
    const notes = (0, fileHelpers_1.readNotes)();
    const results = [];
    // Clear existing category data
    const categoriesData = {
        categories: [],
        noteCategoryMap: {},
        hierarchy: {}
    };
    (0, fileHelpers_1.writeCategories)(categoriesData);
    // Categorize each note
    for (const note of notes) {
        const result = await (0, exports.categorizeNote)(note);
        results.push(result);
    }
    return results;
};
exports.rebuildAllCategories = rebuildAllCategories;
/**
 * Update categories when notes are connected
 * When two notes are connected, we may want to refine their categorization
 */
const updateCategoriesFromConnection = async (sourceNoteId, targetNoteId, strength) => {
    const notes = (0, fileHelpers_1.readNotes)();
    const sourceNote = notes.find(note => note.id === sourceNoteId);
    const targetNote = notes.find(note => note.id === targetNoteId);
    if (!sourceNote || !targetNote)
        return null;
    const categoriesData = (0, fileHelpers_1.readCategories)();
    const { categories, noteCategoryMap, hierarchy } = categoriesData;
    // Get existing categories for both notes
    const sourceCategories = (0, exports.getNoteCategories)(sourceNoteId);
    const targetCategories = (0, exports.getNoteCategories)(targetNoteId);
    // Only proceed if the connection is strong and the notes have different categories
    if (strength < 0.5)
        return null;
    // Find common topics between the notes
    const combinedText = sourceNote.content + ' ' + targetNote.content;
    const keywords = (0, textUtils_1.extractKeywords)(combinedText);
    // Determine if we need to create a higher-level category to group these notes
    if (sourceCategories.length > 0 && targetCategories.length > 0) {
        const sourceCategoryNames = sourceCategories.map(c => c.name.toLowerCase());
        const targetCategoryNames = targetCategories.map(c => c.name.toLowerCase());
        // Check if there's considerable overlap in keywords but different categories
        const hasOverlap = sourceCategoryNames.some(name => targetCategoryNames.some(targetName => (0, textUtils_1.calculateCosineSimilarity)(name, targetName) > 0.3));
        if (hasOverlap) {
            // Create or find a parent category that can group these
            const aiResponse = await generateCategoriesWithLLM(`Note 1: ${sourceNote.content}\nNote 2: ${targetNote.content}`, categories);
            if (aiResponse && aiResponse.categories && aiResponse.categories.length > 0) {
                // Get the highest level (most general) category
                const parentCategory = aiResponse.categories.reduce((prev, current) => (current.level < prev.level ? current : prev), aiResponse.categories[0]);
                // Create or find this category
                let parentCategoryId;
                const existingCategory = categories.find(c => c.name.toLowerCase() === parentCategory.name.toLowerCase());
                if (existingCategory) {
                    parentCategoryId = existingCategory.id;
                }
                else {
                    parentCategoryId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    categories.push({
                        id: parentCategoryId,
                        name: parentCategory.name,
                        level: 0,
                        noteCount: 0
                    });
                }
                // Link all categories to this parent
                for (const sourceCategory of sourceCategories) {
                    if (!hierarchy[parentCategoryId]) {
                        hierarchy[parentCategoryId] = [];
                    }
                    if (!hierarchy[parentCategoryId].includes(sourceCategory.id)) {
                        hierarchy[parentCategoryId].push(sourceCategory.id);
                    }
                }
                for (const targetCategory of targetCategories) {
                    if (!hierarchy[parentCategoryId]) {
                        hierarchy[parentCategoryId] = [];
                    }
                    if (!hierarchy[parentCategoryId].includes(targetCategory.id)) {
                        hierarchy[parentCategoryId].push(targetCategory.id);
                    }
                }
                // Add parent category to both notes
                for (const noteId of [sourceNoteId, targetNoteId]) {
                    if (!noteCategoryMap[noteId]) {
                        noteCategoryMap[noteId] = [];
                    }
                    if (!noteCategoryMap[noteId].includes(parentCategoryId)) {
                        noteCategoryMap[noteId].push(parentCategoryId);
                        // Update note count
                        const category = categories.find(c => c.id === parentCategoryId);
                        if (category) {
                            const categoryIndex = categories.indexOf(category);
                            categories[categoryIndex] = {
                                ...category,
                                noteCount: (category.noteCount || 0) + 1
                            };
                        }
                    }
                }
                // Save updated categories
                (0, fileHelpers_1.writeCategories)({ categories, noteCategoryMap, hierarchy });
                return {
                    sourceNoteId,
                    targetNoteId,
                    parentCategory: {
                        id: parentCategoryId,
                        name: parentCategory.name
                    }
                };
            }
        }
    }
    return null;
};
exports.updateCategoriesFromConnection = updateCategoriesFromConnection;
