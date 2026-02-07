// ============================================
// 🖥️ COMPUTER USE PAGE - Try-It! v2.0
// Full-featured remote desktop control with E2B Sandbox
// ============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Monitor, Mouse, Keyboard, Power, PowerOff,
  Maximize2, Minimize2, RefreshCw, Camera, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Settings, Send, Loader2, Terminal, Search,
  FileText, Folder, Globe, Code, Play, Square, Download,
  Upload, Copy, Trash2, Edit3, Save, X, Check, AlertCircle,
  Wifi, WifiOff, Cpu, HardDrive, Clock, Activity
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme, isDarkTheme } from '../lib/themes';
import { smartChat, ChatMessage, KEYS } from '../services/aiMatrix';

// ============================================
// TYPES
// ============================================

interface SandboxFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

interface CommandResult {
  command: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
}

interface SessionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  sandboxId?: string;
  screenUrl?: string;
  error?: string;
  cursorX: number;
  cursorY: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  command: string;
  category: 'browser' | 'files' | 'terminal' | 'code' | 'system';
}

// ============================================
// CONSTANTS
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  // Browser
  { icon: <Globe size={16} />, label: 'Open Chrome', labelAr: 'فتح Chrome', command: 'google-chrome --no-sandbox &', category: 'browser' },
  { icon: <Globe size={16} />, label: 'Open Firefox', labelAr: 'فتح Firefox', command: 'firefox &', category: 'browser' },
  
  // Tools
  { icon: <Folder size={16} />, label: 'File Manager', labelAr: 'مدير الملفات', command: 'nautilus . &', category: 'files' },
  { icon: <Edit3 size={16} />, label: 'Notepad', labelAr: 'المفكرة', command: 'gedit &', category: 'files' },
  { icon: <Activity size={16} />, label: 'Calculator', labelAr: 'الآلة الحاسبة', command: 'gnome-calculator &', category: 'system' },
  
  // System
  { icon: <Settings size={16} />, label: 'Settings', labelAr: 'الإعدادات', command: 'gnome-control-center &', category: 'system' },
  { icon: <Clock size={16} />, label: 'Calendar', labelAr: 'التقويم', command: 'gnome-calendar &', category: 'system' },
];

