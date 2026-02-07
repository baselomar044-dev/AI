
import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, RefreshCw, Smartphone, Monitor, Tablet, MousePointer, Hand, ZoomIn, ZoomOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LivePreviewPage: React.FC = () => {
  const { previewContent, theme } = useStore();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [interactionMode, setInteractionMode] = useState<'interact' | 'pan'>('interact');
  const [scale, setScale] = useState(1);
  const [key, setKey] = useState(0); // For forcing iframe refresh

  // If no content, redirect back
  useEffect(() => {
    if (!previewContent) {
      // Don't redirect immediately to avoid flickering if state is just slow
      // navigate('/chat');
    }
  }, [previewContent, navigate]);

  useEffect(() => {
    if (iframeRef.current && previewContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewContent);
        doc.close();
        
        // Inject script to enable communication if needed
        const script = doc.createElement('script');
        script.textContent = `
          window.addEventListener('message', (event) => {
            console.log('Preview received:', event.data);
          });
          // Capture clicks if needed
          document.addEventListener('click', (e) => {
            window.parent.postMessage({ type: 'click', x: e.clientX, y: e.clientY }, '*');
          });
        `;
        doc.head.appendChild(script);
      }
    }
  }, [previewContent, key]); // Refresh when key changes

  const isGemini = theme === 'gemini';

  if (!previewContent) {
    return (
      <div className={`h-full flex flex-col items-center justify-center gap-4 ${isGemini ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Loading preview...</p>
        <button onClick={() => navigate('/chat')} className="text-blue-400 hover:underline">
          Return to Chat
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${isGemini ? 'bg-[#050505]' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`h-14 border-b flex items-center justify-between px-4 ${isGemini ? 'bg-[#111] border-[#222]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/chat')}
            className={`p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 ${isGemini ? 'text-gray-300' : 'text-gray-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className={`font-bold ${isGemini ? 'text-white' : 'text-gray-800'}`}>
            Preview
          </h2>
        </div>

        {/* Simplified View Toggles */}
        <div className="flex items-center bg-[#222] rounded-lg p-1 border border-[#333]">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Monitor size={16} />
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Smartphone size={16} />
          </button>
        </div>

        <button 
          onClick={() => setKey(k => k + 1)}
          className={`p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 ${isGemini ? 'text-gray-300' : 'text-gray-600'}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#1e1e1e]">
        <div 
          className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden ${
            viewMode === 'desktop' ? 'w-full h-full rounded-lg' : 
            'w-[375px] h-[812px] rounded-[3rem] border-8 border-gray-800'
          }`}
        >
          <iframe
            key={key}
            ref={iframeRef}
            className="w-full h-full border-none bg-white"
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default LivePreviewPage;
