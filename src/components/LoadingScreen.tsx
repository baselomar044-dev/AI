// ============================================
// LOADING SCREEN - Try-It!
// Professional, clean loading experience
// ============================================

import React from 'react';

interface LoadingScreenProps {
  minimal?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ minimal = false }) => {
  if (minimal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10" />

      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">T!</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Assistant
        </h1>
        <p className="text-gray-400 mb-8">
          مساعدك الذكي
        </p>

        {/* Loading spinner */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>

        <p className="text-gray-500 text-sm">
          جاري تجهيز التطبيق...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
