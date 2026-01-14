
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Module, ModelPart, ModelPartType, ChatMessage, WorkspaceConfig, HistoryConfig } from './types';
import Sidebar from './components/Sidebar';
import PromptBuilder from './components/PromptBuilder';
import ChatWindow from './components/ChatWindow';
import { db } from './services/api';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [configs, setConfigs] = useState<WorkspaceConfig[]>([]);
  
  // Workspace State
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [activeModuleIds, setActiveModuleIds] = useState<string[]>([]);
  const [activeModelParts, setActiveModelParts] = useState<Record<ModelPartType, string | null>>({
    [ModelPartType.TOKEN]: null,
    [ModelPartType.URL]: null,
    [ModelPartType.MODEL_NAME]: null,
  });
  
  const [engineParams, setEngineParams] = useState({
    temperature: 0.7,
    maxOutputTokens: 2048,
    topP: 0.95,
    topK: 40,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0
  });

  const [historyStrategy, setHistoryStrategy] = useState<HistoryConfig>({
    maxCount: 10,
    timeWindowMinutes: 0
  });

  const [slotValues, setSlotValues] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  
  useEffect(() => {
    const init = async () => {
      const [m, p, c] = await Promise.all([db.modules.list(), db.parts.list(), db.workspaceConfigs.list()]);
      setModules(m);
      setModelParts(p);
      setConfigs(c);
      setWorkspaceName(`Workspace #${c.length + 1}`);
      setIsLoading(false);
    };
    init();
  }, []);

  const onSaveModule = async (module: Module) => {
    const result = await db.modules.save(module);
    if (result.id) {
      const updated = await db.modules.list();
      setModules(updated);
    }
  };

  const onDeleteModule = async (id: string) => {
    await db.modules.delete(id);
    const updated = await db.modules.list();
    setModules(updated);
    if (activeModuleIds.includes(id)) {
      setActiveModuleIds(prev => prev.filter(mid => mid !== id));
    }
  };

  const onSavePart = async (part: ModelPart) => {
    const result = await db.parts.save(part);
    if (result.id) {
      const updated = await db.parts.list();
      setModelParts(updated);
    }
  };

  const onDeletePart = async (id: string) => {
    await db.parts.delete(id);
    const updated = await db.parts.list();
    setModelParts(updated);
    // Remove from active if deleted
    Object.entries(activeModelParts).forEach(([type, activeId]) => {
      if (activeId === id) {
        setActiveModelParts(prev => ({ ...prev, [type]: null }));
      }
    });
  };

  const handleSaveWorkspace = async (isNew: boolean = false) => {
    setSaveStatus('saving');
    const id = (isNew || !currentConfigId) ? 'cfg_' + Date.now() : currentConfigId;
    const finalName = workspaceName || `Workspace #${configs.length + 1}`;
    
    const newConfig: WorkspaceConfig = {
      id,
      name: finalName,
      activeModuleIds,
      activeModelParts,
      engineParams,
      historyStrategy,
      slotValues,
      updatedAt: Date.now()
    };
    
    await db.workspaceConfigs.save(newConfig);
    const updatedConfigs = await db.workspaceConfigs.list();
    setConfigs(updatedConfigs);
    setCurrentConfigId(id);
    setWorkspaceName(finalName);
    
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };



  const loadConfig = (config: WorkspaceConfig) => {
    setCurrentConfigId(config.id);
    setWorkspaceName(config.name);
    setActiveModuleIds(config.activeModuleIds);
    setActiveModelParts(config.activeModelParts);
    // Fixed: spread defaults to ensure optional WorkspaceConfig properties don't cause type mismatch with required state properties
    setEngineParams({ 
      temperature: 0.7, 
      maxOutputTokens: 2048, 
      topP: 0.95, 
      topK: 40,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      ...(config.engineParams || {})
    });
    setHistoryStrategy(config.historyStrategy || { maxCount: 10, timeWindowMinutes: 0 });
    setSlotValues(config.slotValues);
    setIsConfigModalOpen(false);
  };

  const deleteConfig = async (id: string) => {
    await db.workspaceConfigs.delete(id);
    setConfigs(await db.workspaceConfigs.list());
    if (currentConfigId === id) setCurrentConfigId(null);
  };

  const handleReset = () => {
    setWorkspaceName(`Workspace #${configs.length + 1}`);
    setActiveModuleIds([]);
    setSlotValues({});
    setCurrentConfigId(null);
    setChatMessages([]);
    setEngineParams({ 
      temperature: 0.7, 
      maxOutputTokens: 2048, 
      topP: 0.95, 
      topK: 40,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0
    });
    setHistoryStrategy({ maxCount: 10, timeWindowMinutes: 0 });
  };

  const onDragStart = (e: React.DragEvent, id: string, type: 'module' | 'modelPart') => {
    e.dataTransfer.setData('itemId', id);
    e.dataTransfer.setData('itemType', type);
  };

  const onDropToBuilder = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData('itemId');
    const type = e.dataTransfer.getData('itemType');
    if (type === 'module' && id && !activeModuleIds.includes(id)) {
      setActiveModuleIds(prev => [...prev, id]);
    } else if (type === 'modelPart') {
      const part = modelParts.find(p => p.id === id);
      if (part) setActiveModelParts(prev => ({ ...prev, [part.type]: id }));
    }
  };

  const resolveContent = useCallback((module: Module, visitedIds: Set<string> = new Set()): string => {
    if (visitedIds.has(module.id)) return "[Loop Error]";
    const newVisited = new Set(visitedIds);
    newVisited.add(module.id);
    let text = module.content;
    const matches = text.match(/{{(.*?)}}/g);
    if (matches) {
      matches.forEach(match => {
        const slotName = match.slice(2, -2);
        const slotKey = `${module.id}_${slotName}`;
        const slotEntry = slotValues[slotKey];
        let replacement = match;
        if (slotEntry?.moduleId) {
          const linkedModule = modules.find(m => m.id === slotEntry.moduleId);
          if (linkedModule) replacement = resolveContent(linkedModule, newVisited);
        } else if (typeof slotEntry === 'string' && slotEntry.trim() !== '') {
          replacement = slotEntry;
        }
        text = text.replace(match, replacement);
      });
    }
    return text;
  }, [modules, slotValues]);

  const activeModules = useMemo(() => 
    activeModuleIds.map(id => modules.find(m => m.id === id)).filter(Boolean) as Module[]
  , [activeModuleIds, modules]);

  const resolvedSystemPrompt = useMemo(() => 
    activeModules.map(m => resolveContent(m)).join('\n\n')
  , [activeModules, resolveContent]);

  const activeModel = useMemo(() => {
    const part = modelParts.find(p => p.id === activeModelParts[ModelPartType.MODEL_NAME]);
    return part?.value || 'gemini-3-flash-latest';
  }, [modelParts, activeModelParts]);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim() || isProcessing) return;
    setIsProcessing(true);
    const newUserMsg: ChatMessage = { role: 'user', content: userInput, timestamp: Date.now() };
    const currentHistory = [...chatMessages, newUserMsg];
    setChatMessages(currentHistory);

    const requestData = { 
      token: modelParts.find(p => p.id === activeModelParts[ModelPartType.TOKEN])?.value || '',
      url: modelParts.find(p => p.id === activeModelParts[ModelPartType.URL])?.value || '',
      model: activeModel,
      params: engineParams,
      history: historyStrategy,
      system: resolvedSystemPrompt,
      historyMessagesIncluded: Math.min(chatMessages.length, historyStrategy.maxCount)
    };

    try {
      const response = {'text': 'This is a placeholder response from the AI model.'}; // Placeholder response
      console.log(configs, currentConfigId);
      // const response = await ai.models.generateContent({
      //   model: activeModel,
      //   contents: contents as any,
      //   config: { 
      //     systemInstruction: resolvedSystemPrompt || undefined, 
      //     ...engineParams 
      //   }
      // });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Empty response', timestamp: Date.now() }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}`, timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-blue-500 gap-4">
        <i className="fas fa-circle-notch animate-spin text-3xl"></i>
        <span className="text-[10px] font-bold uppercase tracking-widest">Loading Repository...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-6 border-b border-slate-800 bg-slate-900/80">
          <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <i className="fas fa-microchip"></i> NexusLLM
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase">Unified Orchestration Studio</p>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <Sidebar 
            modules={modules} 
            modelParts={modelParts}
            onDragStart={onDragStart} 
            onSaveModule={onSaveModule}
            onDeleteModule={onDeleteModule}
            onSavePart={onSavePart}
            onDeletePart={onDeletePart}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-950 p-6 space-y-6 overflow-y-auto scrollbar-hide">
        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
              <i className="fas fa-edit text-blue-400"></i>
            </div>
            <div className="flex-1 max-w-md">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">配置名称 (Config Identity)</label>
              <input 
                type="text" 
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
                placeholder="输入配置名称..."
                className="bg-transparent text-slate-100 font-bold text-lg outline-none w-full border-b border-transparent focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="text-[10px] font-bold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2"
            >
              <i className="fas fa-folder-open"></i> 配置库
            </button>
            <button 
              onClick={() => handleSaveWorkspace(false)}
              disabled={saveStatus !== 'idle'}
              className={`text-[10px] font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                saveStatus === 'success' ? 'bg-emerald-600 text-white' : 
                saveStatus === 'saving' ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              {saveStatus === 'success' ? <><i className="fas fa-check"></i> 已保存</> : 
               saveStatus === 'saving' ? <><i className="fas fa-circle-notch animate-spin"></i> 保存中</> : 
               <><i className="fas fa-save"></i> {currentConfigId ? '更新配置' : '保存配置'}</>}
            </button>
            <button 
              onClick={handleReset}
              className="text-[10px] font-bold text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg"
            >
              重置
            </button>
          </div>
        </div>
        
        <PromptBuilder 
          activeModules={activeModules}
          availableModules={modules}
          activeModelParts={activeModelParts}
          modelPartsLibrary={modelParts}
          engineParams={engineParams}
          onUpdateParams={setEngineParams}
          historyStrategy={historyStrategy}
          onUpdateHistory={setHistoryStrategy}
          slotValues={slotValues}
          onUpdateSlot={(ownerId, name, val) => setSlotValues(v => ({ ...v, [`${ownerId}_${name}`]: val }))}
          onDrop={onDropToBuilder}
          onRemoveModule={(id) => setActiveModuleIds(ids => ids.filter(i => i !== id))}
          onRemoveModelPart={(type) => setActiveModelParts(prev => ({ ...prev, [type]: null }))}
          onMoveModule={(idx, dir) => {
            const n = [...activeModuleIds];
            const t = dir === 'left' ? idx - 1 : idx + 1;
            if (t >= 0 && t < n.length) [n[idx], n[t]] = [n[t], n[idx]];
            setActiveModuleIds(n);
          }}
        />

        <div className="mt-auto glass rounded-2xl overflow-hidden border-blue-500/20 shadow-2xl">
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">最终生成请求预览 (Request Preview)</span>
          </div>
          <div className="p-4 max-h-[250px] overflow-y-auto font-mono text-[11px] text-emerald-400/90 bg-slate-950">
            <pre>{JSON.stringify({ 
              token: modelParts.find(p => p.id === activeModelParts[ModelPartType.TOKEN])?.value || '',
              url: modelParts.find(p => p.id === activeModelParts[ModelPartType.URL])?.value || '',
              model: activeModel,
              params: engineParams,
              history: historyStrategy,
              system: resolvedSystemPrompt,
              historyMessagesIncluded: Math.min(chatMessages.length, historyStrategy.maxCount)
            }, null, 2)}</pre>
          </div>
        </div>
      </div>

      <div className="w-[400px] flex-shrink-0 border-l border-slate-800 bg-slate-900/30">
        <ChatWindow 
          messages={chatMessages} 
          onSend={handleSendMessage} 
          isProcessing={isProcessing}
          ready={!!activeModel && activeModelParts[ModelPartType.TOKEN] !== null}
        />
      </div>

      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 space-y-4 border-slate-700">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-folder-tree text-emerald-400"></i> 工作台配置库
              </h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {configs.length === 0 && <p className="text-center text-xs text-slate-600 py-10">暂无保存的配置</p>}
              {configs.map(c => (
                <div key={c.id} className={`bg-slate-900/80 border p-3 rounded-xl flex justify-between items-center group transition-all ${currentConfigId === c.id ? 'border-emerald-500/50' : 'border-slate-800 hover:border-emerald-500/30'}`}>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      {c.name}
                      {currentConfigId === c.id && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded uppercase">Current</span>}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                      模块: {c.activeModuleIds.length} | 最后更新: {new Date(c.updatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadConfig(c)} className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-500">加载</button>
                    <button onClick={() => deleteConfig(c.id)} className="px-2 py-1 text-slate-500 hover:text-red-400"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
