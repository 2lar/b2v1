import express from 'express';
import * as categoryService from '../services/categoryService';

export const categoryRouter = express.Router();

// Get all categories
categoryRouter.get('/', (req, res) => {
  try {
    const categories = categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// Get category hierarchy
categoryRouter.get('/hierarchy', (req, res) => {
  try {
    const hierarchy = categoryService.getCategoryHierarchy();
    res.json(hierarchy);
  } catch (error) {
    console.error('Error retrieving category hierarchy:', error);
    res.status(500).json({ error: 'Failed to retrieve category hierarchy' });
  }
});

// Get notes by category
categoryRouter.get('/:categoryId/notes', (req, res) => {
  try {
    const notes = categoryService.getNotesByCategory(req.params.categoryId);
    res.json(notes);
  } catch (error) {
    console.error('Error retrieving notes by category:', error);
    res.status(500).json({ error: 'Failed to retrieve notes by category' });
  }
});

// Get categories for a note
categoryRouter.get('/note/:noteId', (req, res) => {
  try {
    const categories = categoryService.getNoteCategories(req.params.noteId);
    res.json(categories);
  } catch (error) {
    console.error('Error retrieving note categories:', error);
    res.status(500).json({ error: 'Failed to retrieve note categories' });
  }
});

// Rebuild all categories
categoryRouter.post('/rebuild', async (req, res) => {
  try {
    const results = await categoryService.rebuildAllCategories();
    res.json({
      message: 'Categories rebuilt successfully',
      notesProcessed: results.length,
      results
    });
  } catch (error) {
    console.error('Error rebuilding categories:', error);
    res.status(500).json({ error: 'Failed to rebuild categories' });
  }
});