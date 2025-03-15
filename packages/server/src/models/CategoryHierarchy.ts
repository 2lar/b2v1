import mongoose, { Schema, Document } from 'mongoose';

// Interface for category hierarchy relationships
export interface CategoryHierarchyDocument extends Document {
  parentId: string;
  childId: string;
}

// Schema definition
const CategoryHierarchySchema: Schema = new Schema(
  {
    parentId: {
      type: String,
      required: [true, 'Parent Category ID is required'],
      ref: 'Category',
    },
    childId: {
      type: String,
      required: [true, 'Child Category ID is required'],
      ref: 'Category',
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure uniqueness of the parent-child pair
CategoryHierarchySchema.index({ parentId: 1, childId: 1 }, { unique: true });

// Create and export the model
export default mongoose.model<CategoryHierarchyDocument>('CategoryHierarchy', CategoryHierarchySchema);