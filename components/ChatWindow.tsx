
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onClear: () => void;
  isProcessing: boolean;
  ready: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSend, onClear, isProcessing, ready }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing && ready) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/20">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center h-14">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <i className={`fas fa-circle text-[8px] ${ready ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`}></i>
            测试终端
          </h3>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${ready ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {ready ? 'READY' : 'OFFLINE'}
          </span>
        </div>
        <button 
          onClick={onClear}
          title="清空聊天记录"
          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 space-y-4">
            <i className="fas fa-terminal text-4xl"></i>
            <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting interaction</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed break-words whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-900/20' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 rounded-2xl px-4 py-3 flex items-center gap-2 border border-slate-700/30">
              <span className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:1s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        {!ready && (
          <div className="mb-3 text-[9px] text-red-400 flex items-center gap-2 font-bold uppercase tracking-tighter">
            <i className="fas fa-exclamation-triangle"></i> 请完成引擎配置 (Token + Model)
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={!ready}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={ready ? "输入测试消息..." : "终端离线..."}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none h-20 disabled:opacity-30 placeholder:text-slate-700"
          />
          <button 
            type="submit" disabled={!ready || !input.trim() || isProcessing}
            className="absolute bottom-3 right-3 w-8 h-8 bg-blue-600 rounded-lg text-white disabled:opacity-20 hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-blue-900/40"
          >
            <i className="fas fa-paper-plane text-[10px]"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
