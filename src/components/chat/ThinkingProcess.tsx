import React, { useState } from 'react';
import { Loader2, Brain, ChevronUp, ChevronDown, Check, X as XIcon } from 'lucide-react';

export interface ThinkingStep {
  id: string;
  text: string;
  textAr: string;
  status: 'pending' | 'active' | 'done' | 'error';
  startTime: number;
  endTime?: number;
}

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  isArabic: boolean;
}

export const ThinkingProcess: React.FC<ThinkingProcessProps> = ({ steps, isArabic }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (steps.length === 0) return null;

  return (
    <div className="flex justify-start w-full px-4 mb-4">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg overflow-hidden shadow-xl max-w-sm w-full transition-all duration-300 ring-1 ring-black/50">
        {/* Tasklet Header */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-[#252526] hover:bg-[#2d2d2d] transition-colors border-b border-[#333]"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {steps.some(s => s.status === 'active') ? (
                <div className="relative">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <div className="absolute inset-0 bg-blue-400/20 blur-sm rounded-full animate-pulse" />
                </div>
              ) : (
                <Brain className="w-4 h-4 text-green-400" />
              )}
            </div>
            <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">
              {isArabic ? 'المساعد الذكي' : 'AI ASSISTANT'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">
              {steps.filter(s => s.status === 'done').length}/{steps.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="bg-[#1e1e1e] p-1 max-h-60 overflow-y-auto custom-scrollbar">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#2a2a2a] transition-colors group">
                <div className="shrink-0 w-4 flex justify-center">
                  {step.status === 'active' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />}
                  {step.status === 'done' && <Check className="w-3.5 h-3.5 text-green-500" />}
                  {step.status === 'error' && <XIcon className="w-3.5 h-3.5 text-red-500" />}
                  {step.status === 'pending' && <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />}
                </div>
                
                <div className="flex-1 min-w-0 flex justify-between items-center">
                  <span className={`text-xs ${
                    step.status === 'active' ? 'text-blue-300 font-medium' : 
                    step.status === 'done' ? 'text-gray-400 line-through decoration-gray-600' : 
                    'text-gray-500'
                  }`}>
                    {isArabic ? step.textAr : step.text}
                  </span>
                  
                  {step.endTime && (
                    <span className="text-[9px] font-mono text-gray-600">
                      {((step.endTime - step.startTime) / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Collapsed Summary (Active Step) */}
        {!isExpanded && steps.some(s => s.status === 'active') && (
          <div className="px-3 py-2 bg-[#1e1e1e] border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-progress-indeterminate" />
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1 truncate font-mono">
              {(() => {
                const activeStep = steps.find(s => s.status === 'active') || steps[steps.length - 1];
                return `> ${isArabic ? activeStep.textAr : activeStep.text}...`;
              })()}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress-indeterminate {
          0% { width: 30%; margin-left: -30%; }
          50% { width: 30%; margin-left: 100%; }
          100% { width: 30%; margin-left: 100%; }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite ease-in-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};
