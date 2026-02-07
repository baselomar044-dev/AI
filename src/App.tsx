// ============================================
// AI ASSISTANT v2.0 - Main App with Theme System
// ============================================

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { getTheme, isDarkTheme } from './lib/themes';

// Components
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';

// Pages - Lazy Loaded
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const NotesPage = React.lazy(() => import('./pages/NotesPage'));
const MemoryPage = React.lazy(() => import('./pages/MemoryPage'));
const AgentsPage = React.lazy(() => import('./pages/AgentsPage'));
const VoiceCallPage = React.lazy(() => import('./pages/VoiceCallPage'));
const ComputerUsePage = React.lazy(() => import('./pages/ComputerUsePage'));
const RemindersPage = React.lazy(() => import('./pages/RemindersPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const TasksPage = React.lazy(() => import('./pages/TasksPage'));
const WorkflowPage = React.lazy(() => import('./pages/WorkflowPage'));
const LivePreviewPage = React.lazy(() => import('./pages/LivePreviewPage'));
const DecisionRoomPage = React.lazy(() => import('./pages/DecisionRoomPage'));

// Auth guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main layout with sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useStore((state) => state.theme);
  const language = useStore((state) => state.language);
  const c = getTheme(theme);
  
  return (
    <div 
      className={`h-screen flex ${c.bg}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

function App() {
  const theme = useStore((state) => state.theme);
  const initialize = useStore((state) => state.initialize);
  const isLoading = useStore((state) => state.isLoading);
  const c = getTheme(theme);
  
  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Apply theme to document
  useEffect(() => {
    // Set data-theme attribute for CSS
    document.documentElement.setAttribute('data-theme', theme);
    
    // Set background color on body
    const isDark = isDarkTheme(theme);
    document.body.style.backgroundColor = isDark ? '#0a0f1a' : theme === 'pink' ? '#fdf2f8' : '#f8fafc';
    document.body.style.color = isDark ? '#f1f5f9' : theme === 'pink' ? '#831843' : '#0f172a';
    
    // Update meta theme-color
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', isDark ? '#0a0f1a' : theme === 'pink' ? '#fdf2f8' : '#f8fafc');
  }, [theme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/chat" replace />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <MainLayout>
              <ChatPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/notes" element={
          <ProtectedRoute>
            <MainLayout>
              <NotesPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/memory" element={
          <ProtectedRoute>
            <MainLayout>
              <MemoryPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/agents" element={
          <ProtectedRoute>
            <MainLayout>
              <AgentsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/voice" element={
          <ProtectedRoute>
            <MainLayout>
              <VoiceCallPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/computer" element={
          <ProtectedRoute>
            <MainLayout>
              <ComputerUsePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/reminders" element={
          <ProtectedRoute>
            <MainLayout>
              <RemindersPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <MainLayout>
              <AdminPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/tasks" element={
          <ProtectedRoute>
            <MainLayout>
              <TasksPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/workflow" element={
          <ProtectedRoute>
            <MainLayout>
              <WorkflowPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/decision" element={
          <ProtectedRoute>
            <MainLayout>
              <DecisionRoomPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/live-preview" element={
          <ProtectedRoute>
            <MainLayout>
              <LivePreviewPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
      </Suspense>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: isDarkTheme(theme) ? '#1e293b' : '#ffffff',
            color: isDarkTheme(theme) ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${isDarkTheme(theme) ? '#334155' : '#e2e8f0'}`,
          },
        }}
      />
    </Router>
  );
}

export default App;
