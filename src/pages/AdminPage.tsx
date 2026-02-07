// ============================================
// 👑 ADMIN PANEL - Control Everything by Chat
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, Send, Palette, Layout, Calendar, FileText, 
  Settings, Zap, RefreshCw, Download, Trash2, Heart,
  Moon, Sun, Monitor, Smartphone, CheckCircle, XCircle,
  Clock, Database, Shield, Activity, Terminal
} from 'lucide-react';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  changes?: string[];
}

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  result?: CommandResult;
  timestamp: Date;
}

// Quick command suggestions
const QUICK_COMMANDS = [
  { icon: Palette, label: 'تغيير الثيم', command: 'change theme to cyber neon' },
  { icon: Layout, label: 'الـ Sidebar يمين', command: 'move sidebar to right' },
  { icon: RefreshCw, label: 'صيانة', command: 'run maintenance' },
  { icon: Download, label: 'نسخة احتياطية', command: 'create backup' },
  { icon: FileText, label: 'تقرير أسبوعي', command: 'generate weekly report' },
  { icon: Heart, label: 'فحص النظام', command: 'health check' },
  { icon: Trash2, label: 'تنظيف', command: 'cleanup old data' },
  { icon: Settings, label: 'حالة النظام', command: 'show system status' },
];

const THEME_PRESETS = [
  { name: 'Midnight Blue', command: 'change theme to midnight blue', color: '#3b82f6' },
  { name: 'Forest Green', command: 'change theme to forest green', color: '#22c55e' },
  { name: 'Sunset Orange', command: 'change theme to sunset orange', color: '#f97316' },
  { name: 'Royal Purple', command: 'change theme to royal purple', color: '#a855f7' },
  { name: 'Ocean Teal', command: 'change theme to ocean teal', color: '#14b8a6' },
  { name: 'Rose Pink', command: 'change theme to rose pink', color: '#ec4899' },
  { name: 'Cyber Neon', command: 'change theme to cyber neon', color: '#00ff88' },
  { name: 'Light Mode', command: 'change theme to light mode', color: '#f8fafc' },
];

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: '👑 أهلاً يا Basel! أنا Admin Agent - بتحكم في كل حاجة في الـ App.\n\nقولي أي حاجة عايزها:\n• غير الألوان والثيم\n• حرك الـ sidebar\n• اعمل صيانة أو backup\n• طلع تقارير\n\nجرب تكتب أي أمر!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch system status on mount
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
        // Apply theme immediately
        applyTheme(data.data.theme);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  const applyTheme = (theme: any) => {
    if (!theme?.colors) return;
    
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value as string);
    });
    
    if (theme.borderRadius) {
      root.style.setProperty('--border-radius', theme.borderRadius);
    }
    
    // Store in localStorage for persistence
    localStorage.setItem('app-theme', JSON.stringify(theme));
  };

  const sendCommand = async (command: string) => {
    if (!command.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const result: CommandResult = await response.json();

      // Apply theme changes immediately if present
      if (result.data?.colors) {
        applyTheme(result.data);
      }

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: result.message,
        result,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentMessage]);
      
      // Refresh system status
      fetchSystemStatus();
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: '❌ حصل خطأ في تنفيذ الأمر. جرب تاني.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendCommand(input);
  };

  const handleQuickCommand = (command: string) => {
    sendCommand(command);
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <Crown className="crown-icon" />
          <h1>Admin Agent</h1>
          <span className="badge">Full Control</span>
        </div>
        
        <div className="tab-switcher">
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <Terminal size={18} />
            <span>Commands</span>
          </button>
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={18} />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="chat-container">
          {/* Quick Commands */}
          <div className="quick-commands">
            <div className="quick-commands-label">أوامر سريعة:</div>
            <div className="quick-commands-grid">
              {QUICK_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  className="quick-cmd-btn"
                  onClick={() => handleQuickCommand(cmd.command)}
                  disabled={isLoading}
                >
                  <cmd.icon size={16} />
                  <span>{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Presets */}
          <div className="theme-presets">
            <div className="theme-presets-label">ثيمات جاهزة:</div>
            <div className="theme-presets-grid">
              {THEME_PRESETS.map((theme, i) => (
                <button
                  key={i}
                  className="theme-preset-btn"
                  onClick={() => handleQuickCommand(theme.command)}
                  disabled={isLoading}
                  style={{ '--preset-color': theme.color } as any}
                >
                  <div className="theme-color" style={{ background: theme.color }} />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.type}`}>
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  
                  {/* Show changes if any */}
                  {msg.result?.changes && msg.result.changes.length > 0 && (
                    <div className="changes-list">
                      {msg.result.changes.map((change, i) => (
                        <div key={i} className="change-item">
                          <CheckCircle size={14} />
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show data preview if any */}
                  {msg.result?.data && typeof msg.result.data === 'object' && (
                    <details className="data-preview">
                      <summary>عرض التفاصيل</summary>
                      <pre>{JSON.stringify(msg.result.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message agent loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="input-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب أي أمر... (مثال: غير اللون الأساسي لأزرق)"
              disabled={isLoading}
              dir="auto"
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      ) : (
        <div className="dashboard-container">
          {/* System Health */}
          <div className="dashboard-card health-card">
            <div className="card-header">
              <Heart className="card-icon" />
              <h3>صحة النظام</h3>
            </div>
            <div className="health-status healthy">
              <CheckCircle size={48} />
              <span>النظام يعمل بشكل ممتاز</span>
            </div>
          </div>

          {/* Current Theme */}
          <div className="dashboard-card theme-card">
            <div className="card-header">
              <Palette className="card-icon" />
              <h3>الثيم الحالي</h3>
            </div>
            <div className="current-theme">
              <div className="theme-name">{systemStatus?.theme?.name || 'Default'}</div>
              <div className="theme-colors">
                {systemStatus?.theme?.colors && Object.entries(systemStatus.theme.colors).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="color-swatch" title={key}>
                    <div className="swatch" style={{ background: value as string }} />
                    <span>{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Status */}
          <div className="dashboard-card features-card">
            <div className="card-header">
              <Zap className="card-icon" />
              <h3>الميزات</h3>
            </div>
            <div className="features-grid">
              {systemStatus?.features && Object.entries(systemStatus.features).map(([key, enabled]) => (
                <div key={key} className={`feature-item ${enabled ? 'enabled' : 'disabled'}`}>
                  {enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span>{key.replace('Enabled', '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduled Tasks */}
          <div className="dashboard-card tasks-card">
            <div className="card-header">
              <Calendar className="card-icon" />
              <h3>المهام المجدولة</h3>
            </div>
            <div className="tasks-list">
              <div className="task-item">
                <Clock size={16} />
                <span>Weekly Maintenance</span>
                <span className="task-schedule">الأحد 3 صباحاً</span>
              </div>
              <div className="task-item">
                <Database size={16} />
                <span>Daily Backup</span>
                <span className="task-schedule">يومياً 2 صباحاً</span>
              </div>
              <div className="task-item">
                <FileText size={16} />
                <span>Weekly Report</span>
                <span className="task-schedule">الإثنين 9 صباحاً</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card actions-card">
            <div className="card-header">
              <Shield className="card-icon" />
              <h3>إجراءات سريعة</h3>
            </div>
            <div className="actions-grid">
              <button onClick={() => { setActiveTab('chat'); sendCommand('run maintenance'); }}>
                <RefreshCw size={20} />
                <span>صيانة الآن</span>
              </button>
              <button onClick={() => { setActiveTab('chat'); sendCommand('create backup'); }}>
                <Download size={20} />
                <span>نسخة احتياطية</span>
              </button>
              <button onClick={() => { setActiveTab('chat'); sendCommand('generate report'); }}>
                <FileText size={20} />
                <span>تقرير</span>
              </button>
              <button onClick={() => { setActiveTab('chat'); sendCommand('health check'); }}>
                <Heart size={20} />
                <span>فحص</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-background, #0f0f23);
          color: var(--color-text, #ffffff);
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: var(--color-surface, #1a1a2e);
          border-bottom: 1px solid var(--color-border, #2a2a4a);
        }

        .admin-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-title h1 {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .crown-icon {
          color: #f59e0b;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .badge {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tab-switcher {
          display: flex;
          gap: 0.5rem;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 8px;
          color: var(--color-textSecondary, #a0a0a0);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover, .tab.active {
          background: var(--color-primary, #6366f1);
          border-color: var(--color-primary, #6366f1);
          color: white;
        }

        /* Chat Container */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .quick-commands {
          padding: 1rem;
          background: var(--color-surface, #1a1a2e);
          border-bottom: 1px solid var(--color-border, #2a2a4a);
        }

        .quick-commands-label, .theme-presets-label {
          font-size: 0.875rem;
          color: var(--color-textSecondary, #a0a0a0);
          margin-bottom: 0.5rem;
        }

        .quick-commands-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .quick-cmd-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--color-background, #0f0f23);
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 8px;
          color: var(--color-text, #ffffff);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-cmd-btn:hover:not(:disabled) {
          background: var(--color-primary, #6366f1);
          border-color: var(--color-primary, #6366f1);
        }

        .quick-cmd-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .theme-presets {
          padding: 1rem;
          background: var(--color-surface, #1a1a2e);
          border-bottom: 1px solid var(--color-border, #2a2a4a);
        }

        .theme-presets-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .theme-preset-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: var(--color-background, #0f0f23);
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 6px;
          color: var(--color-text, #ffffff);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-preset-btn:hover:not(:disabled) {
          border-color: var(--preset-color);
          box-shadow: 0 0 10px var(--preset-color);
        }

        .theme-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
        }

        /* Messages */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          max-width: 85%;
          padding: 1rem;
          border-radius: 12px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          align-self: flex-end;
          background: var(--color-primary, #6366f1);
          color: white;
        }

        .message.agent {
          align-self: flex-start;
          background: var(--color-surface, #1a1a2e);
          border: 1px solid var(--color-border, #2a2a4a);
        }

        .message-content p {
          margin: 0;
          line-height: 1.5;
        }

        .message-content p + p {
          margin-top: 0.5rem;
        }

        .message-time {
          font-size: 0.75rem;
          color: var(--color-textSecondary, #a0a0a0);
          margin-top: 0.5rem;
          text-align: right;
        }

        .changes-list {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border, #2a2a4a);
        }

        .change-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--color-success, #22c55e);
          margin-top: 0.25rem;
        }

        .data-preview {
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          font-size: 0.75rem;
        }

        .data-preview summary {
          cursor: pointer;
          color: var(--color-primary, #6366f1);
        }

        .data-preview pre {
          margin-top: 0.5rem;
          overflow-x: auto;
          color: var(--color-textSecondary, #a0a0a0);
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 0.5rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--color-primary, #6366f1);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Input Form */
        .input-form {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--color-surface, #1a1a2e);
          border-top: 1px solid var(--color-border, #2a2a4a);
        }

        .input-form input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: var(--color-background, #0f0f23);
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 12px;
          color: var(--color-text, #ffffff);
          font-size: 1rem;
        }

        .input-form input:focus {
          outline: none;
          border-color: var(--color-primary, #6366f1);
        }

        .input-form button {
          padding: 0.75rem 1.25rem;
          background: var(--color-primary, #6366f1);
          border: none;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .input-form button:hover:not(:disabled) {
          background: var(--color-secondary, #8b5cf6);
          transform: scale(1.05);
        }

        .input-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Dashboard */
        .dashboard-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .dashboard-card {
          background: var(--color-surface, #1a1a2e);
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .card-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .card-icon {
          color: var(--color-primary, #6366f1);
        }

        .health-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
        }

        .health-status.healthy {
          color: var(--color-success, #22c55e);
        }

        .theme-colors {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .color-swatch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .swatch {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid rgba(255,255,255,0.1);
        }

        .color-swatch span {
          font-size: 0.625rem;
          color: var(--color-textSecondary, #a0a0a0);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          font-size: 0.875rem;
        }

        .feature-item.enabled {
          color: var(--color-success, #22c55e);
        }

        .feature-item.disabled {
          color: var(--color-error, #ef4444);
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
        }

        .task-schedule {
          margin-left: auto;
          font-size: 0.75rem;
          color: var(--color-textSecondary, #a0a0a0);
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .actions-grid button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: var(--color-background, #0f0f23);
          border: 1px solid var(--color-border, #2a2a4a);
          border-radius: 12px;
          color: var(--color-text, #ffffff);
          cursor: pointer;
          transition: all 0.2s;
        }

        .actions-grid button:hover {
          background: var(--color-primary, #6366f1);
          border-color: var(--color-primary, #6366f1);
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .admin-header {
            flex-direction: column;
            gap: 1rem;
          }

          .quick-commands-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
