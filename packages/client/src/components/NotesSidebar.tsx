import React, { useState, useEffect } from 'react';
import { Category } from '@b2/shared';
import { categoryApi } from '../services/api';
import { FaFolder, FaFolderOpen, FaChevronRight, FaChevronDown, FaPlus } from 'react-icons/fa';
import './NotesSidebar.css';

interface NotesSidebarProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategoryId?: string;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
  isOpen: boolean;
}

const NotesSidebar: React.FC<NotesSidebarProps> = ({ 
  onCategorySelect,
  selectedCategoryId 
}) => {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { categories, hierarchy } = await categoryApi.getCategoryHierarchy();
      
      // Build tree structure
      const rootCategories = categories
        .filter(cat => cat.level === 0)
        .map(cat => buildCategoryTree(cat, categories, hierarchy));
      
      setCategories(rootCategories);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryTree = (
    category: Category, 
    allCategories: Category[], 
    hierarchy: Record<string, string[]>
  ): CategoryNode => {
    const childIds = hierarchy[category.id] || [];
    const childCategories = childIds
      .map(id => allCategories.find(cat => cat.id === id))
      .filter(cat => cat !== undefined)
      .map(cat => buildCategoryTree(cat!, allCategories, hierarchy));
    
    return {
      ...category,
      children: childCategories,
      isOpen: false
    };
  };

  const toggleCategory = (categoryId: string) => {
    const updateCategoryState = (categories: CategoryNode[]): CategoryNode[] => {
      return categories.map(category => {
        if (category.id === categoryId) {
          return {
            ...category,
            isOpen: !category.isOpen,
            children: updateCategoryState(category.children)
          };
        } else {
          return {
            ...category,
            children: updateCategoryState(category.children)
          };
        }
      });
    };
    
    setCategories(updateCategoryState(categories));
  };

  const handleCategoryClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  const renderCategoryItem = (category: CategoryNode) => {
    const isSelected = category.id === selectedCategoryId;
    
    return (
      <li key={category.id}>
        <div 
          className={`category-item ${isSelected ? 'selected' : ''}`}
          onClick={() => handleCategoryClick(category.id)}
        >
          <button 
            className="toggle-btn" 
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(category.id);
            }}
          >
            {category.children.length > 0 ? (
              category.isOpen ? <FaChevronDown /> : <FaChevronRight />
            ) : <span className="toggle-placeholder"></span>}
          </button>
          
          <span className="category-icon">
            {category.isOpen ? <FaFolderOpen /> : <FaFolder />}
          </span>
          
          <span className="category-name">
            {category.name}
          </span>
          
          <span className="category-count">{category.noteCount || 0}</span>
        </div>
        
        {category.isOpen && category.children.length > 0 && (
          <ul className="category-children">
            {category.children.map(child => renderCategoryItem(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="notes-sidebar">
      <div className="sidebar-header">
        <h3>Categories</h3>
        <button className="add-category-btn" title="Add Category">
          <FaPlus />
        </button>
      </div>
      
      {loading ? (
        <div className="sidebar-loading">Loading categories...</div>
      ) : error ? (
        <div className="sidebar-error">{error}</div>
      ) : categories.length === 0 ? (
        <div className="sidebar-empty">No categories found</div>
      ) : (
        <ul className="category-tree">
          {categories.map(category => renderCategoryItem(category))}
        </ul>
      )}
    </div>
  );
};

export default NotesSidebar;