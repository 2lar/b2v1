// packages/server/src/models/Category.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Category } from '@b2/shared';

// Interface for the Category document with Mongoose-specific fields
export interface CategoryDocument extends Omit<Category, 'id'>, Document {
  // Omit the 'id' property from Category interface to avoid conflict
}

// Schema definition
const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    level: {
      type: Number,
      default: 0,
    },
    noteCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    // Use this to convert MongoDB _id to id in response
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create and export the model
export default mongoose.model<CategoryDocument>('Category', CategorySchema);