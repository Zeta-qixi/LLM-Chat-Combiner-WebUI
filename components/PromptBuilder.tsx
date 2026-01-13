
import React, { useState } from 'react';
import { Module, ModelPart, ModelPartType, HistoryConfig } from '../types';

interface BuilderProps {
  activeModules: Module[];
  availableModules: Module[];
  activeModelParts: Record<ModelPartType, string | null>;
  modelPartsLibrary: ModelPart[];
  engineParams: { 
    temperature: number; 
    maxOutputTokens: number; 
    topP?: number; 
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  };
  onUpdateParams: (p: any) => void;
  historyStrategy: HistoryConfig;
  onUpdateHistory: (h: HistoryConfig) => void;
  slotValues: Record<string, any>;
  onUpdateSlot: (ownerId: string, name: string, val: any) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveModule: (id: string) => void;
  onRemoveModelPart: (type: ModelPartType) => void;
  onMoveModule: (idx: number, dir: 'left' | 'right') => void;
}

const PromptBuilder: React.FC<BuilderProps> = ({ 
  activeModules, availableModules, activeModelParts, modelPartsLibrary, 
  engineParams, onUpdateParams, historyStrategy, onUpdateHistory,
  slotValues, onUpdateSlot, onDrop, onRemoveModule, onRemoveModelPart, onMoveModule 
}) => {
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const getSlots = (text: string) => text.match(/{{(.*?)}}/g)?.map(m => m.slice(2, -2)) || [];

  const renderModelSlot = (type: ModelPartType, label: string, icon: string, color: string) => {
    const partId = activeModelParts[type];
    const part = modelPartsLibrary.find(p => p.id === partId);
    
    return (
      <div className={`flex-1 glass p-3 rounded-2xl border-2 border-dashed transition-all flex items-center gap-3 min-w-[150px]
        ${part ? 'bg-slate-900 border-emerald-500/50 shadow-[0_0_10px_-5px_rgba(16,185,129,0.3)]' : 'bg-slate-900/40 border-slate-800'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-950 ${color}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{label}</div>
          <div className="text-[10px] font-bold text-slate-200 truncate">{part ? part.name : '拖入库项...'}</div>
        </div>
        {part && (
          <button onClick={() => onRemoveModelPart(type)} className="text-slate-600 hover:text-red-400 p-1">
            <i className="fas fa-times-circle text-[10px]"></i>
          </button>
        )}
      </div>
    );
  };

  const renderSlider = (label: string, value: number | undefined, min: number, max: number, step: number, field: string) => (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[8px] font-bold text-slate-500 uppercase">{label}</label>
        <span className="text-[9px] font-mono text-indigo-400">{value?.toFixed(field.includes('Penalty') ? 2 : (step < 1 ? 2 : 0))}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} 
        value={value ?? 0} 
        onChange={e => onUpdateParams({...engineParams, [field]: parseFloat(e.target.value)})}
        className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div onDragOver={e => e.preventDefault()} onDrop={onDrop} className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">引擎配置 (Engine Configuration)</label>
          <button 
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${showConfigPanel ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'text-slate-500 border-slate-800 hover:border-slate-600'}`}
          >
            <i className={`fas ${showConfigPanel ? 'fa-chevron-up' : 'fa-sliders-h'} mr-2`}></i> 微调参数
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {renderModelSlot(ModelPartType.TOKEN, 'API Key', 'fa-key', 'text-amber-500')}
          {renderModelSlot(ModelPartType.MODEL_NAME, 'Engine / Model', 'fa-microchip', 'text-emerald-500')}
          {renderModelSlot(ModelPartType.URL, 'Base URL', 'fa-link', 'text-blue-500')}
        </div>

        {showConfigPanel && (
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-indigo-500/20 animate-in fade-in slide-in-from-top-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Core Sampling */}
              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800 pb-1">核心采样 (Sampling)</h5>
                {renderSlider('Temperature', engineParams.temperature, 0, 2, 0.1, 'temperature')}
                {renderSlider('Top P', engineParams.topP, 0, 1, 0.01, 'topP')}
                {renderSlider('Top K', engineParams.topK, 1, 100, 1, 'topK')}
              </div>

              {/* Penalty & Length */}
              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800 pb-1">惩罚与长度 (Penalties)</h5>
                {renderSlider('Presence Penalty', engineParams.presencePenalty, -2, 2, 0.01, 'presencePenalty')}
                {renderSlider('Frequency Penalty', engineParams.frequencyPenalty, -2, 2, 0.01, 'frequencyPenalty')}
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">Max Output Tokens</label>
                  <input 
                    type="number" 
                    value={engineParams.maxOutputTokens}
                    onChange={e => onUpdateParams({...engineParams, maxOutputTokens: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-indigo-300 font-mono focus:border-indigo-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Context & History */}
              <div className="space-y-4">
                <h5 className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800 pb-1">上下文策略 (Context)</h5>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">历史消息数量 (History Count)</label>
                  <input 
                    type="number" 
                    value={historyStrategy.maxCount}
                    onChange={e => onUpdateHistory({...historyStrategy, maxCount: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-rose-400 font-mono focus:border-rose-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-500 uppercase">时间窗口 (Time Window, Min)</label>
                  <input 
                    type="number" 
                    value={historyStrategy.timeWindowMinutes}
                    onChange={e => onUpdateHistory({...historyStrategy, timeWindowMinutes: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-rose-400 font-mono focus:border-rose-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                            <button onClick={() => onUpdateSlot(m.id, s, '')} title="Text Input" className={`px-1 rounded ${!isLink ? 'bg-slate-800 text-white' : ''}`}>T</button>
                            <button onClick={() => onUpdateSlot(m.id, s, {moduleId: ''})} title="Module Link" className={`px-1 rounded ${isLink ? 'bg-blue-600 text-white' : ''}`}>M</button>
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
