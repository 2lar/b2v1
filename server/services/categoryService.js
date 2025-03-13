const fs = require('fs');
const path = require('path');
const llmClient = require('./llmClient');

// Path to category data file
const dataDir = path.join(__dirname, '../data');
const categoriesPath = path.join(dataDir, 'categories.json');
const notesPath = path.join(dataDir, 'notes.json');

// Initialize categories file if it doesn't exist
if (!fs.existsSync(categoriesPath)) {
  fs.writeFileSync(categoriesPath, JSON.stringify({
    categories: [],
    noteCategoryMap: {},
    hierarchy: {}
  }));
}

// Read categories data
const readCategoriesData = () => {
  try {
    const data = fs.readFileSync(categoriesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading categories data:', error);
    return { categories: [], noteCategoryMap: {}, hierarchy: {} };
  }
};

// Write categories data
const writeCategoriesData = (data) => {
  try {
    fs.writeFileSync(categoriesPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing categories data:', error);
    return false;
  }
};

// Read notes
const readNotes = () => {
  try {
    const data = fs.readFileSync(notesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
};

/**
 * Simple function to extract keywords and potential categories from text
 * without using external NLP libraries
 */
const extractKeywords = (text) => {
  // Convert to lowercase and remove special characters
  const cleanedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanedText.split(/\s+/);
  
  // Remove common stop words
  const stopwords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
    'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 
    'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 
    'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
    'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 
    'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 
    'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 
    'don', 'should', 'now'];
  
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopwords.includes(word)
  );
  
  // Count word occurrences
  const wordCounts = {};
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Sort by count
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  
  return sortedWords.slice(0, 10); // Return top 10 keywords
};

/**
 * Find existing categories that match keywords
 */
const findMatchingCategories = (keywords, categories) => {
  const matches = [];
  
  for (const category of categories) {
    // Check if any keyword is in the category name
    const categoryWords = category.name.toLowerCase().split(/\s+/);
    const hasMatch = keywords.some(keyword => 
      categoryWords.includes(keyword) || 
      categoryWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    
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
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
    }
    
    return null;
  } catch (error) {
    console.error('Error generating categories with LLM:', error);
    return null;
  }
};

// Simple implementation of cosine similarity for text
const calculateSimilarity = (text1, text2) => {
  // Convert texts to word frequency vectors
  const getText1Words = text1.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  const getText2Words = text2.toLowerCase().split(/\W+/).filter(word => word.length > 2);
  
  // Get unique words from both texts
  const uniqueWords = [...new Set([...getText1Words, ...getText2Words])];
  
  // Create vectors
  const vector1 = uniqueWords.map(word => getText1Words.filter(w => w === word).length);
  const vector2 = uniqueWords.map(word => getText2Words.filter(w => w === word).length);
  
  // Calculate cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < uniqueWords.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Assign categories to a note
 */
const categorizeNote = async (note) => {
  const categoriesData = readCategoriesData();
  const { categories, noteCategoryMap, hierarchy } = categoriesData;
  
  // Extract keywords from note content
  const keywords = extractKeywords(note.content);
  
  // Find matching existing categories
  const matchingCategories = findMatchingCategories(keywords, categories);
  
  let noteCategories = [];
  
  // Try LLM categorization first
  const aiCategories = await generateCategoriesWithLLM(note.content, categories);
  
  if (aiCategories && aiCategories.categories) {
    // Process LLM-generated categories
    noteCategories = aiCategories.categories.map(cat => {
      // Check if this category already exists
      const existingCategory = categories.find(c => 
        c.name.toLowerCase() === cat.name.toLowerCase()
      );
      
      if (existingCategory) {
        return {
          id: existingCategory.id,
          name: existingCategory.name,
          level: cat.level
        };
      } else {
        // Create new category
        const newCategoryId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return {
          id: newCategoryId,
          name: cat.name,
          level: cat.level
        };
      }
    });
  } else if (matchingCategories.length > 0) {
    // Use matching categories if LLM categorization failed
    noteCategories = matchingCategories;
  } else if (keywords.length > 0) {
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
  for (const category of noteCategories) {
    // Add category if it doesn't exist
    if (!categories.some(c => c.id === category.id)) {
      categories.push({
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
  noteCategoryMap[note.id] = noteCategories.map(c => c.id);
  
  // Update note counts for categories
  for (const categoryId of noteCategoryMap[note.id]) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      category.noteCount = (category.noteCount || 0) + 1;
    }
  }
  
  // Save categories data
  writeCategoriesData({ categories, noteCategoryMap, hierarchy });
  
  return {
    noteId: note.id,
    categories: noteCategories
  };
};

/**
 * Get categories for a note
 */
const getNoteCategories = (noteId) => {
  const categoriesData = readCategoriesData();
  const { categories, noteCategoryMap } = categoriesData;
  
  const categoryIds = noteCategoryMap[noteId] || [];
  return categoryIds.map(id => {
    const category = categories.find(c => c.id === id);
    return category || null;
  }).filter(Boolean);
};

/**
 * Get all categories
 */
const getAllCategories = () => {
  const categoriesData = readCategoriesData();
  return categoriesData.categories;
};

/**
 * Get category hierarchy
 */
const getCategoryHierarchy = () => {
  const categoriesData = readCategoriesData();
  return {
    categories: categoriesData.categories,
    hierarchy: categoriesData.hierarchy
  };
};

/**
 * Get notes by category
 */
const getNotesByCategory = (categoryId) => {
  const categoriesData = readCategoriesData();
  const { noteCategoryMap } = categoriesData;
  const notes = readNotes();
  
  // Find all notes with this category
  const noteIds = Object.entries(noteCategoryMap)
    .filter(([_, categories]) => categories.includes(categoryId))
    .map(([noteId]) => noteId);
  
  return notes.filter(note => noteIds.includes(note.id));
};

/**
 * Rebuild categories for all notes
 * This can be useful to run periodically to refine categories as new content is added
 */
const rebuildAllCategories = async () => {
  const notes = readNotes();
  const results = [];
  
  // Clear existing category data
  const categoriesData = {
    categories: [],
    noteCategoryMap: {},
    hierarchy: {}
  };
  writeCategoriesData(categoriesData);
  
  // Categorize each note
  for (const note of notes) {
    const result = await categorizeNote(note);
    results.push(result);
  }
  
  return results;
};

/**
 * Update categories when notes are connected
 * When two notes are connected, we may want to refine their categorization
 */
const updateCategoriesFromConnection = async (sourceNoteId, targetNoteId, strength) => {
  const notes = readNotes();
  const sourceNote = notes.find(note => note.id === sourceNoteId);
  const targetNote = notes.find(note => note.id === targetNoteId);
  
  if (!sourceNote || !targetNote) return null;
  
  const categoriesData = readCategoriesData();
  const { categories, noteCategoryMap, hierarchy } = categoriesData;
  
  // Get existing categories for both notes
  const sourceCategories = getNoteCategories(sourceNoteId);
  const targetCategories = getNoteCategories(targetNoteId);
  
  // Only proceed if the connection is strong and the notes have different categories
  if (strength < 0.5) return null;
  
  // Find common topics between the notes
  const combinedText = sourceNote.content + ' ' + targetNote.content;
  const keywords = extractKeywords(combinedText);
  
  // Determine if we need to create a higher-level category to group these notes
  if (sourceCategories.length > 0 && targetCategories.length > 0) {
    const sourceCategoryNames = sourceCategories.map(c => c.name.toLowerCase());
    const targetCategoryNames = targetCategories.map(c => c.name.toLowerCase());
    
    // Check if there's considerable overlap in keywords but different categories
    const hasOverlap = sourceCategoryNames.some(name => 
      targetCategoryNames.some(targetName => 
        calculateSimilarity(name, targetName) > 0.3
      )
    );
    
    if (hasOverlap) {
      // Create or find a parent category that can group these
      const aiResponse = await generateCategoriesWithLLM(
        `Note 1: ${sourceNote.content}\nNote 2: ${targetNote.content}`,
        categories
      );
      
      if (aiResponse && aiResponse.categories && aiResponse.categories.length > 0) {
        // Get the highest level (most general) category
        const parentCategory = aiResponse.categories.reduce(
          (prev, current) => (current.level < prev.level ? current : prev),
          aiResponse.categories[0]
        );
        
        // Create or find this category
        let parentCategoryId = null;
        const existingCategory = categories.find(c => 
          c.name.toLowerCase() === parentCategory.name.toLowerCase()
        );
        
        if (existingCategory) {
          parentCategoryId = existingCategory.id;
        } else {
          parentCategoryId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          categories.push({
            id: parentCategoryId,
            name: parentCategory.name,
            level: 0, // This is a parent category
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
              category.noteCount = (category.noteCount || 0) + 1;
            }
          }
        }
        
        // Save updated categories
        writeCategoriesData({ categories, noteCategoryMap, hierarchy });
        
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

module.exports = {
  categorizeNote,
  getNoteCategories,
  getAllCategories,
  getCategoryHierarchy,
  getNotesByCategory,
  rebuildAllCategories,
  updateCategoriesFromConnection
};