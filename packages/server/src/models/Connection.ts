// packages/server/src/models/Connection.ts
import mongoose, { Schema, Document } from 'mongoose';
import { Connection } from '@b2/shared';

// Interface for the Connection document with Mongoose-specific fields
export interface ConnectionDocument extends Omit<Connection, 'id'>, Document {
  // Omit the 'id' property from Connection interface to avoid conflict 
}

// Schema definition
const ConnectionSchema: Schema = new Schema(
  {
    sourceId: {
      type: String,
      required: [true, 'Source ID is required'],
      ref: 'Note',
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      ref: 'Note',
    },
    strength: {
      type: Number,
      required: [true, 'Connection strength is required'],
      min: 0,
      max: 1,
    },
    type: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic',
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
export default mongoose.model<ConnectionDocument>('Connection', ConnectionSchema);