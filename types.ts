
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
  MODEL_NAME = 'MODEL_NAME',
  CONFIG = 'CONFIG'
}

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
  content: string;
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
  slotValues: Record<string, any>;
  updatedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
