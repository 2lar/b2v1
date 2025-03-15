// packages/server/src/models/LlmConfig.ts
import mongoose, { Schema, Document } from 'mongoose';
import { LlmConfig } from '@b2/shared';

// Interface for the LLM configuration with Mongoose-specific fields
// We need to use a different approach for this model due to the model property conflict
export interface LlmConfigDocument extends Document {
  provider: 'none' | 'gemini' | 'local';
  geminiApiKey?: string;
  localLlmUrl?: string;
  localLlmModel?: string;
  modelName?: string; // Renamed from 'model' to avoid conflict
  selectedAgentId?: string;
  generationConfig?: {
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

// Schema for GenerationConfig sub-document
const GenerationConfigSchema = new Schema(
  {
    temperature: {
      type: Number,
      default: 0.7,
    },
    maxOutputTokens: {
      type: Number,
      default: 1000,
    },
    topP: {
      type: Number,
      default: 1,
    },
    topK: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

// Schema for SafetySetting sub-document
const SafetySettingSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
    },
    threshold: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Main LlmConfig schema
const LlmConfigSchema: Schema = new Schema(
  {
    // Use a fixed ID for the singleton config
    _id: {
      type: String,
      default: 'config',
    },
    provider: {
      type: String,
      enum: ['none', 'gemini', 'local'],
      default: 'gemini',
    },
    geminiApiKey: {
      type: String,
      default: '',
    },
    localLlmUrl: {
      type: String,
      default: 'http://localhost:11434/api/generate',
    },
    localLlmModel: {
      type: String,
      default: 'mistral',
    },
    modelName: { // Renamed from 'model' to avoid conflict
      type: String,
      default: 'gemini-2.0-flash',
    },
    selectedAgentId: {
      type: String,
      default: 'default',
    },
    generationConfig: {
      type: GenerationConfigSchema,
      default: () => ({}),
    },
    safetySettings: {
      type: [SafetySettingSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    // Custom id transformation
    toJSON: {
      transform: (_doc, ret) => {
        // Map modelName back to model for API compatibility
        ret.model = ret.modelName;
        delete ret.modelName;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        // Map modelName back to model for API compatibility
        ret.model = ret.modelName;
        delete ret.modelName;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create and export the model - using a different approach since this is a singleton
export default mongoose.model<LlmConfigDocument>('LlmConfig', LlmConfigSchema);