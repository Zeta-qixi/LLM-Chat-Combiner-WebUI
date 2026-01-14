
import React, { useState } from 'react';
import { Module, ModuleType, ModelPart, ModelPartType } from '../types';

interface SidebarProps {
  modules: Module[];
  modelParts: ModelPart[];
  onDragStart: (e: React.DragEvent, id: string, type: 'module' | 'modelPart') => void;
  onSaveModule: (m: Module) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onSavePart: (p: ModelPart) => Promise<void>;
  onDeletePart: (id: string) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  modules, modelParts, onDragStart, 
  onSaveModule, onDeleteModule, 
  onSavePart, onDeletePart 
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'model'>('prompt');
  
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null);
  const [editingPart, setEditingPart] = useState<Partial<ModelPart> | null>(null);

  const modelPartConfig = [
    { type: ModelPartType.TOKEN, label: '密钥 (Token)', icon: 'fa-key', color: 'text-amber-400' },
    { type: ModelPartType.MODEL_NAME, label: '模型 (Model)', icon: 'fa-microchip', color: 'text-emerald-400' },
    { type: ModelPartType.URL, label: '端点 (URL)', icon: 'fa-link', color: 'text-blue-400' },
  ];

  const moduleCategories = [
    { type: ModuleType.ROLE, label: '人设', icon: 'fa-user-astronaut' },
    { type: ModuleType.TASK, label: '任务', icon: 'fa-list-check' },
    { type: ModuleType.SCENE, label: '场景', icon: 'fa-mountain-sun' },
    { type: ModuleType.TEMPLATE, label: '模板', icon: 'fa-layer-group' },
    { type: ModuleType.CUSTOM, label: '通用', icon: 'fa-puzzle-piece' },
  ];

  const handleSaveModule = async () => {
    if (!editingModule?.name || !editingModule?.content) return;
    const finalModule = editingModule.id 
      ? editingModule as Module 
      : { ...editingModule, id: 'mod_' + Date.now() } as Module;
    
    await onSaveModule(finalModule);
    setIsModuleModalOpen(false);
  };

  const handleSavePart = async () => {
    if (!editingPart?.name) return;
    const finalPart = editingPart.id 
      ? editingPart as ModelPart 
      : { ...editingPart, id: 'part_' + Date.now() } as ModelPart;
    
    await onSavePart(finalPart);
    setIsPartModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex bg-slate-900/80 p-1 m-4 rounded-xl border border-slate-800">
        <button 
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'prompt' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500'}`}
        >提示词库</button>
        <button 
          onClick={() => setActiveTab('model')}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${activeTab === 'model' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500'}`}
        >模型库</button>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {activeTab === 'prompt' ? (
          <div className="space-y-4">
            {moduleCategories.map(cat => (
              <div key={cat.type} className="space-y-2">
                <div className="flex justify-between items-center px-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><i className={`fas ${cat.icon}`}></i> {cat.label}</span>
                  <button onClick={() => { setEditingModule({ type: cat.type as ModuleType, name: '', content: '' }); setIsModuleModalOpen(true); }} className="text-blue-500 hover:text-blue-400"><i className="fas fa-plus"></i></button>
                </div>
                <div className="space-y-1.5">
                  {modules.filter(m => m.type === cat.type).map(m => (
                    <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id, 'module')} onClick={() => { setEditingModule(m); setIsModuleModalOpen(true); }} className="bg-slate-800/30 border border-slate-700/50 p-2 rounded-xl cursor-grab hover:border-blue-500/30 group relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-200">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onDeleteModule(m.id); }} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash text-[10px]"></i></button>
                          <i className="fas fa-grip-vertical text-[10px] text-slate-700 opacity-0 group-hover:opacity-100"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {modelPartConfig.map(cat => (
              <div key={cat.type} className="space-y-2">
                <div className="flex justify-between items-center px-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className={`flex items-center gap-2 ${cat.color}`}><i className={`fas ${cat.icon}`}></i> {cat.label}</span>
                  <button onClick={() => { setEditingPart({ type: cat.type, name: '', value: '' }); setIsPartModalOpen(true); }} className="text-emerald-500 hover:text-emerald-400"><i className="fas fa-plus"></i></button>
                </div>
                <div className="space-y-1.5">
                  {modelParts.filter(p => p.type === cat.type).map(p => (
                    <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p.id, 'modelPart')} onClick={() => { setEditingPart(p); setIsPartModalOpen(true); }} className="bg-slate-800/30 border border-slate-700/50 p-2 rounded-xl cursor-grab hover:border-emerald-500/30 flex justify-between items-center group">
                      <span className="text-xs font-medium text-slate-200">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onDeletePart(p.id); }} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash text-[10px]"></i></button>
                        <i className="fas fa-grip-vertical text-[10px] text-slate-700 opacity-0 group-hover:opacity-100"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModuleModalOpen && editingModule && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 space-y-4 border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2"><i className="fas fa-puzzle-piece text-blue-400"></i>编辑模块</h3>
            <div className="space-y-3">
              <input type="text" value={editingModule.name} onChange={e => setEditingModule({...editingModule, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none" placeholder="模块名称"/>
              <textarea value={editingModule.content} onChange={e => setEditingModule({...editingModule, content: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 h-32 resize-none outline-none" placeholder="Prompt 内容..."/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsModuleModalOpen(false)} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">取消</button>
              <button onClick={handleSaveModule} className="px-4 py-2 text-[10px] font-bold bg-blue-600 rounded-lg hover:bg-blue-500 uppercase">保存</button>
            </div>
          </div>
        </div>
      )}

      {isPartModalOpen && editingPart && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl p-6 space-y-4 border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2"><i className="fas fa-microchip text-emerald-400"></i>配置部件</h3>
            <div className="space-y-4">
              <input type="text" value={editingPart.name} onChange={e => setEditingPart({...editingPart, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none" placeholder="部件名称"/>
              <input type="text" value={editingPart.value} onChange={e => setEditingPart({...editingPart, value: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none" placeholder="输入值 (Token / Model Name / URL)"/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsPartModalOpen(false)} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">取消</button>
              <button onClick={handleSavePart} className="px-4 py-2 text-[10px] font-bold bg-emerald-600 rounded-lg hover:bg-emerald-500 uppercase">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
