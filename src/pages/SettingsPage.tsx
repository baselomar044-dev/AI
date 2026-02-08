// ============================================
// ⚙️ SETTINGS PAGE - SUPER CONSOLIDATED
// Integrations, Analytics, Config, & More
// ============================================

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme, ThemeType, themeNames, isDarkTheme } from '../lib/themes';
import { KEYS, updateApiKey, checkApiKeys } from '../services/aiMatrix';
import { 
  Palette, Globe, Brain, Zap, Check, Moon, Sun, Sparkles,
  Smartphone, Download, Share2, QrCode, Copy, RefreshCw, Wifi, WifiOff, Bell,
  Key, Database, Trash2, Upload, Terminal, Ghost, Fingerprint, 
  Baby, Scale, Volume2, Maximize, Clock, Eye, EyeOff, Save, XCircle,
  Grid, Github, Mail, Triangle, MessageSquare, Search, Mic, Image, Code,
  BarChart2, PieChart, TrendingUp, DollarSign, Activity,
  BrainCircuit, Focus, Monitor, Speaker, Calendar, Trello, Slack, Table, CheckSquare
} from 'lucide-react';
import { CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

// ============================================
// MAIN COMPONENT
// ============================================
const SettingsPage: React.FC = () => {
  const { 
    theme, setTheme, 
    language, setLanguage,
    aiConfig, setAIConfig,
    specialSettings, setSpecialSettings,
    messages, conversations // Needed for Analytics
  } = useStore();
  
  const c = getTheme(theme);
  const isAr = language === 'ar';

  // State
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appUrl, setAppUrl] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Integrations State
  const [activeKeys, setActiveKeys] = useState(checkApiKeys());
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [tempKeyValue, setTempKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Initialize
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial App URL
    const url = window.location.origin;
    setAppUrl(url);
    
    // Fetch real network IP if possible
    fetch('/api/system/network')
      .then(res => res.json())
      .then(data => {
        if (data.ip && data.ip !== 'localhost') {
           setAppUrl(`http://${data.ip}:5173`);
        }
      })
      .catch(() => {});

    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Refresh Keys
    setActiveKeys(checkApiKeys());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- HANDLERS ---
  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast.error(isAr ? 'التطبيق مثبت بالفعل أو غير مدعوم' : 'App already installed or not supported');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success(isAr ? 'تم تثبيت التطبيق!' : 'App installed!');
      setIsPWAInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Assistant',
          text: isAr ? 'جرب هذا المساعد الذكي!' : 'Check out this AI assistant!',
          url: appUrl
        });
        toast.success(isAr ? 'تم المشاركة!' : 'Shared!');
      } catch (e) {}
    } else {
      copyToClipboard(appUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? 'تم النسخ!' : 'Copied!');
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success(isAr ? 'تم تفعيل الإشعارات!' : 'Notifications enabled!');
      new Notification('AI Assistant', { body: isAr ? 'الإشعارات تعمل!' : 'Notifications working!' });
    }
  };

  const handleKeySave = (keyName: keyof typeof KEYS) => {
    if (!tempKeyValue.trim()) {
      return;
    }
    updateApiKey(keyName, tempKeyValue.trim());
    setActiveKeys(checkApiKeys());
    setTempKeyValue('');
    setExpandedItem(null);
    toast.success(isAr ? 'تم حفظ المفتاح!' : 'API Key saved!');
  };

  // --- DATA ---
  const themeOptions: Array<{ id: ThemeType; icon: React.ReactNode; preview: { bg: string; accent: string } }> = [
    { id: 'light', icon: <Sun size={20} />, preview: { bg: 'bg-slate-100', accent: 'bg-blue-600' } },
    { id: 'pink', icon: <Sparkles size={20} />, preview: { bg: 'bg-pink-100', accent: 'bg-pink-500' } },
    { id: 'gemini', icon: <Database size={20} />, preview: { bg: 'bg-[#050505]', accent: 'bg-blue-600' } },
  ];

  const providers = [
    // --- AI Brains (Models) ---
    { id: 'openai', name: 'OpenAI', icon: <Database size={20} className="text-blue-500" />, desc: 'GPT-4o (The Standard)', keyName: 'openai', link: 'https://platform.openai.com/api-keys' },
    { id: 'anthropic', name: 'Anthropic', icon: <Database size={20} className="text-blue-500" />, desc: 'Claude 3.5 Sonnet (Best Coding)', keyName: 'anthropic', link: 'https://console.anthropic.com/settings/keys' },
    { id: 'gemini', name: 'Gemini', icon: <Database size={20} className="text-blue-500" />, desc: 'Google 1.5 Pro (Huge Context)', keyName: 'gemini', link: 'https://aistudio.google.com/app/apikey' },
    { id: 'groq', name: 'Groq', icon: <Database size={20} className="text-blue-500" />, desc: 'Llama 3 70B (Fastest)', keyName: 'groq', link: 'https://console.groq.com/keys' },
    { id: 'elevenlabs', name: 'ElevenLabs', icon: <Mic size={20} className="text-blue-500" />, desc: 'Realistic Voice AI', keyName: 'elevenlabs', link: 'https://elevenlabs.io/app/settings/api-keys' },
    { id: 'replicate', name: 'Replicate', icon: <Image size={20} className="text-blue-500" />, desc: 'Image & Video Gen', keyName: 'replicate', link: 'https://replicate.com/account/api-tokens' },
    { id: 'tavily', name: 'Tavily', icon: <Search size={20} className="text-blue-500" />, desc: 'Real-time Web Search', keyName: 'tavily', link: 'https://tavily.com/' },
    { id: 'firecrawl', name: 'Firecrawl', icon: <Globe size={20} className="text-blue-500" />, desc: 'Web Scraping to Markdown', keyName: 'firecrawl', link: 'https://www.firecrawl.dev/' },
    { id: 'e2b', name: 'E2B', icon: <Code size={20} className="text-blue-500" />, desc: 'Code Sandbox Execution', keyName: 'e2b', link: 'https://e2b.dev/' },

    // --- Tools & Integrations ---
    { id: 'github', name: 'GitHub', icon: <Github size={20} className="text-blue-500" />, desc: 'Code Repos & Issues', keyName: 'github', link: 'https://github.com/settings/tokens' },
    { id: 'vercel', name: 'Vercel', icon: <Triangle size={20} className="text-blue-500" />, desc: 'Cloud Deployment', keyName: 'vercel', link: 'https://vercel.com/account/tokens' },
    { id: 'gmail', name: 'Gmail', icon: <Mail size={20} className="text-blue-500" />, desc: 'Send & Read Emails', keyName: 'gmail', link: 'https://console.cloud.google.com/' },
    { id: 'whatsapp', name: 'WhatsApp Business', icon: <MessageSquare size={20} className="text-blue-500" />, desc: 'Messaging (via Twilio)', keyName: 'twilio', link: 'https://console.twilio.com/' },
    { id: 'telegram', name: 'Telegram', icon: <MessageSquare size={20} className="text-blue-500" />, desc: 'Bot API for Messaging', keyName: 'telegram', link: 'https://t.me/BotFather' },
    { id: 'discord', name: 'Discord', icon: <MessageSquare size={20} className="text-blue-500" />, desc: 'Community & Chat Bots', keyName: 'discord', link: 'https://discord.com/developers/applications' },
    { id: 'slack', name: 'Slack', icon: <Slack size={20} className="text-blue-500" />, desc: 'Workplace Messaging', keyName: 'slack', link: 'https://api.slack.com/apps' },
    { id: 'notion', name: 'Notion', icon: <Database size={20} className="text-blue-500" />, desc: 'Knowledge Base & Notes', keyName: 'notion', link: 'https://www.notion.so/my-integrations' },
    { id: 'airtable', name: 'Airtable', icon: <Table size={20} className="text-blue-500" />, desc: 'Database & Spreadsheets', keyName: 'airtable', link: 'https://airtable.com/create/tokens' },
    { id: 'linear', name: 'Linear', icon: <CheckSquare size={20} className="text-blue-500" />, desc: 'Issue Tracking', keyName: 'linear', link: 'https://linear.app/settings/api' },
    { id: 'jira', name: 'Jira', icon: <CheckSquare size={20} className="text-blue-500" />, desc: 'Enterprise Project Mgmt', keyName: 'jira', link: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
    { id: 'trello', name: 'Trello', icon: <Trello size={20} className="text-blue-500" />, desc: 'Kanban Boards', keyName: 'trello', link: 'https://trello.com/power-ups/admin' },
    { id: 'hubspot', name: 'HubSpot', icon: <Database size={20} className="text-blue-500" />, desc: 'CRM & Marketing', keyName: 'hubspot', link: 'https://app.hubspot.com/settings/api-key' },
    { id: 'google_calendar', name: 'Google Calendar', icon: <Calendar size={20} className="text-blue-500" />, desc: 'Schedule & Events', keyName: 'google_calendar', link: 'https://console.cloud.google.com/' },
  ];

  // --- ANALYTICS CALCULATIONS ---
  const allMessages = Array.from(messages.values()).flat();
  const totalMessages = allMessages.length;
  const totalChars = allMessages.reduce((acc, m) => acc + m.content.length, 0);
  const estimatedTokens = totalChars / 4;
  const estimatedCost = (estimatedTokens / 1000000) * 5.0; // Rough calc

  const modelCounts: Record<string, number> = {};
  allMessages.forEach(m => {
    const model = m.metadata?.model || m.metadata?.provider || 'Unknown';
    modelCounts[model] = (modelCounts[model] || 0) + 1;
  });

  const usageData = Object.entries(modelCounts)
    .map(([label, value], index) => ({
      label,
      value: Math.round((value / totalMessages) * 100) || 0,
      color: ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-red-500'][index % 5]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className={`h-full overflow-auto ${c.bg}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-24">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${c.text}`}>
            {isAr ? '⚙️ الإعدادات الشاملة' : '⚙️ Super Settings'}
          </h1>
          <p className={c.textSecondary}>
            {isAr ? 'تحكم في كل شيء: المفاتيح، التحليلات، والمظهر' : 'Control everything: Keys, Analytics, Theme & Config'}
          </p>
        </div>

        {/* Connection Status Banner */}
        <div className={`flex items-center gap-3 p-4 rounded-xl ${isOnline ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
          <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
            {isOnline ? (isAr ? 'متصل بالإنترنت' : 'Connected') : (isAr ? 'غير متصل' : 'Offline')}
          </span>
        </div>

        {/* ===== 1. INTEGRATIONS & KEYS ===== */}
        <div className={`rounded-xl border ${c.border} overflow-hidden mb-6 transition-all duration-300 ease-in-out`}>
          <div 
            onClick={() => setExpandedSection(expandedSection === 'INTEGRATIONS_SECTION' ? null : 'INTEGRATIONS_SECTION')}
            className={`flex items-center justify-between p-6 cursor-pointer ${c.card} hover:bg-white/5 transition-colors`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-green-900/30`}>
                <Key className="text-green-500" size={20} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${c.text}`}>
                  {isAr ? '🔑 مفاتيح الربط' : '🔑 Integrations & API Keys'}
                </h2>
                <p className={`text-xs ${c.textSecondary}`}>
                  {isAr ? 'أدخل مفاتيحك هنا لتعمل الخدمات' : 'Enter your keys here to enable services'}
                </p>
              </div>
            </div>
            <div className={`transform transition-transform duration-300 ${expandedSection === 'INTEGRATIONS_SECTION' ? 'rotate-180' : ''}`}>
               <Triangle size={14} className={`${c.textSecondary} fill-current`} />
            </div>
          </div>

          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSection === 'INTEGRATIONS_SECTION' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`p-6 pt-0 border-t ${c.border} bg-black/10`}>
               <div className="flex flex-col gap-2 mt-4">
            {providers.map((provider) => {
              const isConnected = activeKeys[provider.keyName];
              const isItemExpanded = expandedItem === provider.id;

              return (
                <div key={provider.id} className={`rounded-xl border ${c.border} overflow-hidden transition-all duration-300 ${isItemExpanded ? 'bg-black/20' : ''}`}>
                  {/* Header Row - Click to Expand */}
                  <div 
                    onClick={() => setExpandedItem(isItemExpanded ? null : provider.id)}
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                        {provider.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold ${c.text} text-sm`}>{provider.name}</span>
                        {!isItemExpanded && <span className={`text-[10px] ${c.textSecondary}`}>{provider.desc}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isConnected ? 'text-green-500 border-green-500/30' : 'text-gray-500 border-gray-500/30'}`}>
                        {isConnected ? 'Active' : 'Missing'}
                      </span>
                      {/* Chevron Arrow */}
                      <div className={`transform transition-transform duration-300 ${isItemExpanded ? 'rotate-180' : ''}`}>
                        <Triangle size={10} className="text-gray-500 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isItemExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`p-4 pt-0 border-t ${c.border} border-dashed mt-2`}>
                      <p className={`text-xs ${c.textSecondary} mb-3 mt-3`}>{provider.desc}</p>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey ? "text" : "password"}
                            value={tempKeyValue}
                            onChange={(e) => setTempKeyValue(e.target.value)}
                            placeholder={
                              provider.keyName === 'twilio' ? "Enter Account SID" :
                              provider.keyName === 'telegram' ? "Enter Bot Token" :
                              provider.keyName === 'discord' ? "Enter Bot Token" :
                              provider.keyName === 'slack' ? "Enter User/Bot Token" :
                              "sk-..."
                            }
                            className={`w-full bg-black/20 border ${c.border} rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 font-mono ${c.text}`}
                            autoFocus
                          />
                          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-2 text-gray-400">
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button onClick={() => handleKeySave(provider.keyName as any)} className="bg-green-600 text-white px-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
                          <Save size={16} />
                          <span className="text-xs font-bold">Save</span>
                        </button>
                      </div>
                      
                      {provider.link && (
                        <a 
                          href={provider.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`mt-2 inline-flex items-center gap-1 text-[10px] ${c.textSecondary} hover:text-blue-400 transition-colors`}
                        >
                          <ExternalLink size={10} />
                          {isAr ? 'احصل على المفتاح من هنا' : 'Get API Key from here'}
                        </a>
                      )}
                      
                      <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
                        <CheckCircle size={10} /> Data is stored locally in your browser.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
               </div>
            </div>
          </div>
        </div>

        {/* ===== 2. ANALYTICS ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-orange-900/30`}>
              <BarChart2 className="text-orange-500" size={20} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${c.text}`}>
                {isAr ? '📊 التحليلات' : '📊 Analytics Snapshot'}
              </h2>
              <p className={`text-xs ${c.textSecondary}`}>
                {isAr ? 'نظرة سريعة على استخدامك' : 'Quick look at your usage stats'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Messages" value={totalMessages.toLocaleString()} icon={<MessageSquare size={16} className="text-blue-500" />} c={c} />
            <KpiCard title="Est. Cost" value={`$${estimatedCost.toFixed(4)}`} icon={<DollarSign size={16} className="text-green-500" />} c={c} />
            <KpiCard title="Chats" value={conversations.length.toLocaleString()} icon={<Activity size={16} className="text-purple-500" />} c={c} />
            <KpiCard title="Tokens" value={Math.round(estimatedTokens).toLocaleString()} icon={<Zap size={16} className="text-orange-500" />} c={c} />
          </div>

          {/* Mini Charts */}
          {usageData.length > 0 && (
          <div className={`p-4 rounded-xl border ${c.border} bg-black/10`}>
            <h3 className={`font-bold ${c.text} text-sm mb-3 flex items-center gap-2`}>
              <PieChart size={14} className="text-blue-500" />
              {isAr ? 'توزيع النماذج' : 'Model Distribution'}
            </h3>
            <div className="space-y-2">
              {usageData.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className={`flex-1 ${c.text}`}>{item.label}</span>
                  <span className={c.textSecondary}>{item.value}%</span>
                  <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </section>

        {/* ===== 3. SPECIAL SETTINGS ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg bg-purple-900/30`}>
              <Sparkles className="text-purple-500" size={20} />
            </div>
            <h2 className={`text-lg font-semibold ${c.text}`}>
              {isAr ? '✨ إعدادات خاصة' : '✨ Special Settings'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* --- Privacy & Core --- */}
            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.incognitoMode ? 'bg-purple-500/10 border-purple-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Ghost className={specialSettings?.incognitoMode ? 'text-purple-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'وضع التخفي' : 'Incognito Mode'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.incognitoMode;
                    setSpecialSettings({ incognitoMode: newValue });
                    toast(isAr ? (newValue ? 'تم إيقاف التخفي' : 'وضع التخفي مفعل') : (newValue ? 'Incognito on' : 'Incognito off'), { icon: '👻' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.incognitoMode ? 'bg-purple-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.incognitoMode ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'لا تحفظ السجل' : 'Don\'t save history'}</p>
            </div>

            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.matrixMode ? 'bg-green-500/10 border-green-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Grid className={specialSettings?.matrixMode ? 'text-green-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'وضع الماتريكس' : 'Matrix Mode'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.matrixMode;
                    setSpecialSettings({ matrixMode: newValue });
                    toast(isAr ? 'تم تفعيل وضع الماتريكس' : 'Matrix mode enabled', { icon: '📟' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.matrixMode ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.matrixMode ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'واجهة الهاكرز' : 'Hacker interface'}</p>
            </div>

            {/* --- Productivity & Ideas --- */}
            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.brainDump ? 'bg-blue-500/10 border-blue-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className={specialSettings?.brainDump ? 'text-blue-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'تنظيم الأفكار' : 'Organize Ideas'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.brainDump;
                    setSpecialSettings({ brainDump: newValue });
                    toast(isAr ? 'تم تفعيل وضع تنظيم الأفكار' : 'Brain Dump Mode enabled', { icon: '🧠' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.brainDump ? 'bg-blue-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.brainDump ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'تفريغ وتنظيم عقلي' : 'Brain dump & structure'}</p>
            </div>

            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.cinematicFocus ? 'bg-orange-500/10 border-orange-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Focus className={specialSettings?.cinematicFocus ? 'text-orange-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'التركيز السينمائي' : 'Cinematic Focus'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.cinematicFocus;
                    setSpecialSettings({ cinematicFocus: newValue });
                    toast(isAr ? 'تم تفعيل وضع التركيز' : 'Focus Mode enabled', { icon: '🎬' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.cinematicFocus ? 'bg-orange-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.cinematicFocus ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'إزالة المشتتات' : 'Remove distractions'}</p>
            </div>

            {/* --- Experimental --- */}
            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.eyeTracking ? 'bg-red-500/10 border-red-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className={specialSettings?.eyeTracking ? 'text-red-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'التحكم بالعين' : 'Eyes Control'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.eyeTracking;
                    setSpecialSettings({ eyeTracking: newValue });
                    toast(isAr ? 'تم تفعيل تتبع العين (تجريبي)' : 'Eye Tracking enabled (Beta)', { icon: '👁️' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.eyeTracking ? 'bg-red-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.eyeTracking ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'تحكم بالتمرير بعينك' : 'Scroll with your eyes'}</p>
            </div>

            <div className={`p-4 rounded-xl border ${c.border} ${specialSettings?.voiceCloneEnabled ? 'bg-pink-500/10 border-pink-500/30' : c.bgSecondary} transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Speaker className={specialSettings?.voiceCloneEnabled ? 'text-pink-500' : c.textSecondary} size={20} />
                  <span className={`font-medium ${c.text}`}>{isAr ? 'استنساخ الصوت' : 'Voice Clone'}</span>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !specialSettings?.voiceCloneEnabled;
                    setSpecialSettings({ voiceCloneEnabled: newValue });
                    toast(isAr ? 'تم تفعيل استنساخ الصوت' : 'Voice Cloning enabled', { icon: '🎙️' });
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors ${specialSettings?.voiceCloneEnabled ? 'bg-pink-500' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${specialSettings?.voiceCloneEnabled ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              <p className={`text-xs ${c.textSecondary}`}>{isAr ? 'تحدث بصوتك أنت' : 'Speak with your voice'}</p>
            </div>

          </div>
        </section>

        {/* ===== 4. APPEARANCE & CONFIG ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="text-blue-500" size={20} />
              <h2 className={`font-semibold ${c.text}`}>{isAr ? 'المظهر' : 'Theme'}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${theme === opt.id ? 'border-blue-500 bg-blue-500/10' : `${c.border} border hover:bg-white/5`}`}
                >
                  <div className={`w-full h-8 rounded ${opt.preview.bg} flex items-center justify-center`}>
                    <div className={`w-4 h-4 rounded-full ${opt.preview.accent}`} />
                  </div>
                  <span className={`text-xs ${c.text}`}>{themeNames[opt.id].en}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-blue-500" size={20} />
              <h2 className={`font-semibold ${c.text}`}>{isAr ? 'اللغة' : 'Language'}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'en', name: 'English' }, { id: 'ar', name: 'Arabic' }].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={`p-3 rounded-lg border transition-all ${language === lang.id ? 'border-blue-500 bg-blue-500/10 text-blue-500' : `${c.border} text-gray-400 hover:text-white`}`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ===== 5. MOBILE & PWA ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="text-blue-500" size={20} />
            <h2 className={`font-semibold ${c.text}`}>{isAr ? 'تطبيق الموبايل' : 'Mobile App'}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button 
              onClick={handleInstallPWA} 
              disabled={isPWAInstalled} 
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${isPWAInstalled ? 'border-green-500/30 text-green-500 bg-green-500/10' : `${c.border} ${c.text} hover:bg-white/5`}`}
            >
              {isPWAInstalled ? <CheckCircle size={18} /> : <Download size={18} />}
              {isPWAInstalled ? (isAr ? 'مثبت' : 'Installed') : (isAr ? 'تثبيت التطبيق' : 'Install App')}
            </button>
            
            <button 
              onClick={handleEnableNotifications} 
              disabled={notificationsEnabled}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${notificationsEnabled ? 'border-green-500/30 text-green-500 bg-green-500/10' : `${c.border} ${c.text} hover:bg-white/5`}`}
            >
              {notificationsEnabled ? <Bell size={18} /> : <Bell size={18} />}
              {notificationsEnabled ? (isAr ? 'الإشعارات مفعلة' : 'Notifications On') : (isAr ? 'تفعيل الإشعارات' : 'Enable Notifications')}
            </button>

            <button onClick={handleShare} className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${c.border} ${c.text} hover:bg-white/5`}>
              <Share2 size={18} /> {isAr ? 'مشاركة' : 'Share'}
            </button>
            
            <button onClick={() => setShowQRModal(true)} className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${c.border} ${c.text} hover:bg-white/5`}>
              <QrCode size={18} /> {isAr ? 'رمز QR' : 'Connect Mobile'}
            </button>
          </div>
          
          {/* iOS Hint */}
          <div className={`mt-4 p-3 rounded-lg ${c.bgSecondary} border ${c.border} flex items-start gap-3`}>
             <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
               <Smartphone size={16} />
             </div>
             <div>
               <h3 className={`text-sm font-bold ${c.text}`}>{isAr ? 'مستخدمي iOS (الآيفون)' : 'iOS Users (iPhone/iPad)'}</h3>
               <p className={`text-xs ${c.textSecondary} mt-1`}>
                 {isAr ? 'اضغط على زر المشاركة ⬆️ ثم اختر "إضافة إلى الشاشة الرئيسية" +' : 'Tap the Share button ⬆️ in Safari, then select "Add to Home Screen" +'}
               </p>
             </div>
          </div>
        </section>

        {/* ===== 6. STORAGE ===== */}
        <section className={`${c.card} rounded-xl p-6 ${c.border} border`}>
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-blue-500" size={20} />
            <h2 className={`font-semibold ${c.text}`}>{isAr ? 'التخزين' : 'Storage'}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              const data = JSON.stringify(localStorage, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ai-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              toast.success('Exported!');
            }} className={`flex-1 p-3 rounded-lg border ${c.border} ${c.text} flex items-center justify-center gap-2`}>
              <Upload size={18} /> Export
            </button>
            <button onClick={() => {
              if (confirm('Clear ALL data?')) {
                localStorage.clear();
                window.location.reload();
              }
            }} className="flex-1 p-3 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2">
              <Trash2 size={18} /> Reset
            </button>
          </div>
        </section>

      </div>

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
          <div className={`${c.card} rounded-2xl p-6 max-w-sm w-full border ${c.border}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
               <h3 className={`text-xl font-bold ${c.text}`}>{isAr ? 'اتصل بالموبايل' : 'Connect Mobile'}</h3>
               <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-white"><XCircle size={24} /></button>
            </div>
            
            <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-4 shadow-lg">
              <QRCodeSVG value={appUrl} size={192} />
            </div>
            
            <div className="space-y-2">
               <label className={`text-xs ${c.textSecondary} uppercase font-bold`}>{isAr ? 'رابط التطبيق' : 'App URL'}</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={appUrl}
                   onChange={(e) => {
                     setAppUrl(e.target.value);
                   }}
                   className={`flex-1 bg-black/20 border ${c.border} rounded-lg px-3 py-2 text-sm ${c.text} font-mono focus:ring-1 focus:ring-blue-500 outline-none`}
                 />
                 <button 
                   onClick={() => copyToClipboard(appUrl)}
                   className={`p-2 rounded-lg border ${c.border} hover:bg-white/10 ${c.text}`}
                 >
                   <Copy size={18} />
                 </button>
               </div>
               <p className="text-[10px] text-gray-500">
                 {isAr ? 'تلميح: استبدل localhost بعنوان IP الخاص بجهازك (مثل 192.168.1.5) لتتمكن من الفتح من الهاتف.' : 'Tip: Replace "localhost" with your local IP (e.g. 192.168.1.5) to open on your phone.'}
               </p>
            </div>

            <button onClick={() => setShowQRModal(false)} className="w-full mt-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
              {isAr ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component
const KpiCard = ({ title, value, icon, c }: any) => (
  <div className={`p-4 rounded-xl border ${c.border} ${c.bgSecondary}`}>
    <div className="flex justify-between items-start mb-1">
      <span className={`text-xs ${c.textSecondary}`}>{title}</span>
      {icon}
    </div>
    <div className={`text-lg font-bold ${c.text}`}>{value}</div>
  </div>
);

export default SettingsPage;
