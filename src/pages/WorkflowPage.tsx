
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { 
  Zap, Plus, Play, Trash2, ArrowRight, 
  Clock, Globe, MessageSquare, FileText, 
  Settings, Split, GitBranch, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { smartChat, webSearch, sendEmail } from '../services/aiMatrix';

// Types
interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'logic';
  action: 'schedule' | 'web_search' | 'send_email' | 'summarize' | 'generate_content' | 'chat' | 'parallel' | 'if_else' | 'delay';
  params: Record<string, string>;
  children?: WorkflowStep[]; // For parallel/branching
  elseChildren?: WorkflowStep[]; // For if/else
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: WorkflowStep[];
  lastRun?: string;
  runCount: number;
}

const WorkflowPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    const saved = localStorage.getItem('tryit-workflows');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'wf_1',
        name: 'Daily News Digest',
        description: 'Search for AI news and summarize it every morning',
        isActive: true,
        runCount: 12,
        steps: [
          { id: 's1', type: 'trigger', action: 'schedule', params: { time: '09:00' } },
          { id: 's2', type: 'action', action: 'web_search', params: { query: 'latest AI news today' } },
          { id: 's3', type: 'action', action: 'summarize', params: { format: 'bullet points' } },
        ]
      },
      {
        id: 'wf_2',
        name: 'Flight Tracker & Alert',
        description: 'Monitor aircraft data and send alerts for specific flights',
        isActive: true,
        runCount: 5,
        steps: [
          { id: 's1', type: 'trigger', action: 'schedule', params: { time: 'every_hour' } },
          { id: 's2', type: 'action', action: 'web_search', params: { query: 'flight status EK202' } },
          { id: 's3', type: 'action', action: 'chat', params: { prompt: 'Analyze flight status. If delayed, write a warning message.' } },
          { id: 's4', type: 'action', action: 'send_email', params: { to: 'founder@example.com' } },
        ]
      }
    ];
  });

  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Builder State
  const [newWorkflow, setNewWorkflow] = useState<Partial<Workflow>>({
    name: '',
    description: '',
    steps: [],
  });

  // Advanced Step Options
  const renderStepConfig = (step: WorkflowStep, index: number) => {
    return (
      <div className="mt-2 space-y-2">
        {step.action === 'web_search' && (
          <input 
            type="text" 
            placeholder="Search query (e.g. Flight EK202 status)" 
            value={step.params.query || ''}
            onChange={(e) => updateStep(step.id, { query: e.target.value })}
            className={`w-full p-2 text-sm rounded bg-black/20 border ${c.border} ${c.text}`}
          />
        )}
        {step.action === 'send_email' && (
          <input 
            type="email" 
            placeholder="Recipient email" 
            value={step.params.to || ''}
            onChange={(e) => updateStep(step.id, { to: e.target.value })}
            className={`w-full p-2 text-sm rounded bg-black/20 border ${c.border} ${c.text}`}
          />
        )}
        {(step.action === 'chat' || step.action === 'generate_content') && (
          <textarea 
            placeholder="AI Prompt (e.g. Analyze flight delay)" 
            value={step.params.prompt || ''}
            onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
            className={`w-full p-2 text-sm rounded bg-black/20 border ${c.border} ${c.text} resize-none h-20`}
          />
        )}
        {step.action === 'if_else' && (
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Condition (e.g. Does context contain 'error'?)" 
              value={step.params.condition || ''}
              onChange={(e) => updateStep(step.id, { condition: e.target.value })}
              className={`w-full p-2 text-sm rounded bg-black/20 border ${c.border} text-orange-300 placeholder-orange-300/50`}
            />
            <p className="text-xs text-orange-400/70">
              Note: Branching logic is simplified in this editor. Add child steps in 'Parallel' or separate workflows for complex logic.
            </p>
          </div>
        )}
        {step.action === 'delay' && (
          <input 
            type="number" 
            placeholder="Delay in milliseconds (e.g. 5000)" 
            value={step.params.ms || ''}
            onChange={(e) => updateStep(step.id, { ms: e.target.value })}
            className={`w-full p-2 text-sm rounded bg-black/20 border ${c.border} ${c.text}`}
          />
        )}
      </div>
    );
  };

  const updateStep = (id: string, params: Record<string, string>) => {
    setNewWorkflow(prev => ({
      ...prev,
      steps: prev.steps?.map(s => s.id === id ? { ...s, params: { ...s.params, ...params } } : s)
    }));
  };

  useEffect(() => {
    // Save workflows whenever they change (except initial load if possible? No, we need to save demos if first run)
    // Actually, lazy initializer doesn't save to localStorage if it was empty.
    // So we need to save the initial state if it was created from defaults.
    const saved = localStorage.getItem('tryit-workflows');
    if (!saved) {
      localStorage.setItem('tryit-workflows', JSON.stringify(workflows));
    }
  }, [workflows]);

  const saveWorkflows = (updated: Workflow[]) => {
    setWorkflows(updated);
    localStorage.setItem('tryit-workflows', JSON.stringify(updated));
  };

  const executeStep = async (step: WorkflowStep, context: string): Promise<string> => {
    // 1. Web Search
    if (step.action === 'web_search') {
        const query = step.params.query || "latest news";
        const results = await webSearch(query);
        return context + `\n\n[Search Results for "${query}"]:\n` + results.map(r => `- ${r.title}: ${r.snippet}`).join('\n');
    } 
    // 2. Chat / Generate
    else if (step.action === 'chat' || step.action === 'generate_content') {
        const prompt = step.params.prompt || "Generate content based on the context.";
        const response = await smartChat([
            { role: 'user', content: `${prompt}\n\nContext:\n${context}` }
        ]);
        return context + `\n\n[AI Output]:\n${response.content}`;
    }
    // 3. Summarize
    else if (step.action === 'summarize') {
        const response = await smartChat([
            { role: 'user', content: `Summarize the following content in ${step.params.format || 'bullet points'}:\n\n${context}` }
        ]);
        return context + `\n\n[Summary]:\n${response.content}`;
    }
    // 4. Send Email
    else if (step.action === 'send_email') {
         if (step.params.to) {
             await sendEmail(step.params.to, `Workflow Alert`, context);
         }
         return context + `\n\n[Email Sent to ${step.params.to}]`;
    }
    // 5. Parallel Execution
    else if (step.action === 'parallel' && step.children) {
        const results = await Promise.all(step.children.map(child => executeStep(child, context)));
        return context + `\n\n[Parallel Execution Results]:\n` + results.map((r, i) => `--- Branch ${i+1} ---\n${r}`).join('\n');
    }
    // 6. If/Else Logic
    else if (step.action === 'if_else') {
        const condition = step.params.condition || "Does the context contain 'error'?";
        const check = await smartChat([
            { role: 'user', content: `Check this condition: "${condition}"\nBased on this context:\n${context}\n\nReply with only "YES" or "NO".` }
        ]);
        
        const isTrue = check.content.toLowerCase().includes('yes');
        const branchToRun = isTrue ? step.children : step.elseChildren;
        
        if (branchToRun && branchToRun.length > 0) {
            let currentContext = context + `\n\n[Condition "${condition}": ${isTrue ? 'YES' : 'NO'}]`;
            for (const child of branchToRun) {
                currentContext = await executeStep(child, currentContext);
            }
            return currentContext;
        }
        return context + `\n\n[Condition "${condition}": ${isTrue ? 'YES' : 'NO'} - No actions defined]`;
    }
    // 7. Delay
    else if (step.action === 'delay') {
        const ms = parseInt(step.params.ms || '1000');
        await new Promise(resolve => setTimeout(resolve, ms));
        return context;
    }
    
    return context;
  };

  const handleRunWorkflow = async (id: string) => {
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;

    toast.loading(isAr ? `جاري تشغيل ${wf.name}...` : `Running ${wf.name}...`, { id: 'wf-run' });
    
    let context = "";

    try {
      for (const step of wf.steps) {
        if (step.type === 'trigger') continue;
        toast.loading(isAr ? `جاري تنفيذ: ${step.action}...` : `Executing: ${step.action}...`, { id: 'wf-run' });
        context = await executeStep(step, context);
      }

      const updated = workflows.map(w => w.id === id ? { ...w, lastRun: new Date().toISOString(), runCount: w.runCount + 1 } : w);
      saveWorkflows(updated);
      
      // Show result in a modal or alert
      alert(isAr ? `اكتملت العملية!\n\nالنتيجة:\n${context.substring(0, 500)}...` : `Workflow Completed!\n\nResult:\n${context.substring(0, 500)}...`);

      toast.success(isAr ? 'تم التشغيل بنجاح' : 'Workflow completed successfully', { id: 'wf-run' });
    } catch (e: any) {
      console.error(e);
      toast.error(isAr ? `فشل التشغيل: ${e.message}` : `Workflow failed: ${e.message}`, { id: 'wf-run' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد؟' : 'Are you sure?')) {
      saveWorkflows(workflows.filter(w => w.id !== id));
    }
  };

  const handleSaveBuilder = () => {
    if (!newWorkflow.name) return toast.error('Name required');
    
    if (editingId) {
      const updated = workflows.map(w => w.id === editingId ? { ...w, ...newWorkflow } as Workflow : w);
      saveWorkflows(updated);
    } else {
      const wf: Workflow = {
        id: `wf_${Date.now()}`,
        name: newWorkflow.name || 'Untitled',
        description: newWorkflow.description || '',
        isActive: true,
        runCount: 0,
        steps: newWorkflow.steps || [],
        ...newWorkflow
      } as Workflow;
      saveWorkflows([...workflows, wf]);
    }
    setShowBuilder(false);
    setEditingId(null);
    setNewWorkflow({ name: '', description: '', steps: [] });
  };

  const addStep = (action: WorkflowStep['action']) => {
    const step: WorkflowStep = {
      id: `step_${Date.now()}`,
      type: action === 'schedule' ? 'trigger' : (action === 'if_else' || action === 'parallel' ? 'logic' : 'action'),
      action,
      params: {},
      children: [], // Initialize for complex nodes
      elseChildren: []
    };
    setNewWorkflow({ ...newWorkflow, steps: [...(newWorkflow.steps || []), step] });
  };

  return (
    <div className={`h-full flex flex-col ${c.bg}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className={`p-6 border-b ${c.border} flex items-center justify-between`}>
        <div>
          <h1 className={`text-2xl font-bold ${c.text} flex items-center gap-3`}>
            <Zap className="text-yellow-500" />
            {isAr ? 'بناء سير العمل' : 'Workflow Builder'}
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">
              AI Powered
            </span>
          </h1>
          <p className={`${c.textSecondary} mt-1`}>
            {isAr ? 'أتمتة المهام المعقدة بدون كود' : 'Automate complex tasks without code'}
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingId(null);
            setNewWorkflow({ name: '', description: '', steps: [] });
            setShowBuilder(true);
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium transition"
        >
          <Plus size={18} />
          {isAr ? 'سير عمل جديد' : 'New Workflow'}
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {showBuilder ? (
          // BUILDER VIEW
          <div className={`max-w-3xl mx-auto ${c.card} border ${c.border} rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${c.text}`}>
                {editingId ? (isAr ? 'تعديل سير العمل' : 'Edit Workflow') : (isAr ? 'إنشاء سير عمل' : 'Create Workflow')}
              </h2>
              <button onClick={() => setShowBuilder(false)} className={c.textSecondary}>
                <ArrowRight className={isAr ? 'rotate-180' : ''} />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <input
                type="text"
                value={newWorkflow.name}
                onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})}
                placeholder={isAr ? 'اسم سير العمل' : 'Workflow Name'}
                className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} outline-none focus:border-blue-500`}
              />
              <textarea
                value={newWorkflow.description}
                onChange={e => setNewWorkflow({...newWorkflow, description: e.target.value})}
                placeholder={isAr ? 'وصف قصير...' : 'Short description...'}
                className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} outline-none h-20 resize-none`}
              />
            </div>

            <div className="space-y-4">
              <h3 className={`font-medium ${c.textSecondary} uppercase text-xs tracking-wider`}>
                {isAr ? 'الخطوات' : 'STEPS'}
              </h3>
              
              {newWorkflow.steps?.map((step, idx) => (
                <div key={step.id} className={`p-4 rounded-xl border ${c.border} bg-black/20`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.type === 'trigger' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${c.text} capitalize`}>{step.action.replace('_', ' ')}</p>
                    </div>
                    <button 
                      onClick={() => setNewWorkflow({...newWorkflow, steps: newWorkflow.steps?.filter(s => s.id !== step.id)})}
                      className="text-red-400 hover:bg-red-400/10 p-2 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* Step Configuration */}
                  {renderStepConfig(step, idx)}
                </div>
              ))}

              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => addStep('schedule')} className={`px-3 py-2 rounded-lg border ${c.border} ${c.textSecondary} hover:bg-white/5 flex items-center gap-2`}>
                  <Clock size={16} /> Schedule
                </button>
                <button onClick={() => addStep('web_search')} className={`px-3 py-2 rounded-lg border ${c.border} ${c.textSecondary} hover:bg-white/5 flex items-center gap-2`}>
                  <Globe size={16} /> Search
                </button>
                <button onClick={() => addStep('chat')} className={`px-3 py-2 rounded-lg border ${c.border} ${c.textSecondary} hover:bg-white/5 flex items-center gap-2`}>
                  <MessageSquare size={16} /> Chat AI
                </button>
                <button onClick={() => addStep('summarize')} className={`px-3 py-2 rounded-lg border ${c.border} ${c.textSecondary} hover:bg-white/5 flex items-center gap-2`}>
                  <FileText size={16} /> Summarize
                </button>
                <button onClick={() => addStep('if_else')} className={`px-3 py-2 rounded-lg border ${c.border} text-orange-400 hover:bg-orange-500/10 flex items-center gap-2`}>
                  <Split size={16} /> If/Else
                </button>
                <button onClick={() => addStep('parallel')} className={`px-3 py-2 rounded-lg border ${c.border} text-purple-400 hover:bg-purple-500/10 flex items-center gap-2`}>
                  <GitBranch size={16} /> Parallel
                </button>
                <button onClick={() => addStep('delay')} className={`px-3 py-2 rounded-lg border ${c.border} text-blue-400 hover:bg-blue-500/10 flex items-center gap-2`}>
                  <Clock size={16} /> Delay
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-800">
              <button onClick={() => setShowBuilder(false)} className={`flex-1 py-3 rounded-xl border ${c.border} ${c.text}`}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleSaveBuilder} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium">
                {isAr ? 'حفظ سير العمل' : 'Save Workflow'}
              </button>
            </div>
          </div>
        ) : (
          // LIST VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map(wf => (
              <div key={wf.id} className={`group relative p-6 rounded-2xl border ${c.border} ${c.card} hover:border-blue-500/30 transition-all`}>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => {
                    setEditingId(wf.id);
                    setNewWorkflow(wf);
                    setShowBuilder(true);
                  }} className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:text-white">
                    <Settings size={16} />
                  </button>
                  <button onClick={() => handleDelete(wf.id)} className="p-2 bg-gray-800 text-red-400 rounded-lg hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400`}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${c.text} line-clamp-1`}>{wf.name}</h3>
                    <p className={`text-xs ${c.textSecondary}`}>{wf.steps.length} steps</p>
                  </div>
                </div>
                
                <p className={`text-sm ${c.textSecondary} mb-6 line-clamp-2 h-10`}>
                  {wf.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-xs ${c.textMuted}`}>
                    <Play size={12} />
                    <span>{wf.runCount} runs</span>
                  </div>
                  
                  <button 
                    onClick={() => handleRunWorkflow(wf.id)}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <Play size={14} />
                    {isAr ? 'تشغيل' : 'Run Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowPage;
