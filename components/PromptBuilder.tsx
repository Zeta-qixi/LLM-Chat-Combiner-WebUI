
import React from 'react';
import { Module, ModuleType, ModelPart, ModelPartType } from '../types';

interface BuilderProps {
  activeModules: Module[];
  availableModules: Module[];
  activeModelParts: Record<ModelPartType, string | null>;
  modelPartsLibrary: ModelPart[];
  slotValues: Record<string, any>;
  onUpdateSlot: (ownerId: string, name: string, val: any) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveModule: (id: string) => void;
  onRemoveModelPart: (type: ModelPartType) => void;
  onMoveModule: (idx: number, dir: 'left' | 'right') => void;
}

const PromptBuilder: React.FC<BuilderProps> = ({ 
  activeModules, availableModules, activeModelParts, modelPartsLibrary, 
  slotValues, onUpdateSlot, onDrop, onRemoveModule, onRemoveModelPart, onMoveModule 
}) => {
  const getSlots = (text: string) => text.match(/{{(.*?)}}/g)?.map(m => m.slice(2, -2)) || [];

  const renderModelSlot = (type: ModelPartType, label: string, icon: string, color: string) => {
    const partId = activeModelParts[type];
    const part = modelPartsLibrary.find(p => p.id === partId);
    
    return (
      <div className={`flex-1 glass p-3 rounded-2xl border-2 border-dashed transition-all flex items-center gap-3 min-w-[150px]
        ${part ? 'bg-slate-900 border-emerald-500/50' : 'bg-slate-900/40 border-slate-800'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950 ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{label}</div>
          <div className="text-[10px] font-bold text-slate-200 truncate">{part ? part.name : '等待拖入...'}</div>
        </div>
        {part && (
          <button onClick={() => onRemoveModelPart(type)} className="text-slate-600 hover:text-red-400 p-1">
            <i className="fas fa-times-circle text-[10px]"></i>
          </button>
        )}
      </div>
    );
  };

  return (
    <div onDragOver={e => e.preventDefault()} onDrop={onDrop} className="space-y-6">
      {/* Engine Orchestrator Slot Bar */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">引擎配置引擎 (Engine Config)</label>
        <div className="flex flex-wrap gap-3">
          {renderModelSlot(ModelPartType.TOKEN, 'API Key', 'fa-key', 'text-amber-500')}
          {renderModelSlot(ModelPartType.MODEL_NAME, 'Engine', 'fa-microchip', 'text-emerald-500')}
          {renderModelSlot(ModelPartType.CONFIG, 'Hyperparams', 'fa-sliders', 'text-indigo-500')}
          {renderModelSlot(ModelPartType.URL, 'Endpoint', 'fa-link', 'text-blue-500')}
        </div>
      </div>

      {/* Pipeline Zone */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">提示词管道 (Prompt Pipeline)</label>
        <div className={`min-h-[300px] border-2 border-dashed border-slate-800/50 rounded-3xl p-6 flex flex-wrap content-start gap-4 bg-slate-900/20
          ${activeModules.length === 0 ? 'items-center justify-center' : ''}`}>
          
          {activeModules.length === 0 && (
            <div className="text-center opacity-30 pointer-events-none">
              <i className="fas fa-stream text-4xl mb-3"></i>
              <p className="text-xs">拖拽提示词模块至此形成流</p>
            </div>
          )}

          {activeModules.map((m, idx) => {
            const slots = getSlots(m.content);
            const isInvalid = slots.some(s => !slotValues[`${m.id}_${s}`]);

            return (
              <div key={m.id} className={`glass p-4 rounded-2xl border-l-4 w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.7rem)] relative border-slate-600 transition-all ${isInvalid ? 'ring-1 ring-amber-500/30 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500">#{idx+1}</span>
                    {m.name}
                  </h4>
                  <div className="flex gap-1">
                    <button onClick={() => onMoveModule(idx, 'left')} className="p-1 hover:text-blue-400 text-slate-600"><i className="fas fa-chevron-left text-[9px]"></i></button>
                    <button onClick={() => onRemoveModule(m.id)} className="p-1 hover:text-red-400 text-slate-600"><i className="fas fa-trash text-[9px]"></i></button>
                  </div>
                </div>

                {isInvalid && <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[8px] font-bold px-1 py-0.5 rounded animate-pulse">待填充</div>}

                <div className="space-y-3 mt-4 border-t border-slate-800/50 pt-3">
                  {slots.map(s => {
                    const key = `${m.id}_${s}`;
                    const val = slotValues[key];
                    const isLink = val && typeof val === 'object';
                    
                    return (
                      <div key={s} className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold">
                          <span>{s}</span>
                          <div className="flex gap-1 bg-slate-950 p-0.5 rounded">
                            <button onClick={() => onUpdateSlot(m.id, s, '')} className={`px-1 rounded ${!isLink ? 'bg-slate-800 text-white' : ''}`}>T</button>
                            <button onClick={() => onUpdateSlot(m.id, s, {moduleId: ''})} className={`px-1 rounded ${isLink ? 'bg-blue-600 text-white' : ''}`}>M</button>
                          </div>
                        </div>
                        {isLink ? (
                          <select 
                            className="w-full bg-slate-950 border border-blue-500/20 rounded p-1 text-[10px] text-blue-300 outline-none"
                            value={val.moduleId || ''}
                            onChange={e => onUpdateSlot(m.id, s, {moduleId: e.target.value})}
                          >
                            <option value="">链接模块...</option>
                            {availableModules.map(avail => <option key={avail.id} value={avail.id}>{avail.name}</option>)}
                          </select>
                        ) : (
                          <input 
                            type="text" className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-slate-200"
                            placeholder="输入值..." value={val || ''}
                            onChange={e => onUpdateSlot(m.id, s, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PromptBuilder;
