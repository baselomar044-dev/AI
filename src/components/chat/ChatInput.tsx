import React, { useState } from 'react';
import { Bot, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  isArabic: boolean;
  isRecording: boolean;
  recordingTime: number;
  startRecording: () => void;
  stopRecording: () => void;
  cancelRecording: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  agents: any[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  attachments: any[];
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input, setInput, handleSend, isLoading, isArabic,
  isRecording, recordingTime, startRecording, stopRecording, cancelRecording,
  fileInputRef, handleFileSelect,
  agents, selectedAgentId, setSelectedAgentId,
  attachments
}) => {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const navigate = useNavigate();

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center justify-center gap-6 py-4 bg-blue-900/10 rounded-2xl border border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-blue-400 font-mono text-xl">{formatTime(recordingTime)}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={cancelRecording}
            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-700"
          >
            {isArabic ? '❌ إلغاء' : '❌ Cancel'}
          </button>
          <button
            onClick={stopRecording}
            className="px-5 py-2 bg-[#001d3d] hover:bg-blue-900 text-blue-400 border border-blue-900/30 rounded-xl transition-all"
          >
            {isArabic ? '✓ إرسال' : '✓ Send'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Agent Selector */}
      <div className="relative">
        <button
          onClick={() => setShowAgentSelector(!showAgentSelector)}
          className={`p-3 rounded-xl border transition-all shadow-lg flex items-center gap-2 ${
            selectedAgent 
              ? 'bg-purple-900/20 border-purple-500/50 text-purple-400' 
              : 'bg-[#001d3d] border-blue-900/30 text-blue-400 hover:bg-blue-900/50'
          }`}
          title={isArabic ? 'اختر وكيل' : 'Select Agent'}
        >
          {selectedAgent ? (
            <span className="text-lg leading-none">{selectedAgent.avatar}</span>
          ) : (
            <Users size={20} />
          )}
        </button>

        {/* Dropdown */}
        {showAgentSelector && (
          <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#1a1d21] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-2 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase px-2">
                {isArabic ? 'الوكلاء المتاحين' : 'Available Agents'}
              </h3>
              <button onClick={() => navigate('/agents')} className="text-[10px] text-blue-400 hover:underline px-2">
                {isArabic ? 'إدارة' : 'Manage'}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => { setSelectedAgentId('default'); setShowAgentSelector(false); }}
                className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${selectedAgentId === 'default' ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300'}`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div>
                  <div className="font-medium text-sm">{isArabic ? 'المساعد الافتراضي' : 'Default Assistant'}</div>
                  <div className="text-[10px] opacity-60">AI Assistant Standard</div>
                </div>
                {selectedAgentId === 'default' && <Check size={14} className="ml-auto" />}
              </button>

              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgentId(agent.id); setShowAgentSelector(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${selectedAgentId === agent.id ? 'bg-purple-500/10 text-purple-400' : 'text-gray-300'}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${agent.color}20` }}>
                    {agent.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{isArabic && agent.nameAr ? agent.nameAr : agent.name}</div>
                    <div className="text-[10px] opacity-60 truncate">{isArabic && agent.descriptionAr ? agent.descriptionAr : agent.description}</div>
                  </div>
                  {selectedAgentId === agent.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attachment Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="p-3 bg-[#001d3d] border border-blue-900/30 text-blue-400 rounded-xl hover:bg-blue-900/50 transition-all shadow-lg"
        title={isArabic ? 'إرفاق ملف / صورة' : 'Attach file / image'}
      >
        📎
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Text Input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        placeholder={isArabic ? 'اكتب رسالتك...' : 'Message AI Assistant...'}
        className="flex-1 px-5 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none min-h-[50px] max-h-[120px]"
        rows={2}
        disabled={isLoading}
      />
      
      {/* Voice Button */}
      <button
        onClick={startRecording}
        className="p-3 bg-[#001d3d] border border-blue-900/30 text-blue-400 rounded-xl hover:bg-blue-900/50 transition-all shadow-lg"
        title={isArabic ? 'رسالة صوتية' : 'Voice message'}
      >
        🎤
      </button>
      
      {/* Send Button */}
      <button
        onClick={() => handleSend()}
        disabled={isLoading || (!input.trim() && attachments.length === 0)}
        className="p-3 bg-[#001d3d] border border-blue-900/30 text-blue-400 rounded-xl hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="font-bold">{isArabic ? 'إرسال' : 'Send'}</span>
        )}
      </button>
    </div>
  );
};
