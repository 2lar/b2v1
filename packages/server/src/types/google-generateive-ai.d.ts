declare module '@google/generative-ai' {
    export enum HarmCategory {
      HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT'
    }
  
    export enum HarmBlockThreshold {
      BLOCK_NONE = 'BLOCK_NONE',
      BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
      BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
      BLOCK_HIGH_AND_ABOVE = 'BLOCK_HIGH_AND_ABOVE',
      BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH'
    }
  
    export interface GenerationConfig {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
      topK?: number;
    }
  
    export interface SafetySetting {
      category: HarmCategory;
      threshold: HarmBlockThreshold;
    }
  
    export interface GenerateContentRequest {
      contents: Array<{
        role: string;
        parts: Array<{
          text: string;
        }>;
      }>;
      generationConfig?: GenerationConfig;
      safetySettings?: SafetySetting[];
    }
  
    export interface GenerateContentResponse {
      response: {
        text: () => string;
      };
    }
  
    export interface GenerativeModel {
      generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;
    }
  
    export class GoogleGenerativeAI {
      constructor(apiKey: string);
      getGenerativeModel(options: { model: string }): GenerativeModel;
    }
  }