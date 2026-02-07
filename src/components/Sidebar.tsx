// ============================================
// SIDEBAR - With Sliding Conversations Panel
// ============================================

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getTheme, isDarkTheme } from '../lib/themes';
import { AnimatedLogo } from './AnimatedLogo';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Trash2, LogOut, X, History, Settings, FileText, Phone, Bot, Link, Brain, Monitor, CheckSquare, Zap, BarChart2, Scale } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { 
    user, 
    theme, 
    language,
    sidebarCollapsed, 
    setSidebarCollapsed, 
    setUser,
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useStore();
  
  const navigate = useNavigate();
  const c = getTheme(theme);
  const isAr = language === 'ar';
  const isDark = isDarkTheme(theme);
  
  // Conversations panel state
  const [showConversations, setShowConversations] = useState(false);

  const menuItems = [
    { icon: <MessageSquare size={20} className="text-blue-500" />, label: isAr ? 'المحادثة' : 'Chat', path: '/chat' },
    { icon: <CheckSquare size={20} className="text-blue-500" />, label: isAr ? 'المهام' : 'Tasks', path: '/tasks' },
    { icon: <Zap size={20} className="text-blue-500" />, label: isAr ? 'سير العمل' : 'Workflows', path: '/workflow' },
    { icon: <Bot size={20} className="text-blue-500" />, label: isAr ? 'العملاء' : 'Agents', path: '/agents' },
    { icon: <FileText size={20} className="text-blue-500" />, label: isAr ? 'ملاحظات' : 'Notes', path: '/notes' },
    { icon: <Phone size={20} className="text-blue-500" />, label: isAr ? 'اتصال صوتي' : 'Voice Call', path: '/voice' },
    { icon: <Monitor size={20} className="text-blue-500" />, label: isAr ? 'سطح المكتب' : 'Desktop', path: '/computer' },
    { icon: <Scale size={20} className="text-blue-500" />, label: isAr ? 'غرفة القرار' : 'Decision Room', path: '/decision' },
    { icon: <Brain size={20} className="text-blue-500" />, label: isAr ? 'عني' : 'About Me', path: '/memory' },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleNewChat = async () => {
    await createConversation(isAr ? 'محادثة جديدة' : 'New Chat');
    navigate('/chat');
    setShowConversations(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate('/chat');
    setShowConversations(false);
  };

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 64 : 240; // ===== RENDER =====
  return (
    <>
      {/* Mobile Overlay for Expanded Sidebar */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`
          ${sidebarCollapsed ? 'w-16' : 'w-64'} 
          transition-all duration-300 
          bg-[#050505] border-r border-gray-800
          flex flex-col h-full z-50
          ${isMobile && !sidebarCollapsed ? 'absolute inset-y-0 left-0 shadow-2xl' : 'relative'}
        `}
      >
        {/* Toggle Button - Middle of Edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#001d3d] border border-blue-900/30 rounded-full flex items-center justify-center text-blue-400 z-50 hover:scale-110 transition shadow-lg cursor-pointer"
          title={sidebarCollapsed ? (isAr ? 'توسيع' : 'Expand') : (isAr ? 'طي' : 'Collapse')}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* App Logo */}
        <div className="p-6 pb-2 flex flex-col items-center justify-center gap-3">
          <AnimatedLogo size={sidebarCollapsed ? 'sm' : 'md'} />
        </div>

        {/* New Chat Button */}
        <div className="p-3 mt-2">
          <button
            onClick={handleNewChat}
            className={`
              w-full bg-[#001d3d] hover:bg-blue-900/40 text-blue-400 border border-blue-900/30 py-2 px-3 rounded-lg 
              font-medium flex items-center justify-center gap-2 
              transition shadow-sm
            `}
            title={sidebarCollapsed ? (isAr ? 'محادثة جديدة' : 'New Chat') : undefined}
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span className="text-sm">{isAr ? 'محادثة جديدة' : 'New Chat'}</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          
          {/* History Button - Toggles Sliding Panel */}
          <button
            onClick={() => setShowConversations(true)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-gray-500 hover:text-gray-300 hover:bg-[#111] mb-2
              ${sidebarCollapsed ? 'justify-center' : ''}
            `}
          >
            <span className="text-xl flex items-center justify-center"><History size={20} className="text-blue-500" /></span>
            {!sidebarCollapsed && <span className="font-medium text-sm">{isAr ? 'السجل' : 'History'}</span>}
          </button>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-gray-500 hover:text-gray-300 hover:bg-[#111]
                ${sidebarCollapsed ? 'justify-center' : ''}
                ${isActive ? 'bg-[#001d3d] text-blue-400 border border-blue-900/30' : ''}
              `}
            >
              <span className="text-xl flex items-center justify-center">{item.icon}</span>
              {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a]">
            {!sidebarCollapsed ? (
              <div className="w-full text-center font-bold text-blue-400 truncate">
                {user?.name || (isAr ? 'المستخدم' : 'User')}
              </div>
            ) : (
              <div className="w-8 h-8 bg-[#001d3d] rounded-full flex items-center justify-center text-blue-400 font-bold flex-shrink-0 border border-blue-900/30">
                {user?.name?.[0]?.toUpperCase() || '👤'}
              </div>
            )}
          </div>
          
          {/* Settings Button */}
          {!sidebarCollapsed && (
            <button
              onClick={() => navigate('/settings')}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl transition text-gray-500 hover:text-gray-300 hover:bg-[#111]"
            >
              <Settings size={18} />
              <span className="text-sm">{isAr ? 'الإعدادات' : 'Configure'}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Sliding Conversations Panel - Slides from left edge */}
      <div 
        className={`
          fixed inset-y-0 left-0 w-80 
          ${c.bgSecondary} ${c.border} border-r
          transform transition-transform duration-300 ease-in-out z-[60]
          ${showConversations ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl
        `}
      >
        {/* Panel Header */}
        <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
          <h2 className={`font-bold text-lg ${c.text}`}>
            {isAr ? 'المحادثات السابقة' : 'Conversation History'}
          </h2>
          <button
            onClick={() => setShowConversations(false)}
            className={`p-2 rounded-lg ${c.bgTertiary} ${c.text} hover:opacity-80 transition`}
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button in Panel */}
        <div className={`p-3 border-b ${c.border}`}>
          <button
            onClick={handleNewChat}
            className={`
              w-full ${c.gradient} text-white py-3 px-4 rounded-xl 
              font-medium flex items-center justify-center gap-2 
              hover:opacity-90 transition shadow-lg
            `}
          >
            <Plus size={18} />
            <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-3">
          {conversations.length === 0 ? (
            <div className={`text-center py-8 ${c.textMuted}`}>
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>{isAr ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                    ${activeConversationId === conv.id
                      ? `${c.sidebarActive} border ${c.border}`
                      : `${c.bgTertiary} ${c.text} hover:opacity-80`
                    }
                  `}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <MessageSquare size={18} className={c.textSecondary} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.title}</p>
                    <p className={`text-xs ${c.textMuted} truncate`}>
                      {new Date(conv.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay when conversations panel is open */}
      {showConversations && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm"
          onClick={() => setShowConversations(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
