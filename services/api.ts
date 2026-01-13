
import { Module, ModelPart, WorkspaceConfig, ModuleType, ModelPartType } from '../types';

const DEFAULT_MODULES: Module[] = [
  { id: 'p1', name: '资深专家', type: ModuleType.ROLE, content: '你是一位拥有20年经验的{{领域}}高级工程师。' },
  { id: 'p2', name: '总结达人', type: ModuleType.TASK, content: '请将以下文本总结为{{数量}}个要点。' },
];

const DEFAULT_PARTS: ModelPart[] = [
  { id: 'tk1', name: '默认密钥', type: ModelPartType.TOKEN, value: 'sk-...' },
  { id: 'mn1', name: 'Gemini 3 Flash', type: ModelPartType.MODEL_NAME, value: 'gemini-3-flash-latest' },
  { id: 'mn2', name: 'Gemini 3 Pro', type: ModelPartType.MODEL_NAME, value: 'gemini-3-pro-preview' },
];

const STORAGE_KEYS = {
  MODULES: 'llm_manager_modules',
  PARTS: 'llm_manager_parts',
  CONFIGS: 'llm_manager_workspace_configs'
};

const get = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const set = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const db = {
  modules: {
    list: async (): Promise<Module[]> => {
      await new Promise(r => setTimeout(r, 200));
      return get(STORAGE_KEYS.MODULES, DEFAULT_MODULES);
    },
    save: async (modules: Module[]) => set(STORAGE_KEYS.MODULES, modules),
  },
  parts: {
    list: async (): Promise<ModelPart[]> => {
      await new Promise(r => setTimeout(r, 200));
      return get(STORAGE_KEYS.PARTS, DEFAULT_PARTS);
    },
    save: async (parts: ModelPart[]) => set(STORAGE_KEYS.PARTS, parts),
  },
  workspaceConfigs: {
    list: async (): Promise<WorkspaceConfig[]> => {
      await new Promise(r => setTimeout(r, 300));
      return get(STORAGE_KEYS.CONFIGS, []);
    },
    save: async (config: WorkspaceConfig) => {
      const current = get<WorkspaceConfig[]>(STORAGE_KEYS.CONFIGS, []);
      const index = current.findIndex(c => c.id === config.id);
      if (index > -1) current[index] = config;
      else current.push(config);
      set(STORAGE_KEYS.CONFIGS, current);
    },
    delete: async (id: string) => {
      const current = get<WorkspaceConfig[]>(STORAGE_KEYS.CONFIGS, []);
      set(STORAGE_KEYS.CONFIGS, current.filter(c => c.id !== id));
    }
  }
};
