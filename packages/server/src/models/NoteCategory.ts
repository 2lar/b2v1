import mongoose, { Schema, Document } from 'mongoose';

// Interface for the mapping between notes and categories
export interface NoteCategoryDocument extends Document {
  noteId: string;
  categoryId: string;
}

// Schema definition
const NoteCategorySchema: Schema = new Schema(
  {
    noteId: {
      type: String,
      required: [true, 'Note ID is required'],
      ref: 'Note',
    },
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      ref: 'Category',
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure uniqueness of the note-category pair
NoteCategorySchema.index({ noteId: 1, categoryId: 1 }, { unique: true });

// Create and export the model
export default mongoose.model<NoteCategoryDocument>('NoteCategory', NoteCategorySchema);