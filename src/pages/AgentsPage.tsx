// ============================================
// 🤖 ADVANCED AGENTS PAGE - Full Power
// ============================================

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { smartChat, KEYS } from '../services/aiMatrix';
import { 
  Bot, Plus, Edit, Trash2, Play, Pause, Settings, X, Save, 
  Zap, Brain, Code, Search, FileText, Mail, Cog, Clock,
  ChevronDown, ChevronRight, Sparkles, Target, Shield, 
  Globe, Database, Terminal, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

// ================== TYPES ==================

interface AgentCapability {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  description: string;
}

interface Agent {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  avatar: string;
  color: string;
  systemPrompt: string;
  capabilities: string[];
  autonomyLevel: 'passive' | 'active' | 'autonomous';
  isActive: boolean;
  isPreset?: boolean;
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number;
  };
  allowedIntegrations: string[];
  maxIterations: number;
  createdAt: string;
  lastRun?: string;
  runCount: number;
  apiKeys?: Record<string, string>;
  memoryId?: string;
  canCallAgents?: string[];
  customIntegrations?: {
    id: string;
    name: string;
    baseUrl: string;
    authHeader: string;
  }[];
}

// ================== CAPABILITIES ==================

const CAPABILITIES: AgentCapability[] = [
  { id: 'chat', name: 'Chat', nameAr: 'محادثة', icon: <MessageSquare size={16} />, description: 'General conversation' },
  { id: 'code', name: 'Code', nameAr: 'برمجة', icon: <Code size={16} />, description: 'Write & debug code' },
  { id: 'research', name: 'Research', nameAr: 'بحث', icon: <Search size={16} />, description: 'Web search & research' },
  { id: 'writing', name: 'Writing', nameAr: 'كتابة', icon: <FileText size={16} />, description: 'Content creation' },
  { id: 'analysis', name: 'Analysis', nameAr: 'تحليل', icon: <Brain size={16} />, description: 'Data analysis' },
  { id: 'automation', name: 'Automation', nameAr: 'أتمتة', icon: <Zap size={16} />, description: 'Task automation' },
  { id: 'email', name: 'Email', nameAr: 'بريد', icon: <Mail size={16} />, description: 'Email management' },
  { id: 'scheduling', name: 'Scheduling', nameAr: 'جدولة', icon: <Clock size={16} />, description: 'Schedule tasks' },
];

// ================== PRESET AGENTS ==================

const PRESET_AGENTS: Omit<Agent, 'id' | 'createdAt' | 'runCount'>[] = []; // Templates removed

// ================== INTEGRATIONS ==================

const AVAILABLE_INTEGRATIONS = [
  { id: 'vercel', name: 'Vercel', icon: '▲', description: 'Deploy & Manage Projects' },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: '📱', description: 'Send & Receive Messages' },
  { id: 'github', name: 'GitHub', icon: '🐙', description: 'Issues & PR Management' },
  { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Read & Send Emails' },
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Channel Messaging' },
];

// ================== COMPONENT ==================

const AgentsPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [agents, setAgents] = useState<Agent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    avatar: '🤖',
    color: '#3B82F6',
    systemPrompt: '',
    capabilities: [] as string[],
    autonomyLevel: 'active' as 'passive' | 'active' | 'autonomous',
    allowedIntegrations: ['*'],
    maxIterations: 10,
    scheduleEnabled: false,
    scheduleInterval: 3600000,
    apiKeys: [] as { key: string; value: string }[],
    enableMemory: false,
    canCallAgents: [] as string[],
    customIntegrations: [] as { id: string; name: string; baseUrl: string; authHeader: string }[],
  });

  // Icon options (Lucide names + Emojis)
  const iconOptions = [
    'Bot', 'Brain', 'Zap', 'Code', 'Search', 'Terminal', 'Database', 'Globe', 'Shield', 'Target', 'Sparkles',
    'MessageSquare', 'Mail', 'Clock', 'FileText', 'Cpu', 'Ghost', 'Smile', 'Star', 'Sun', 'Moon'
  ];

  // Expanded Color Palette (Blue, Green, Red, White, Yellow, Orange)
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#F97316', // Orange
    '#FFFFFF', // White
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Slate
  ];

  // Helper to render avatar
  const renderAvatar = (avatarStr: string, size: number = 24, className: string = '') => {
    // Check if it's a Lucide Icon
    const IconComponent = {
      Bot, Brain, Zap, Code, Search, Terminal, Database, Globe, Shield, Target, Sparkles,
      MessageSquare, Mail, Clock, FileText, Cpu: Zap, Ghost: Bot, Smile: Bot, Star: Sparkles, Sun: Sparkles, Moon: Sparkles
    }[avatarStr as keyof typeof import('lucide-react')]; // Approximation for dynamic lookup

    // Dynamic lookup isn't perfect with import structure, so we use a map or switch
    // Ideally we'd use a dynamic import or a large map. For now, let's map the most common ones we imported.
    
    switch (avatarStr) {
      case 'Bot': return <Bot size={size} className={className} />;
      case 'Brain': return <Brain size={size} className={className} />;
      case 'Zap': return <Zap size={size} className={className} />;
      case 'Code': return <Code size={size} className={className} />;
      case 'Search': return <Search size={size} className={className} />;
      case 'Terminal': return <Terminal size={size} className={className} />;
      case 'Database': return <Database size={size} className={className} />;
      case 'Globe': return <Globe size={size} className={className} />;
      case 'Shield': return <Shield size={size} className={className} />;
      case 'Target': return <Target size={size} className={className} />;
      case 'Sparkles': return <Sparkles size={size} className={className} />;
      case 'MessageSquare': return <MessageSquare size={size} className={className} />;
      case 'Mail': return <Mail size={size} className={className} />;
      case 'Clock': return <Clock size={size} className={className} />;
      case 'FileText': return <FileText size={size} className={className} />;
      default: return <span style={{ fontSize: size }}>{avatarStr}</span>; // Fallback to emoji/text
    }
  };

  // Load agents from API
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('sb-access-token');
      const response = await fetch('/api/agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch agents: ${response.status} ${text}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAgents(data.data);
      } else {
        console.warn('Invalid agents data:', data);
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch agents', error);
      // Fallback
      const saved = localStorage.getItem('tryit-agents-v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setAgents(parsed);
        } catch (e) {
          console.error('Failed to parse saved agents', e);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(isAr ? 'الاسم مطلوب' : 'Name is required');
      return;
    }
    if (!formData.systemPrompt.trim()) {
      toast.error(isAr ? 'تعليمات النظام مطلوبة' : 'System prompt is required');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('sb-access-token');
    
    // Convert array of key-value pairs back to object
    const apiKeysObj = (formData.apiKeys || []).reduce((acc, curr) => {
      if (curr.key && curr.value) acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      name: formData.name,
      nameAr: formData.nameAr,
      description: formData.description,
      descriptionAr: formData.descriptionAr,
      avatar: formData.avatar,
      color: formData.color,
      systemPrompt: formData.systemPrompt,
      capabilities: formData.capabilities,
      autonomyLevel: formData.autonomyLevel,
      allowedIntegrations: formData.allowedIntegrations,
      maxIterations: formData.maxIterations,
      schedule: formData.scheduleEnabled ? {
        enabled: true,
        interval: formData.scheduleInterval,
      } : undefined,
      apiKeys: apiKeysObj,
      memoryId: formData.enableMemory ? `mem_${Date.now()}` : undefined,
      canCallAgents: formData.canCallAgents,
      customIntegrations: formData.customIntegrations,
    };

    try {
      if (editingAgent) {
        const response = await fetch(`/api/agents/${editingAgent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          toast.success(isAr ? 'تم تحديث الوكيل' : 'Agent updated');
          fetchAgents();
        } else {
           throw new Error('Update failed');
        }
      } else {
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          toast.success(isAr ? 'تم إنشاء الوكيل' : 'Agent created');
          fetchAgents();
        } else {
          throw new Error('Create failed');
        }
      }
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error(isAr ? 'فشل الحفظ' : 'Failed to save');
      // Fallback local save
      handleSubmitLocal(payload);
    }
  };

  const handleSubmitLocal = (payload: any) => {
    // ... existing local logic ...
    if (editingAgent) {
       const updated = agents.map(a => a.id === editingAgent.id ? { ...a, ...payload } : a);
       localStorage.setItem('tryit-agents-v2', JSON.stringify(updated));
       setAgents(updated as any);
    } else {
       const newAgent = { 
         ...payload, 
         id: `agent_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
         isActive: false, 
         createdAt: new Date().toISOString(), 
         runCount: 0 
       };
       const updated = [...agents, newAgent];
       localStorage.setItem('tryit-agents-v2', JSON.stringify(updated));
       setAgents(updated as any);
    }
    closeModal();
  };

  const deleteAgent = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent?.isPreset) {
      toast.error(isAr ? 'لا يمكن حذف الوكلاء الافتراضيين' : 'Cannot delete preset agents');
      return;
    }
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا الوكيل؟' : 'Are you sure you want to delete this agent?')) {
      saveAgents(agents.filter(a => a.id !== id));
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    }
  };

  const toggleActive = (id: string) => {
    const updated = agents.map(a => ({
      ...a,
      isActive: a.id === id ? !a.isActive : false,
    }));
    saveAgents(updated);
    const agent = updated.find(a => a.id === id);
    if (agent?.isActive) {
      toast.success(isAr ? `تم تفعيل ${agent.name}` : `${agent.name} activated`);
    }
  };

  const runAgent = async (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    let input: string | null = null;
    try {
      input = window.prompt(isAr ? 'ماذا تريد أن يفعل هذا الوكيل؟' : 'What do you want this agent to do?');
    } catch (e) {
      console.error("Prompt failed", e);
      toast.error(isAr ? 'المتصفح يمنع النوافذ المنبثقة' : 'Browser blocked prompt');
      return;
    }
    
    if (!input) return;

    toast.loading(isAr ? `جاري تشغيل ${agent.name}...` : `Running ${agent.name}...`, { id: 'agent-run' });
    
    // Update run count and last run locally
    const updated = agents.map(a => 
      a.id === id ? {
        ...a,
        lastRun: new Date().toISOString(),
        runCount: a.runCount + 1,
      } : a
    );
    saveAgents(updated);

    // Prepare Global Keys
    const globalKeys: Record<string, string> = {};
    if (KEYS.tavily) globalKeys['TAVILY_API_KEY'] = KEYS.tavily;
    if (KEYS.firecrawl) globalKeys['FIRECRAWL_API_KEY'] = KEYS.firecrawl;
    if (KEYS.e2b) globalKeys['E2B_API_KEY'] = KEYS.e2b;
    if (KEYS.replicate) globalKeys['REPLICATE_API_KEY'] = KEYS.replicate;
    if (KEYS.resend) globalKeys['RESEND_API_KEY'] = KEYS.resend;
    if (KEYS.github) globalKeys['GITHUB_TOKEN'] = KEYS.github;
    if (KEYS.vercel) globalKeys['VERCEL_TOKEN'] = KEYS.vercel;
    if (KEYS.whatsapp) globalKeys['WHATSAPP_TOKEN'] = KEYS.whatsapp;
    if (KEYS.twilio) globalKeys['TWILIO_ACCOUNT_SID'] = KEYS.twilio;
    if (KEYS.telegram) globalKeys['TELEGRAM_TOKEN'] = KEYS.telegram;
    if (KEYS.slack) globalKeys['SLACK_TOKEN'] = KEYS.slack;

    // Merge Agent Specific Keys
    const agentKeys = agent.apiKeys || {};
    const finalKeys = { ...globalKeys, ...agentKeys };

    try {
      // Execute on Backend
      const token = localStorage.getItem('token') || localStorage.getItem('sb-access-token'); // Try to find a token
      
      const response = await fetch('/api/agents/execute-inline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          input,
          agent: {
            ...agent,
            apiKeys: finalKeys // Inject merged keys
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Execution failed');
      }
      
      toast.success(isAr ? `اكتمل تشغيل ${agent.name}` : `${agent.name} completed`, { id: 'agent-run' });
      alert(isAr ? `النتيجة:\n${data.data}` : `Result:\n${data.data}`);
      
    } catch (error: any) {
       toast.error(isAr ? `فشل التشغيل: ${error.message}` : `Execution failed: ${error.message}`, { id: 'agent-run' });
       console.error(error);
    }
  };

  const openModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        nameAr: agent.nameAr || '',
        description: agent.description,
        descriptionAr: agent.descriptionAr || '',
        avatar: agent.avatar,
        color: agent.color,
        systemPrompt: agent.systemPrompt,
        capabilities: agent.capabilities,
        autonomyLevel: agent.autonomyLevel,
        allowedIntegrations: agent.allowedIntegrations,
        maxIterations: agent.maxIterations,
        scheduleEnabled: agent.schedule?.enabled || false,
        scheduleInterval: agent.schedule?.interval || 3600000,
        apiKeys: agent.apiKeys 
          ? Object.entries(agent.apiKeys).map(([key, value]) => ({ key, value }))
          : [],
        enableMemory: !!agent.memoryId,
        canCallAgents: agent.canCallAgents || [],
        customIntegrations: agent.customIntegrations || [],
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        avatar: '🤖',
        color: '#3B82F6',
        systemPrompt: '',
        capabilities: [],
        autonomyLevel: 'active',
        allowedIntegrations: ['*'],
        maxIterations: 10,
        scheduleEnabled: false,
        scheduleInterval: 3600000,
        apiKeys: [],
        enableMemory: false,
        canCallAgents: [],
        customIntegrations: [],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAgent(null);
  };

  const toggleCapability = (capId: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capId)
        ? prev.capabilities.filter(c => c !== capId)
        : [...prev.capabilities, capId],
    }));
  };

  return (
    <div className={`h-full flex flex-col ${c.bg} p-4 md:p-6 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${c.gradient}`}>
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${c.text}`}>
              {isAr ? 'الوكلاء الأذكياء' : 'AI Agents'}
            </h1>
            <p className={`text-sm ${c.textSecondary}`}>
              {isAr ? 'وكلاء ذكاء اصطناعي بدون قيود' : 'Unrestricted AI agents at your service'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => openModal()}
          className={`px-4 py-2 rounded-xl ${c.gradient} text-white flex items-center gap-2 hover:opacity-90 transition text-sm md:text-base`}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{isAr ? 'وكيل جديد' : 'New Agent'}</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.isArray(agents) && agents.map(agent => (
            <div
              key={agent.id}
              className={`rounded-xl ${c.bgSecondary} border ${c.border} overflow-hidden transition-all duration-200 hover:shadow-lg`}
              style={{ borderLeftColor: agent.color, borderLeftWidth: '4px' }}
            >
              {/* Agent Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200"
                      style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                    >
                      {renderAvatar(agent.avatar, 24)}
                    </div>
                    <div>
                      <h3 className={`font-bold ${c.text}`}>
                        {isAr && agent.nameAr ? agent.nameAr : agent.name}
                      </h3>
                      <p className={`text-xs ${c.textMuted}`}>
                        {isAr && agent.descriptionAr ? agent.descriptionAr : agent.description}
                      </p>
                    </div>
                  </div>
                  
                  {agent.isActive && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                      {isAr ? 'نشط' : 'Active'}
                    </span>
                  )}
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 4).map(capId => {
                    const cap = CAPABILITIES.find(c => c.id === capId);
                    return cap ? (
                      <span 
                        key={capId}
                        className={`px-2 py-1 rounded-lg text-xs ${c.bgTertiary} ${c.textSecondary} flex items-center gap-1`}
                      >
                        {cap.icon}
                        {isAr ? cap.nameAr : cap.name}
                      </span>
                    ) : null;
                  })}
                  {agent.capabilities.length > 4 && (
                    <span className={`px-2 py-1 rounded-lg text-xs ${c.bgTertiary} ${c.textMuted}`}>
                      +{agent.capabilities.length - 4}
                    </span>
                  )}
                </div>

                {/* Autonomy Level */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs ${c.textMuted}`}>
                    {isAr ? 'مستوى الاستقلالية:' : 'Autonomy:'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    agent.autonomyLevel === 'autonomous' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : agent.autonomyLevel === 'active'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {agent.autonomyLevel === 'autonomous' 
                      ? (isAr ? 'مستقل' : 'Autonomous')
                      : agent.autonomyLevel === 'active'
                        ? (isAr ? 'نشط' : 'Active')
                        : (isAr ? 'سلبي' : 'Passive')}
                  </span>
                  {agent.schedule?.enabled && (
                    <span className={`px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 flex items-center gap-1`}>
                      <Clock size={10} />
                      {isAr ? 'مجدول' : 'Scheduled'}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className={`flex items-center justify-between text-xs ${c.textMuted} mb-3`}>
                  <span>
                    {isAr ? 'التشغيلات:' : 'Runs:'} {agent.runCount}
                  </span>
                  {agent.lastRun && (
                    <span>
                      {isAr ? 'آخر تشغيل:' : 'Last run:'} {new Date(agent.lastRun).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(agent.id)}
                    className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                      agent.isActive 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : `${c.bgTertiary} ${c.textSecondary} hover:opacity-80`
                    }`}
                  >
                    {agent.isActive ? <Pause size={16} /> : <Play size={16} />}
                    {agent.isActive ? (isAr ? 'إيقاف' : 'Stop') : (isAr ? 'تفعيل' : 'Activate')}
                  </button>
                  
                  <button
                    onClick={() => runAgent(agent.id)}
                    className={`p-2 rounded-lg ${c.bgTertiary} text-blue-400 hover:bg-blue-500/20 transition`}
                    title={isAr ? 'تشغيل مرة واحدة' : 'Run once'}
                  >
                    <Zap size={16} />
                  </button>
                  
                  <button
                    onClick={() => openModal(agent)}
                    className={`p-2 rounded-lg ${c.bgTertiary} ${c.textSecondary} hover:opacity-80 transition`}
                  >
                    <Edit size={16} />
                  </button>
                  
                  {!agent.isPreset && (
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Details */}
              <button
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                className={`w-full p-2 border-t ${c.border} flex items-center justify-center gap-2 ${c.textMuted} hover:${c.bgTertiary} transition`}
              >
                {expandedAgent === agent.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-xs">{isAr ? 'تفاصيل' : 'Details'}</span>
              </button>

              {expandedAgent === agent.id && (
                <div className={`p-4 border-t ${c.border} ${c.bgTertiary}`}>
                  <p className={`text-xs ${c.textMuted} mb-2`}>{isAr ? 'تعليمات النظام:' : 'System Prompt:'}</p>
                  <pre className={`text-xs ${c.textSecondary} whitespace-pre-wrap max-h-32 overflow-y-auto p-2 rounded ${c.bg}`}>
                    {agent.systemPrompt}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] ${c.bgSecondary} rounded-2xl border ${c.border} shadow-2xl overflow-hidden flex flex-col`}>
            {/* Modal Header */}
            <div className={`p-4 border-b ${c.border} flex items-center justify-between flex-shrink-0`}>
              <h2 className={`text-lg font-bold ${c.text}`}>
                {editingAgent 
                  ? (isAr ? 'تعديل الوكيل' : 'Edit Agent')
                  : (isAr ? 'إنشاء وكيل جديد' : 'Create New Agent')}
              </h2>
              <button onClick={closeModal} className={`p-2 rounded-lg ${c.bgTertiary} ${c.text}`}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Avatar & Color */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'الأيقونة' : 'Icon'}
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                    {iconOptions.map(iconName => (
                      <button
                        key={iconName}
                        onClick={() => setFormData({ ...formData, avatar: iconName })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                          formData.avatar === iconName 
                            ? 'ring-2 ring-blue-500 bg-blue-500/10' 
                            : c.bgTertiary
                        }`}
                        style={{ color: formData.avatar === iconName ? formData.color : undefined }}
                      >
                        {renderAvatar(iconName, 20)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'اللون' : 'Color'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg transition border border-gray-700/50 ${
                          formData.color === color ? 'ring-2 ring-white scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Agent name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="اسم الوكيل"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'الوصف (إنجليزي)' : 'Description (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Short description"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'الوصف (عربي)' : 'Description (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="وصف قصير"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'القدرات' : 'Capabilities'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAPABILITIES.map(cap => (
                    <button
                      key={cap.id}
                      onClick={() => toggleCapability(cap.id)}
                      className={`px-3 py-2 rounded-lg flex items-center gap-2 transition ${
                        formData.capabilities.includes(cap.id)
                          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                          : `${c.bgTertiary} ${c.textSecondary}`
                      }`}
                    >
                      {cap.icon}
                      {isAr ? cap.nameAr : cap.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autonomy Level */}
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'مستوى الاستقلالية' : 'Autonomy Level'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['passive', 'active', 'autonomous'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, autonomyLevel: level })}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition ${
                        formData.autonomyLevel === level
                          ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                          : `${c.bgTertiary} ${c.textSecondary}`
                      }`}
                    >
                      {level === 'autonomous' ? <Sparkles size={20} /> : level === 'active' ? <Zap size={20} /> : <Shield size={20} />}
                      <span className="text-sm">
                        {level === 'autonomous' 
                          ? (isAr ? 'مستقل' : 'Autonomous')
                          : level === 'active'
                            ? (isAr ? 'نشط' : 'Active')
                            : (isAr ? 'سلبي' : 'Passive')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Iterations */}
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'الحد الأقصى للتكرارات' : 'Max Iterations'}: {formData.maxIterations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={formData.maxIterations}
                  onChange={(e) => setFormData({ ...formData, maxIterations: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className={`flex items-center gap-2 cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={formData.scheduleEnabled}
                    onChange={(e) => setFormData({ ...formData, scheduleEnabled: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className={`text-sm font-medium ${c.textSecondary}`}>
                    {isAr ? 'تفعيل الجدولة' : 'Enable Scheduling'}
                  </span>
                </label>
                {formData.scheduleEnabled && (
                  <div className="mt-2">
                    <select
                      value={formData.scheduleInterval}
                      onChange={(e) => setFormData({ ...formData, scheduleInterval: parseInt(e.target.value) })}
                      className={`w-full px-4 py-2 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border}`}
                    >
                      <option value={900000}>{isAr ? 'كل 15 دقيقة' : 'Every 15 minutes'}</option>
                      <option value={1800000}>{isAr ? 'كل 30 دقيقة' : 'Every 30 minutes'}</option>
                      <option value={3600000}>{isAr ? 'كل ساعة' : 'Every hour'}</option>
                      <option value={86400000}>{isAr ? 'يومياً' : 'Daily'}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* System Prompt */}
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'تعليمات النظام' : 'System Prompt'} *
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={8}
                  className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm`}
                  placeholder={isAr ? 'تعليمات للوكيل - كن محدداً ومفصلاً...' : 'Instructions for the agent - be specific and detailed...'}
                />
              </div>

              {/* Advanced Settings */}
              <div className={`border-t ${c.border} pt-4 mt-4`}>
                <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                  <Settings size={18} />
                  {isAr ? 'إعدادات متقدمة' : 'Advanced Settings'}
                </h3>

                {/* API Keys */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'مفاتيح API (تجاوز الإعدادات العامة)' : 'API Keys (Override Global)'}
                  </label>
                  {formData.apiKeys?.map((keyItem, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Key Name (e.g. OPENAI_API_KEY)"
                        value={keyItem.key || ''}
                        onChange={(e) => {
                          const newKeys = [...(formData.apiKeys || [])];
                          newKeys[index].key = e.target.value;
                          setFormData({ ...formData, apiKeys: newKeys });
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg ${c.bgTertiary} ${c.text} border ${c.border}`}
                      />
                      <input
                        type="password"
                        placeholder="Value"
                        value={keyItem.value || ''}
                        onChange={(e) => {
                          const newKeys = [...(formData.apiKeys || [])];
                          newKeys[index].value = e.target.value;
                          setFormData({ ...formData, apiKeys: newKeys });
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg ${c.bgTertiary} ${c.text} border ${c.border}`}
                      />
                      <button
                        onClick={() => {
                          const newKeys = (formData.apiKeys || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, apiKeys: newKeys });
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ ...formData, apiKeys: [...(formData.apiKeys || []), { key: '', value: '' }] })}
                    className={`text-sm ${c.textSecondary} hover:text-blue-400 flex items-center gap-1`}
                  >
                    <Plus size={14} /> {isAr ? 'إضافة مفتاح' : 'Add Key'}
                  </button>
                </div>

                {/* Integrations Section */}
                <div className="mb-4">
                   <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                     {isAr ? 'التكاملات المسموحة' : 'Allowed Integrations'}
                   </label>
                   <div className="grid grid-cols-2 gap-2">
                     {AVAILABLE_INTEGRATIONS.map(integration => {
                       const isEnabled = formData.allowedIntegrations.includes(integration.id) || formData.allowedIntegrations.includes('*');
                       return (
                         <div key={integration.id} className={`p-3 rounded-lg border ${isEnabled ? 'border-blue-500 bg-blue-500/10' : `${c.border} ${c.bgTertiary}`} transition`}>
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">{integration.icon}</span>
                               <span className={`font-medium ${c.text}`}>{integration.name}</span>
                             </div>
                             <input
                               type="checkbox"
                               checked={isEnabled}
                               onChange={() => {
                                 let newIntegrations = [...formData.allowedIntegrations];
                                 if (newIntegrations.includes('*')) newIntegrations = []; // Clear wildcard if specific selection starts
                                 
                                 if (newIntegrations.includes(integration.id)) {
                                   newIntegrations = newIntegrations.filter(id => id !== integration.id);
                                 } else {
                                   newIntegrations.push(integration.id);
                                 }
                                 setFormData({ ...formData, allowedIntegrations: newIntegrations });
                               }}
                               className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                             />
                           </div>
                           <p className={`text-xs ${c.textMuted}`}>{integration.description}</p>
                           
                           {/* Specific Key Input if Enabled */}
                           {isEnabled && (
                             <div className="mt-2">
                               <input
                                 type="password"
                                 placeholder={`${integration.name} API Key / Token`}
                                 value={formData.apiKeys?.find(k => k.key === `${integration.id.toUpperCase()}_API_KEY`)?.value || ''}
                                 onChange={(e) => {
                                   const keyName = `${integration.id.toUpperCase()}_API_KEY`;
                                   let newKeys = [...(formData.apiKeys || [])];
                                   const existingIndex = newKeys.findIndex(k => k.key === keyName);
                                   
                                   if (existingIndex >= 0) {
                                     newKeys[existingIndex].value = e.target.value;
                                   } else {
                                     newKeys.push({ key: keyName, value: e.target.value });
                                   }
                                   setFormData({ ...formData, apiKeys: newKeys });
                                 }}
                                 className={`w-full px-2 py-1 text-xs rounded ${c.bg} border ${c.border} ${c.text}`}
                               />
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                </div>

                {/* Custom Integrations Section */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                    {isAr ? 'تكاملات مخصصة' : 'Custom Integrations'}
                  </label>
                  {formData.customIntegrations?.map((integration, index) => (
                    <div key={index} className={`p-3 rounded-lg ${c.bgTertiary} border ${c.border} mb-3 space-y-2`}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Name (e.g. HubSpot)"
                          value={integration.name}
                          onChange={(e) => {
                            const newIntegrations = [...(formData.customIntegrations || [])];
                            newIntegrations[index].name = e.target.value;
                            setFormData({ ...formData, customIntegrations: newIntegrations });
                          }}
                          className={`flex-1 px-3 py-2 rounded-lg ${c.bg} ${c.text} border ${c.border} text-sm`}
                        />
                        <button
                          onClick={() => {
                            const newIntegrations = (formData.customIntegrations || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, customIntegrations: newIntegrations });
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Base URL (e.g. https://api.hubapi.com)"
                        value={integration.baseUrl}
                        onChange={(e) => {
                          const newIntegrations = [...(formData.customIntegrations || [])];
                          newIntegrations[index].baseUrl = e.target.value;
                          setFormData({ ...formData, customIntegrations: newIntegrations });
                        }}
                        className={`w-full px-3 py-2 rounded-lg ${c.bg} ${c.text} border ${c.border} text-sm font-mono`}
                      />
                      <input
                        type="text"
                        placeholder="Auth Header (e.g. Bearer {{HUBSPOT_KEY}})"
                        value={integration.authHeader}
                        onChange={(e) => {
                          const newIntegrations = [...(formData.customIntegrations || [])];
                          newIntegrations[index].authHeader = e.target.value;
                          setFormData({ ...formData, customIntegrations: newIntegrations });
                        }}
                        className={`w-full px-3 py-2 rounded-lg ${c.bg} ${c.text} border ${c.border} text-sm font-mono`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setFormData({ 
                      ...formData, 
                      customIntegrations: [
                        ...(formData.customIntegrations || []), 
                        { id: `custom_${Date.now()}`, name: '', baseUrl: '', authHeader: '' }
                      ] 
                    })}
                    className={`text-sm ${c.textSecondary} hover:text-blue-400 flex items-center gap-1`}
                  >
                    <Plus size={14} /> {isAr ? 'إضافة تكامل مخصص' : 'Add Custom Integration'}
                  </button>
                </div>

                {/* Memory & Agent Access */}
                <div className="flex flex-col gap-3">
                  <label className={`flex items-center gap-2 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={formData.enableMemory}
                      onChange={(e) => setFormData({ ...formData, enableMemory: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${c.textSecondary}`}>
                        {isAr ? 'تفعيل الذاكرة الخاصة' : 'Enable Dedicated Memory'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {isAr ? 'سيحتفظ الوكيل بذاكرة محادثات مستقلة' : 'Agent will maintain its own conversation memory'}
                      </span>
                    </div>
                  </label>
                  
                  {/* Can Call Agents */}
                  <div className="pb-8"> {/* Added padding to ensure visibility at bottom */}
                    <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                       {isAr ? 'السماح باستدعاء الوكلاء (الوكلاء الفرعيين):' : 'Can Call Agents (Sub-Agents):'}
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-700/30 rounded-lg p-2">
                       {Array.isArray(agents) && agents.length > 0 ? (
                         agents.filter(a => a.id !== editingAgent?.id).map(agent => (
                         <button
                           key={agent.id}
                           onClick={() => {
                             const current = formData.canCallAgents;
                             const updated = current.includes(agent.id) 
                               ? current.filter(id => id !== agent.id)
                               : [...current, agent.id];
                             setFormData({ ...formData, canCallAgents: updated });
                           }}
                           className={`px-3 py-1 rounded-full text-xs border flex items-center gap-2 ${
                             formData.canCallAgents.includes(agent.id)
                               ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                               : `${c.bgTertiary} ${c.textSecondary} ${c.border}`
                           }`}
                         >
                           <span>{renderAvatar(agent.avatar, 14)}</span>
                           {agent.name}
                         </button>
                       ))
                      ) : (
                        <p className={`text-xs ${c.textMuted} p-2`}>
                          {isAr ? 'لا يوجد وكلاء آخرين متاحين.' : 'No other agents available.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${c.border} flex justify-end gap-3 flex-shrink-0`}>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-xl ${c.bgTertiary} ${c.text} hover:opacity-80 transition`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-xl ${c.gradient} text-white flex items-center gap-2 hover:opacity-90 transition`}
              >
                <Save size={18} />
                {editingAgent ? (isAr ? 'تحديث' : 'Update') : (isAr ? 'إنشاء' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
