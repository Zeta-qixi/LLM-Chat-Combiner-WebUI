
export enum ModuleType {
  ROLE = 'ROLE',
  TASK = 'TASK',
  SCENE = 'SCENE',
  TEMPLATE = 'TEMPLATE',
  FORMAT = 'FORMAT',
  CUSTOM = 'CUSTOM'
}

export enum ModelPartType {
  TOKEN = 'TOKEN',
  URL = 'URL',
  MODEL_NAME = 'MODEL_NAME'
}

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  content: string;
}

export interface HistoryConfig {
  maxCount: number;
  timeWindowMinutes: number;
}

export interface ModelPart {
  id: string;
  name: string;
  type: ModelPartType;
  value: any; 
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  activeModuleIds: string[];
  activeModelParts: Record<ModelPartType, string | null>;
  engineParams: {
    temperature: number;
    maxOutputTokens: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
  historyStrategy: HistoryConfig;
  slotValues: Record<string, any>;
  updatedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
