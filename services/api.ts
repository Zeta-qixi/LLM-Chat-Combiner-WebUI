
import { Module, ModelPart, WorkspaceConfig, ModuleType, ModelPartType } from '../types';

const API_BASE = "/api";

// Generic HTTP request function
async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const err = text ? JSON.parse(text) : {};
      throw new Error(err.error || "API Error");
    } catch {
      throw new Error("API Error");
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}


export const openai_api = {
  chat: async (data) => {
    return http("/api/chat", {
      method: "POST",
      body: data,
    });
  }
};

export const db = {
  modules: {
    list: async (): Promise<Module[]> => {
      return http("/api/modules");
    },
    save: async (module: Module) => {
      return http("/api/modules", {
        method: "POST",
        body: JSON.stringify(module),
      });
    },
    delete: async (id: string) => {
      await  http(`/api/modules/${id}`, {
        method: "DELETE",
      });
    }
  },

  parts: {
    list: async (): Promise<ModelPart[]> => {
      return http("/api/parts");
    },
    save: async (part: ModelPart) => {
      return http("/api/parts", {
        method: "POST",
        body: JSON.stringify(part),
      });
    },
    delete: async (id: string) => {
      await http(`/api/parts/${id}`, {
        method: "DELETE",
      });
    }
  },

  workspaceConfigs: {
    list: async (): Promise<WorkspaceConfig[]> => {
      return http("/api/workspaces");
    },

    save: async (config: WorkspaceConfig) => {
      return http("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(config),
      });
    },

    delete: async (id: string) => {
      return http(`/api/workspaces/${id}`, {
        method: "DELETE",
      });
    },
  },
};
