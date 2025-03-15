// packages/server/src/models/Note.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Note } from '@b2/shared';

// Interface for the Note document with Mongoose-specific fields
export interface NoteDocument extends Omit<Note, 'id'>, Document {
  // By using Omit<Note, 'id'>, we exclude the 'id' property from Note interface
  // The Document interface provides its own '_id' property
}

// Schema definition
const NoteSchema: Schema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Note content is required'],
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
    // Also apply the transform for toObject
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
export default mongoose.model<NoteDocument>('Note', NoteSchema);