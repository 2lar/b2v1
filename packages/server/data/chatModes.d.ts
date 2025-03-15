import { ChatMode } from '../../shared';
/**
 * Predefined chat modes/personas for the AI
 */
export declare const defaultChatModes: ChatMode[];
/**
 * Get all available chat modes
 */
export declare function getAllChatModes(): ChatMode[];
/**
 * Get a specific chat mode by ID
 */
export declare function getChatModeById(id: string): ChatMode | undefined;
/**
 * Get the default chat mode
 */
export declare function getDefaultChatMode(): ChatMode;