const SANDBOX_TEMPLATES = [
  { id: 'ubuntu', name: 'Personal Computer', nameAr: 'كمبيوتر شخصي', icon: '💻' },
  { id: 'browser', name: 'Safe Browsing', nameAr: 'تصفح آمن', icon: '🌐' },
  { id: 'creative', name: 'Creative Studio', nameAr: 'استوديو إبداعي', icon: '🎨' },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function ComputerUsePage() {
  const navigate = useNavigate();
  const { theme, language } = useStore();
  const colors = getTheme(theme);
  const isDark = isDarkTheme(theme);
  const isAr = language === 'ar';
  
  // Session state
  const [session, setSession] = useState<SessionState>({
    status: 'disconnected',
    cursorX: 50,
    cursorY: 50,
    uptime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  });

  // Window System State
  const [windows, setWindows] = useState<Array<{
    id: string;
    title: string;
    icon: React.ReactNode;
    type: 'browser' | 'terminal' | 'files' | 'code';
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
  }>>([]);

  const openWindow = (type: 'browser' | 'terminal' | 'files' | 'code') => {
    // Ensure unique ID even if called multiple times rapidly
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const z = windows.length + 1;
    // Improved window sizing (smaller defaults to fit most screens)
    const baseW = type === 'code' ? 700 : type === 'browser' ? 700 : 500;
    const baseH = type === 'code' ? 500 : type === 'browser' ? 500 : 350;
    
    // Calculate center position relative to a standard 1080p screen view
    // Position them more centrally to avoid being cut off
    const x = 50 + (windows.length * 30); 
    const y = 50 + (windows.length * 30);

    const baseWindow = { id, z, x, y };
    
    switch (type) {
      case 'browser':
        setWindows(prev => [...prev, { ...baseWindow, title: 'Google Chrome', icon: <Globe size={14} />, type, w: 600, h: 400 }]);
        break;
      case 'terminal':
        setWindows(prev => [...prev, { ...baseWindow, title: 'Terminal', icon: <Terminal size={14} />, type, w: 500, h: 300 }]);
        break;
      case 'files':
        setWindows(prev => [...prev, { ...baseWindow, title: 'File Manager', icon: <Folder size={14} />, type, w: 500, h: 350 }]);
        break;
      case 'code':
        setWindows(prev => [...prev, { ...baseWindow, title: 'VS Code', icon: <Code size={14} />, type, w: 650, h: 450 }]);
        break;
    }
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const focusWindow = (id: string) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      z: w.id === id ? Math.max(...prev.map(p => p.z)) + 1 : w.z
    })));
  };
  
  // Screen interactions state
  const [dragState, setDragState] = useState<{
    id: string | null;
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
  }>({ id: null, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  const handleWindowMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
    e.stopPropagation();
    focusWindow(id);
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: x,
      initialTop: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragState.id) {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      
      setWindows(prev => prev.map(w => 
        w.id === dragState.id 
          ? { ...w, x: dragState.initialLeft + deltaX, y: dragState.initialTop + deltaY }
          : w
      ));
    }
  };

  const handleMouseUp = () => {
    setDragState({ id: null, startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });
  };
  
  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState('ubuntu');
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'files' | 'ai'>('ai');

  const [files, setFiles] = useState<SandboxFile[]>([]);
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  
  // Refs
  const screenRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${icon} ${message}`]);
  }, [isAr]);
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  // Update uptime
  useEffect(() => {
    if (session.status !== 'connected') return;
    
    const interval = setInterval(() => {
      setSession(s => ({ 
        ...s, 
        uptime: s.uptime + 1,
        cpuUsage: Math.min(100, Math.max(5, s.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.min(100, Math.max(20, s.memoryUsage + (Math.random() - 0.5) * 5)),
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session.status]);
  
  // Format uptime
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Status Indicator
  const getStatusColor = () => {
    switch (session.status) {
      case 'connected': return 'bg-blue-500'; 
      case 'connecting': return 'bg-blue-400 animate-pulse'; 
      case 'error': return 'bg-gray-500'; 
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = () => {
    switch (session.status) {
      case 'connected': return 'text-blue-400'; 
      case 'connecting': return 'text-blue-300'; 
      case 'error': return 'text-gray-400'; 
      default: return colors.textMuted;
    }
  };
  
  // ============================================
  // SANDBOX OPERATIONS
  // ============================================
  
  const connect = async () => {
    setSession(s => ({ ...s, status: 'connecting' }));
    addLog(isAr ? 'جاري إنشاء بيئة افتراضية...' : 'Creating virtual environment...', 'info');

    // Check if we have an API key for real connection
    if (KEYS.e2b) {
      try {
        const response = await fetch('/api/computer/sandbox', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-e2b-api-key': KEYS.e2b
          },
          body: JSON.stringify({ template: selectedTemplate })
        });

        if (!response.ok) throw new Error('Failed to create sandbox');
        
        const data = await response.json();
        
        setSession(s => ({
          ...s,
          status: 'connected',
          sandboxId: data.sandboxId,
          screenUrl: data.screenUrl,
          cursorX: 50,
          cursorY: 50,
          uptime: 0,
          cpuUsage: 10,
          memoryUsage: 20,
        }));
        
        addLog(isAr ? 'تم الاتصال بنجاح (E2B)!' : 'Connected successfully (E2B)!', 'success');
        
        // Initial file load
        loadFiles('/home/user');
        return;
      } catch (error: any) {
        console.error('Real connection failed, falling back to demo:', error);
        addLog(isAr ? 'فشل الاتصال الحقيقي، جاري التحويل للتجريبي...' : 'Real connection failed, switching to demo...', 'warning');
      }
    }
    
    // Fallback to Demo Mode
    setTimeout(() => {
      setSession(s => ({
        ...s,
        status: 'connected',
        sandboxId: 'demo-sandbox',
        // screenUrl is NOT used in the new UI, but we keep it for fallback
        screenUrl: `https://placehold.co/1920x1080/0f172a/334155?text=${encodeURIComponent(isAr ? 'سطح المكتب الافتراضي' : 'AI Assistant Virtual Desktop')}&font=roboto`,
        cursorX: 50,
        cursorY: 50,
        uptime: 0,
        cpuUsage: 15,
        memoryUsage: 35,
      }));
      
      addLog(isAr ? 'تم الاتصال بنجاح!' : 'Connected successfully!', 'success');
      
      // Load demo files
      setFiles([
        { name: 'Documents', path: '/home/user/Documents', type: 'directory' },
        { name: 'Downloads', path: '/home/user/Downloads', type: 'directory' },
        { name: 'Projects', path: '/home/user/Projects', type: 'directory' },
        { name: 'main.py', path: '/home/user/main.py', type: 'file', size: 1024 },
        { name: 'config.json', path: '/home/user/config.json', type: 'file', size: 256 },
        { name: 'notes.md', path: '/home/user/notes.md', type: 'file', size: 512 },
      ]);
    }, 1500);
  };
  
  const disconnect = async () => {
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      try {
        await fetch(`/api/computer/sandbox/${session.sandboxId}`, {
          method: 'DELETE',
          headers: { 'x-e2b-api-key': KEYS.e2b }
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
    
    setSession({
      status: 'disconnected',
      cursorX: 50,
      cursorY: 50,
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
    });
    setCommandHistory([]);
    setFiles([]);
    addLog(isAr ? 'تم قطع الاتصال' : 'Disconnected', 'info');
  };
  
  const executeCommand = async (cmd?: string) => {
    const commandToRun = cmd || command;
    if (!commandToRun.trim() || isProcessing) return;
    
    setIsProcessing(true);
    addLog(`$ ${commandToRun}`, 'info');
    
    const startTime = Date.now();
    
    try {
      if (session.sandboxId === 'demo-sandbox') {
        // Demo mode - simulate command
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
        
        const result: CommandResult = {
          command: commandToRun,
          output: getDemoOutput(commandToRun),
          exitCode: 0,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        
        setCommandHistory(prev => [...prev, result]);
        addLog(result.output.substring(0, 100) + (result.output.length > 100 ? '...' : ''), 'success');
      } else {
        // Real sandbox
        const response = await fetch('/api/computer/execute', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-e2b-api-key': KEYS.e2b
          },
          body: JSON.stringify({ 
            sandboxId: session.sandboxId,
            command: commandToRun,
          }),
        });
        
        const data = await response.json();
        
        const result: CommandResult = {
          command: commandToRun,
          output: data.output || data.error || 'No output',
          exitCode: data.exitCode || 0,
          timestamp: new Date(),
          duration: Date.now() - startTime,
        };
        
        setCommandHistory(prev => [...prev, result]);
        
        if (data.exitCode === 0) {
          addLog(data.output?.substring(0, 100) || 'Command executed', 'success');
        } else {
          addLog(data.error || 'Command failed', 'error');
        }
      }
    } catch (error: any) {
      const result: CommandResult = {
        command: commandToRun,
        output: `Error: ${error.message}`,
        exitCode: 1,
        timestamp: new Date(),
        duration: Date.now() - startTime,
      };
      setCommandHistory(prev => [...prev, result]);
      addLog(error.message, 'error');
    } finally {
      setIsProcessing(false);
      setCommand('');
    }
  };
  
  const getDemoOutput = (cmd: string): string => {
    const lower = cmd.toLowerCase();
    
    if (lower.startsWith('help')) return 'Available commands: chrome, firefox, files, calc, calendar, date';
    if (lower.startsWith('ls')) return 'Documents  Downloads  Desktop  Pictures  Music';
    if (lower.startsWith('pwd')) return '/home/user';
    if (lower.startsWith('whoami')) return 'user';
    if (lower.startsWith('date')) return new Date().toString();
    if (lower.startsWith('uname')) return 'Linux Personal-PC 5.15.0-generic';
    if (lower.startsWith('echo')) return cmd.replace(/^echo\s*/i, '');
    
    if (lower.includes('chrome') || lower.includes('firefox') || lower.includes('browser')) {
      // Add visual feedback to logs
      setTimeout(() => addLog(isAr ? 'تم فتح المتصفح' : 'Browser window opened', 'success'), 500);
      openWindow('browser');
      return 'Starting browser... [Running in background]';
    }
    if (lower.includes('calc')) {
       setTimeout(() => addLog(isAr ? 'تم فتح الحاسبة' : 'Calculator opened', 'success'), 500);
       return 'Starting Calculator...';
    }
    if (lower.includes('calendar')) {
       setTimeout(() => addLog(isAr ? 'تم فتح التقويم' : 'Calendar opened', 'success'), 500);
       return 'Starting Calendar...';
    }
    if (lower.includes('code')) {
      setTimeout(() => addLog(isAr ? 'تم فتح VS Code' : 'VS Code opened', 'success'), 500);
      openWindow('code');
      return 'Starting VS Code... [Ready]';
    }
    if (lower.includes('nautilus') || lower.includes('manager') || lower.includes('files')) {
      openWindow('files');
      return 'Starting File Manager...';
    }
    if (lower.includes('terminal') || lower.includes('bash')) {
      openWindow('terminal');
      return 'Starting Terminal...';
    }
    
    return `Command executed: ${cmd}`;
  };
  
  const loadFiles = async (path: string) => {
    if (session.sandboxId === 'demo-sandbox') {
      // Demo files
      setCurrentPath(path);
      return;
    }
    
    try {
      const response = await fetch(`/api/computer/files?sandboxId=${session.sandboxId}&path=${encodeURIComponent(path)}`);
      const data = await response.json();
      setFiles(data.files || []);
      setCurrentPath(path);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };
  
  // ============================================
  // AI ASSISTANCE
  // ============================================
  
  const sendAiMessage = async () => {
    if (!aiInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Check for advanced "Human-like" intent
    const isAdvancedRequest = aiInput.toLowerCase().includes('manage') || aiInput.toLowerCase().includes('life') || aiInput.toLowerCase().includes('study');
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: isAdvancedRequest 
        ? `[SYSTEM: ACTIVATING ADVANCED HUMAN AGENT MODE]
           User Request: "${aiInput}"
           
           MISSION: You are NOT just a chatbot. You are a high-level AI Personal Manager.
           1. ANALYZE the user's intent deeply.
           2. If they want you to "manage their life" or "study them", acknowledge this role shift.
           3. Propose a plan: "I will start by analyzing your files, calendar, and daily habits."
           4. EXECUTE ACTIONS: Use the computer tools (files, browser) to start "learning".
           5. CRITICAL: To execute an action, you MUST output a bash command in a code block.
           
           Example:
           \`\`\`bash
           ls -la /home/user/Documents
           \`\`\`
           
           Context: Virtual Desktop Environment.
          `
        : `[SYSTEM: DIRECT CONTROL MODE]
           User Request: "${aiInput}"
           
           INSTRUCTIONS:
           - You are an AI Agent with DIRECT CONTROL over this computer.
           - Do NOT explain how to do things. JUST DO THEM.
           - If the user says "open chrome", you must output the command to open chrome.
           - REQUIRED: Output commands in a code block like this:
             \`\`\`bash
             google-chrome
             \`\`\`
           - Respond briefly: "Opening Chrome..."
           
           Context: Virtual Linux Desktop. Current directory: ${currentPath}`,
    };
    
    const newMessages = [...aiMessages, userMessage];
    setAiMessages(newMessages);
    setAiInput('');
    
    try {
      const response = await smartChat(newMessages, {
        language: isAr ? 'ar' : 'en',
        enableWebSearch: false,
      });
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
      };
      
      setAiMessages([...newMessages, assistantMessage]);
      
      // Auto-execute if AI suggests specific actions
      if (response.content.includes('opening file manager') || response.content.includes('checking documents')) {
        setTimeout(() => openWindow('files'), 1000);
      }
      
      // Check if AI suggested a command
      const commandMatch = response.content.match(/```(?:bash|sh)?\n?(.*?)```/s);
      if (commandMatch) {
        const extractedCommand = commandMatch[1].trim().split('\n')[0];
        setCommand(extractedCommand);
        
        // AUTO-EXECUTE THE COMMAND
        addLog(isAr ? 'جاري تنفيذ أمر AI...' : 'AI executing command...', 'warning');
        setTimeout(() => {
          executeCommand(extractedCommand);
        }, 1000);
      }
    } catch (error: any) {
      addLog(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // ============================================
  // SCREEN INTERACTIONS
  // ============================================
  
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (session.status !== 'connected' || !screenRef.current) return;
    
    const rect = screenRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    setSession(s => ({ ...s, cursorX: x, cursorY: y }));
    
    // Check if clicked on desktop icons (approximate positions)
    // Documents: Top-Left (around 5% x, 5% y)
    if (x < 10 && y < 15) {
      addLog(isAr ? 'تم فتح المستندات' : 'Opening Documents...', 'info');
      openWindow('files');
      return;
    }
    // Terminal: Below Documents (around 5% x, 20% y)
    if (x < 10 && y > 15 && y < 30) {
      addLog(isAr ? 'تم فتح التيرمينال' : 'Opening Terminal...', 'info');
      openWindow('terminal');
      return;
    }
    // Browser: Below Terminal (around 5% x, 35% y)
    if (x < 10 && y > 30 && y < 45) {
      addLog(isAr ? 'تم فتح المتصفح' : 'Opening Browser...', 'info');
      openWindow('browser');
      return;
    }

    addLog(`${isAr ? 'نقر على' : 'Click at'} (${x}%, ${y}%)`, 'info');
    
    // Send click to sandbox
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      fetch('/api/computer/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: session.sandboxId, x, y }),
      }).catch(console.error);
    }
  };
  
  const moveCursor = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    setSession(s => {
      let { cursorX, cursorY } = s;
      switch (direction) {
        case 'up': cursorY = Math.max(0, cursorY - step); break;
        case 'down': cursorY = Math.min(100, cursorY + step); break;
        case 'left': cursorX = Math.max(0, cursorX - step); break;
        case 'right': cursorX = Math.min(100, cursorX + step); break;
      }
      return { ...s, cursorX, cursorY };
    });
  };
  
  const takeScreenshot = async () => {
    addLog(isAr ? 'جاري أخذ لقطة شاشة...' : 'Taking screenshot...', 'info');
    
    if (session.sandboxId && session.sandboxId !== 'demo-sandbox') {
      try {
        const response = await fetch(`/api/computer/screenshot?sandboxId=${session.sandboxId}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${Date.now()}.png`;
        a.click();
        
        addLog(isAr ? 'تم حفظ لقطة الشاشة' : 'Screenshot saved', 'success');
      } catch (error) {
        addLog(isAr ? 'فشل أخذ لقطة الشاشة' : 'Screenshot failed', 'error');
      }
    } else {
      addLog(isAr ? 'لقطة شاشة (وضع تجريبي)' : 'Screenshot (demo mode)', 'success');
    }
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`h-full flex flex-col overflow-hidden ${colors.bg}`}>
      {/* Header */}
      <header className={`flex-shrink-0 p-4 flex items-center justify-between border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className={`p-2 rounded-lg ${colors.bgSecondary} ${colors.text} hover:opacity-80 transition`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-xl font-bold flex items-center gap-2 ${colors.text}`}>
              <Monitor size={24} />
              {isAr ? 'التحكم بالكمبيوتر' : 'Computer Use'}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {session.status === 'connected' ? (
              <div className="flex items-center gap-2 text-blue-400">
                <Wifi size={14} />
                <span className={colors.textSecondary}>
                  {isAr ? 'متصل' : 'Connected'} • {formatUptime(session.uptime)}
                </span>
              </div>
            ) : session.status === 'connecting' ? (
              <div className="flex items-center gap-2 text-blue-300">
                <Loader2 size={14} className="animate-spin" />
                <span className={colors.textSecondary}>
                  {isAr ? 'جاري الاتصال...' : 'Connecting...'}
                </span>
              </div>
            ) : (
                <>
                  <WifiOff size={14} className="text-gray-500" />
                  <span className={colors.textSecondary}>
                    {isAr ? 'غير متصل' : 'Disconnected'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* System Stats */}
          {session.status === 'connected' && (
            <div className={`hidden md:flex items-center gap-4 px-4 py-2 rounded-lg ${colors.bgSecondary}`}>
              <div className="flex items-center gap-2">
                <Cpu size={14} className={colors.textSecondary} />
                <span className={`text-sm ${colors.text}`}>{Math.round(session.cpuUsage)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive size={14} className={colors.textSecondary} />
                <span className={`text-sm ${colors.text}`}>{Math.round(session.memoryUsage)}%</span>
              </div>
            </div>
          )}
          
          {/* Connection Button */}
          {session.status === 'disconnected' ? (
            <button
              onClick={connect}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-[#001d3d] hover:bg-blue-900 border border-blue-900/30 text-blue-400 transition"
            >
              <Power size={18} />
              <span>{isAr ? 'اتصال' : 'Connect'}</span>
            </button>
          ) : session.status === 'connecting' ? (
            <button disabled className="px-4 py-2 rounded-lg flex items-center gap-2 bg-[#001d3d] text-blue-400 opacity-75 border border-blue-900/30">
              <Loader2 size={18} className="animate-spin" />
              <span>{isAr ? 'جاري الاتصال...' : 'Connecting...'}</span>
            </button>
          ) : (
            <button
              onClick={disconnect}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
            >
              <PowerOff size={18} />
              <span>{isAr ? 'قطع الاتصال' : 'Disconnect'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Screen Area */}
        <div className={`flex-1 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
          {/* Screen Toolbar */}
          <div className={`flex items-center justify-between p-2 ${colors.bgSecondary} border-b ${colors.border}`}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSession(s => ({ ...s, screenUrl: s.screenUrl }))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
                title={isAr ? 'تحديث' : 'Refresh'}
              >
                <RefreshCw size={16} />
              </button>
              <button 
                onClick={takeScreenshot}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
                title={isAr ? 'لقطة شاشة' : 'Screenshot'}
              >
                <Camera size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
              >
                <ZoomOut size={16} />
              </button>
              <span className={`text-sm w-12 text-center ${colors.text}`}>{zoom}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
              >
                <ZoomIn size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
                title="Toggle Sidebar"
              >
                {isSidePanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-lg ${colors.bgTertiary} ${colors.text} hover:opacity-80 transition`}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          
          {/* Screen Display */}
          <div className="flex-1 p-0 overflow-hidden flex items-center justify-center bg-[#000]">
            <div 
              ref={screenRef}
              onClick={handleScreenClick}
              className={`relative overflow-hidden cursor-crosshair shadow-2xl`}
              style={{ 
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: '16/9', // Maintain aspect ratio
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              {session.status === 'connected' ? (
                <div 
                  className="w-full h-full relative bg-slate-900 overflow-hidden group"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Wallpaper */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-20" 
                      style={{ 
                        backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                      }} 
                    />
                    
                    {/* Center Logo/Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 select-none pointer-events-none">
                      <Monitor size={96} className="mb-4 opacity-50" />
                      <h1 className="text-4xl font-bold opacity-50 tracking-widest">Try-It! OS</h1>
                      <p className="text-xl mt-2 opacity-40 font-mono">v2.0.0 • Connected</p>
                    </div>
                  </div>

                  {/* Desktop Icons */}
                  <div className="absolute top-4 left-4 grid gap-4 pointer-events-none">
                    <div className="flex flex-col items-center gap-1 group/icon cursor-pointer pointer-events-auto" onClick={() => openWindow('files')}>
                      <div className="w-12 h-12 rounded bg-blue-500/20 flex items-center justify-center border border-blue-400/30 hover:bg-blue-500/40 transition">
                        <Folder size={24} className="text-blue-400" />
                      </div>
                      <span className="text-xs text-white/80 px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm">Documents</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 group/icon cursor-pointer pointer-events-auto" onClick={() => openWindow('browser')}>
                      <div className="w-12 h-12 rounded bg-orange-500/20 flex items-center justify-center border border-orange-400/30 hover:bg-orange-500/40 transition">
                        <Globe size={24} className="text-orange-400" />
                      </div>
                      <span className="text-xs text-white/80 px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm">Browser</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 group/icon cursor-pointer pointer-events-auto" onClick={() => addLog('Trash is empty', 'info')}>
                      <div className="w-12 h-12 rounded bg-gray-500/20 flex items-center justify-center border border-gray-400/30 hover:bg-gray-500/40 transition">
                        <Trash2 size={24} className="text-gray-400" />
                      </div>
                      <span className="text-xs text-white/80 px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm">Trash</span>
                    </div>
                  </div>

                  {/* Windows Container */}
                  <div className="absolute inset-0 pointer-events-none">
                    {windows.map(win => (
                      <div
                        key={win.id}
                        className="absolute bg-[#1e293b] rounded-lg shadow-2xl border border-slate-600 flex flex-col pointer-events-auto overflow-hidden transition-all duration-200"
                        style={{
                          left: win.x,
                          top: win.y,
                          width: win.w,
                          height: win.h,
                          zIndex: win.z,
                        }}
                        onMouseDown={() => focusWindow(win.id)}
                      >
                          {/* Title Bar */}
                        <div 
                          className="h-8 bg-slate-800 flex items-center justify-between px-3 border-b border-slate-700 select-none cursor-move"
                          onMouseDown={(e) => handleWindowMouseDown(e, win.id, win.x, win.y)}
                        >
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            {win.icon}
                            <span>{win.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-white/10 rounded"><Minimize2 size={10} className="text-slate-400" /></button>
                            <button className="p-1 hover:bg-white/10 rounded"><Maximize2 size={10} className="text-slate-400" /></button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                              className="p-1 hover:bg-red-500 rounded group/close"
                            >
                              <X size={10} className="text-slate-400 group-hover/close:text-white" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Window Content */}
                        <div className="flex-1 bg-[#0f172a] relative">
                          {win.type === 'browser' && (
                            <div className="flex flex-col h-full">
                              <div className="h-8 bg-slate-700 flex items-center gap-2 px-2 border-b border-slate-600">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 rounded-full bg-red-500"/>
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"/>
                                  <div className="w-2 h-2 rounded-full bg-green-500"/>
                                </div>
                                <div className="flex-1 bg-slate-900 rounded px-2 py-0.5 text-[10px] text-slate-400 text-center">google.com</div>
                              </div>
                              <div className="flex-1 bg-white flex items-center justify-center">
                                <div className="text-center">
                                  <span className="text-4xl font-bold text-slate-300">Google</span>
                                  <div className="mt-4 w-64 h-8 border rounded-full mx-auto shadow-sm"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          {win.type === 'terminal' && (
                            <div className="p-2 font-mono text-xs text-green-400">
                              <div className="mb-1">user@ai-assistant:~$ _</div>
                            </div>
                          )}
                          {win.type === 'code' && (
                            <div className="flex h-full">
                              <div className="w-12 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-2 gap-4 text-slate-500">
                                <FileText size={16} />
                                <Search size={16} />
                                <Code size={16} className="text-blue-500" />
                              </div>
                              <div className="flex-1 p-4 font-mono text-xs text-slate-300">
                                <div className="text-blue-400">import</div> <div className="inline text-white">React</div> <div className="inline text-blue-400">from</div> <div className="inline text-orange-300">'react'</div>;
                                <br/>
                                <br/>
                                <div className="text-purple-400">function</div> <div className="inline text-yellow-300">App</div>() {'{'}
                                <br/>
                                &nbsp;&nbsp;<div className="inline text-purple-400">return</div> (
                                <br/>
                                &nbsp;&nbsp;&nbsp;&nbsp;&lt;<div className="inline text-green-400">div</div>&gt;Hello World&lt;/<div className="inline text-green-400">div</div>&gt;
                                <br/>
                                &nbsp;&nbsp;);
                                <br/>
                                {'}'}
                              </div>
                            </div>
                          )}
                          {win.type === 'files' && (
                            <div className="flex h-full text-slate-300 text-xs">
                              <div className="w-32 bg-slate-800 border-r border-slate-700 p-2 space-y-2">
                                <div className="flex items-center gap-2 p-1 bg-blue-600/20 text-blue-400 rounded">
                                  <Folder size={12} /> Home
                                </div>
                                <div className="flex items-center gap-2 p-1 hover:bg-slate-700 rounded">
                                  <Download size={12} /> Downloads
                                </div>
                                <div className="flex items-center gap-2 p-1 hover:bg-slate-700 rounded">
                                  <FileText size={12} /> Documents
                                </div>
                              </div>
                              <div className="flex-1 p-4 grid grid-cols-4 gap-4 content-start">
                                <div className="flex flex-col items-center gap-1">
                                  <Folder size={32} className="text-blue-400" />
                                  <span>Projects</span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                  <FileText size={32} className="text-slate-500" />
                                  <span>notes.txt</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Taskbar */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-900/90 backdrop-blur-md border-t border-slate-700 flex items-center justify-between px-4 z-10">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openWindow('files')}
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition"
                        title="Start Menu"
                      >
                        <Monitor size={20} className="text-white" />
                      </button>
                      <div className="h-6 w-[1px] bg-slate-700 mx-1" />
                      <button 
                        onClick={() => openWindow('browser')}
                        className="p-1.5 rounded hover:bg-white/10 transition"
                        title="Browser"
                      >
                        <Globe size={20} className="text-slate-400" />
                      </button>
                      <button 
                        onClick={() => openWindow('files')}
                        className="p-1.5 rounded hover:bg-white/10 transition"
                        title="File Manager"
                      >
                        <Folder size={20} className="text-slate-400" />
                      </button>
                      <button 
                        onClick={() => openWindow('terminal')}
                        className="p-1.5 rounded hover:bg-white/10 transition"
                        title="Terminal"
                      >
                        <Terminal size={20} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/20">
                        <Wifi size={12} className="text-green-400" />
                        <span>Connected</span>
                      </div>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Cursor indicator */}
                  <div 
                    className="absolute w-6 h-6 pointer-events-none transition-all duration-75 ease-out z-50"
                    style={{ 
                      left: `${session.cursorX}%`,
                      top: `${session.cursorY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter">
                      <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill="white" stroke="black" strokeWidth="1"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    {session.status === 'connecting' ? (
                      <>
                        <Loader2 size={48} className="mx-auto mb-4 animate-spin text-blue-500" />
                        <p className="text-lg text-white/60">
                          {isAr ? 'جاري تجهيز البيئة الافتراضية...' : 'Preparing virtual environment...'}
                        </p>
                      </>
                    ) : (
                      <>
                        <Monitor size={64} className="mx-auto mb-4 text-white/20" />
                        <p className="text-lg text-white/60 mb-4">
                          {isAr ? 'اختر نوع البيئة واضغط "اتصال"' : 'Select environment type and press "Connect"'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                          {SANDBOX_TEMPLATES.map(t => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTemplate(t.id)}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                                selectedTemplate === t.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-[#111] text-gray-400 hover:bg-[#222] border border-gray-800'
                              }`}
                            >
                              <span>{t.icon}</span>
                              <span>{isAr ? t.nameAr : t.name}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Cursor Controls */}
          {session.status === 'connected' && (
            <div className="flex justify-center p-4 lg:hidden">
              <div className="grid grid-cols-3 gap-2">
                <div />
                <button 
                  onClick={() => moveCursor('up')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronUp size={20} className="mx-auto" />
                </button>
                <div />
                
                <button 
                  onClick={() => moveCursor('left')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronLeft size={20} className="mx-auto" />
                </button>
                <button 
                  onClick={() => handleScreenClick({ clientX: 0, clientY: 0 } as any)}
                  className="p-3 rounded-lg bg-blue-600"
                >
                  <Mouse size={20} className="mx-auto text-white" />
                </button>
                <button 
                  onClick={() => moveCursor('right')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronRight size={20} className="mx-auto" />
                </button>
                
                <div />
                <button 
                  onClick={() => moveCursor('down')}
                  className={`p-3 rounded-lg ${colors.bgSecondary}`}
                >
                  <ChevronDown size={20} className="mx-auto" />
                </button>
                <div />
              </div>
            </div>
          )}
        </div>
        
                {/* Side Panel */}
        {(!isFullscreen && isSidePanelOpen) && (
          <div className={`w-96 flex flex-col border-l ${colors.border} ${colors.bgSecondary}`}>
            {/* Tabs */}
            <div className={`flex border-b ${colors.border}`}>
              {[
                { id: 'ai', icon: <Activity size={16} />, label: isAr ? 'المساعد' : 'AI Assistant' },
                { id: 'files', icon: <Folder size={16} />, label: isAr ? 'الملفات' : 'Files' },
                { id: 'terminal', icon: <Terminal size={16} />, label: isAr ? 'النظام' : 'System' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? `text-blue-500 border-b-2 border-blue-500 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`
                      : `${colors.textSecondary} hover:${colors.text} hover:${isDark ? 'bg-white/5' : 'bg-gray-50'}`
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className={`flex-1 overflow-hidden flex flex-col ${colors.bgSecondary}`}>
              {/* Terminal Tab */}
              {activeTab === 'terminal' && (
                <>
                  {/* Command History */}
                  <div 
                    ref={terminalRef}
                    className={`flex-1 overflow-y-auto p-4 font-mono text-sm ${isDark ? 'bg-[#0f1115] text-green-400' : 'bg-gray-50 text-black'}`}
                  >
                    {commandHistory.length === 0 ? (
                      <div className={`text-center py-8 ${colors.textSecondary}`}>
                        <Terminal size={32} className="mx-auto mb-2 opacity-50" />
                        <p>{isAr ? 'لا توجد أوامر بعد' : 'No commands yet'}</p>
                      </div>
                    ) : (
                      commandHistory.map((result, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex items-center gap-2 text-blue-500 font-bold">
                            <span>$</span>
                            <span>{result.command}</span>
                          </div>
                          <pre className={`mt-1 whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            {result.output}
                          </pre>
                          <div className={`text-xs mt-1 ${colors.textSecondary}`}>
                            {isAr ? 'كود الخروج:' : 'Exit:'} {result.exitCode} • {result.duration}ms
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Command Input */}
                  <div className={`p-3 border-t ${colors.border} ${colors.bgSecondary}`}>
                    <div className="flex gap-2">
                      <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${colors.border} ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                        <span className="text-blue-500 font-mono">$</span>
                        <input
                          type="text"
                          value={command}
                          onChange={(e) => setCommand(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                          placeholder={isAr ? 'اكتب أمر...' : 'Type command...'}
                          className={`flex-1 bg-transparent outline-none font-mono ${colors.text} placeholder-gray-500`}
                          disabled={session.status !== 'connected' || isProcessing}
                        />
                      </div>
                      <button
                        onClick={() => executeCommand()}
                        disabled={session.status !== 'connected' || isProcessing || !command.trim()}
                        className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition shadow-sm"
                      >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      </button>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                        <button
                          key={i}
                          onClick={() => executeCommand(action.command)}
                          disabled={session.status !== 'connected'}
                          className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border ${colors.border} ${colors.text} disabled:opacity-50 hover:${isDark ? 'bg-white/10' : 'bg-gray-50'} transition shadow-sm`}
                        >
                          {action.icon}
                          <span>{isAr ? action.labelAr : action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className={`flex-1 overflow-y-auto p-4 ${colors.bgSecondary} ${colors.text}`}>
                  <div className={`mb-3 px-3 py-2 rounded-lg ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'} ${colors.textSecondary} text-sm font-mono border`}>
                    {currentPath}
                  </div>
                  
                  {files.length === 0 ? (
                    <div className={`text-center py-8 ${colors.textSecondary}`}>
                      <Folder size={32} className="mx-auto mb-2 opacity-50" />
                      <p>{isAr ? 'لا توجد ملفات' : 'No files'}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {currentPath !== '/home/user' && (
                        <button
                          onClick={() => loadFiles(currentPath.split('/').slice(0, -1).join('/') || '/home/user')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:${isDark ? 'bg-white/5' : 'bg-gray-100'} transition`}
                        >
                          <Folder size={18} className="text-blue-500" />
                          <span className={colors.text}>..</span>
                        </button>
                      )}
                      
                      {files.map((file, i) => (
                        <button
                          key={i}
                          onClick={() => file.type === 'directory' && loadFiles(file.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:${isDark ? 'bg-white/5' : 'bg-gray-100'} transition`}
                        >
                          {file.type === 'directory' ? (
                            <Folder size={18} className="text-blue-500" />
                          ) : (
                            <FileText size={18} className={colors.textSecondary} />
                          )}
                          <span className={`flex-1 text-left ${colors.text}`}>{file.name}</span>
                          {file.size && (
                            <span className={`text-xs ${colors.textSecondary} opacity-70`}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* AI Tab */}
              {activeTab === 'ai' && (
                <>
                  <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${colors.bgSecondary}`}>
                    {aiMessages.filter(m => !m.content.includes('[SYSTEM:')).length === 0 ? (
                      <div className={`text-center py-8 ${colors.textSecondary}`}>
                        <Activity size={32} className="mx-auto mb-2 opacity-50" />
                        <p>{isAr ? 'اسأل المساعد عن أي شيء' : 'Ask the assistant anything'}</p>
                      </div>
                    ) : (
                      aiMessages.filter(m => !m.content.includes('[SYSTEM:')).map((msg, i) => (
                        <div 
                          key={i}
                          className={`p-3 rounded-lg shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white ml-8'
                              : `${isDark ? 'bg-white/10' : 'bg-gray-100'} ${colors.text} mr-8 border ${colors.border}`
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className={`p-3 border-t ${colors.border} ${colors.bgSecondary}`}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendAiMessage()}
                        placeholder={isAr ? 'اسأل المساعد...' : 'Ask assistant...'}
                        className={`flex-1 px-3 py-2 rounded-lg border ${colors.border} ${isDark ? 'bg-black/20' : 'bg-gray-50'} ${colors.text} outline-none focus:ring-2 focus:ring-blue-500/20`}
                        disabled={isProcessing}
                      />
                      <button
                        onClick={sendAiMessage}
                        disabled={isProcessing || !aiInput.trim()}
                        className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition shadow-sm"
                      >
                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Logs */}
            <div className={`h-32 border-t ${colors.border} ${isDark ? 'bg-[#0f1115]' : 'bg-gray-50'} overflow-hidden`}>
              <div className={`px-3 py-2 flex items-center justify-between border-b ${colors.border}`}>
                <span className={`text-xs font-medium ${colors.textSecondary}`}>
                  {isAr ? 'سجل النشاط' : 'Activity Log'}
                </span>
                <button
                  onClick={() => setLogs([])}
                  className={`text-xs ${colors.textSecondary} hover:${colors.text}`}
                >
                  {isAr ? 'مسح' : 'Clear'}
                </button>
              </div>
              <div className={`h-[calc(100%-36px)] overflow-y-auto p-2 font-mono text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
