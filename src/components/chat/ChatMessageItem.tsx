import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Eye, Bot, Code, Palette, Briefcase, Sparkles } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { downloadFile } from '../../services/ai';
import { ChatMessage } from '../../services/ai';

interface GeneratedFile {
  blob: Blob;
  filename: string;
  type: string;
}

interface ChatMessageItemProps {
  msg: ChatMessage;
  isArabic: boolean;
  onSpeak: (text: string) => void;
  onPreview: (content: string) => void;
}

const AgentBadge: React.FC<{ name: string }> = ({ name }) => {
  let color = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  let icon = <Bot size={12} />;

  if (name.includes('Coder') || name.includes('Dev')) {
    color = 'bg-green-500/20 text-green-400 border-green-500/30';
    icon = <Code size={12} />;
  } else if (name.includes('Designer') || name.includes('Creative')) {
    color = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    icon = <Palette size={12} />;
  } else if (name.includes('Manager') || name.includes('Leader')) {
    color = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    icon = <Briefcase size={12} />;
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium mb-2 w-fit ${color}`}>
      {icon}
      <span>{name}</span>
    </div>
  );
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg, isArabic, onSpeak, onPreview }) => {
  // Check if message has agent handoff tag
  const agentMatch = msg.content.match(/\[AGENT:\s*([^\]]+)\]/i);
  const agentName = agentMatch ? agentMatch[1].trim() : null;
  const displayContent = msg.content.replace(/\[AGENT:\s*[^\]]+\]/gi, '').trim();

  return (
    <div
      className={`flex ${msg.role === 'user' ? (isArabic ? 'justify-start' : 'justify-end') : (isArabic ? 'justify-end' : 'justify-start')}`}
    >
      <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative overflow-hidden ${
        msg.role === 'user'
          ? 'bg-[#001d3d] border border-blue-900/30 text-blue-100'
          : 'bg-[#111] border border-gray-800 text-gray-200'
      }`}>
        {/* Agent Badge (if detected) */}
        {agentName && <AgentBadge name={agentName} />}

        {/* Voice indicator */}
        {msg.isVoice && (
          <div className="text-xs opacity-70 mb-2 flex items-center gap-1">
            🎤 {isArabic ? 'رسالة صوتية' : 'Voice message'}
          </div>
        )}
        
        {/* Image Attachments Preview */}
        {msg.attachments && msg.attachments.filter((a: any) => a.type === 'image').map((att: any, i: number) => (
          <div key={i} className="mb-3">
            {att.preview && (
              <img src={att.preview} alt="" className="max-h-64 rounded-xl" />
            )}
          </div>
        ))}
        
        {/* Other Attachments */}
        {msg.attachments && msg.attachments.filter((a: any) => a.type !== 'image').length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {msg.attachments.filter((a: any) => a.type !== 'image').map((att: any, i: number) => (
              <div key={i} className="text-xs bg-black/20 rounded-full px-3 py-1">
                📎 {att.name || att}
              </div>
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="markdown-content leading-relaxed text-sm">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '');
                const value = String(children).replace(/\n$/, '');
                
                if (!inline && match) {
                  return <CodeBlock language={match[1]} value={value} />;
                }
                
                return (
                  <code className={`${className} bg-black/20 rounded px-1 py-0.5 text-orange-300 font-mono text-xs`} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
        
        {/* Download Zip Button if multiple files detected */}
        {msg.content.includes('```') && (msg.content.match(/```/g) || []).length >= 4 && (
          <button
            onClick={async () => {
              const zip = new JSZip();
              const codeBlocks = msg.content.matchAll(/```(\w+)?\n([\s\S]*?)```/g);
              let count = 0;
              for (const match of codeBlocks) {
                const ext = match[1] || 'txt';
                const content = match[2];
                // Try to find filename
                const firstLine = content.split('\n')[0].trim();
                let filename = `file_${count}.${ext}`;
                if (firstLine.startsWith('//') || firstLine.startsWith('#') || firstLine.startsWith('<!--')) {
                  const nameMatch = firstLine.match(/[\w-]+\.\w+/);
                  if (nameMatch) filename = nameMatch[0];
                }
                zip.file(filename, content);
                count++;
              }
              if (count > 0) {
                const blob = await zip.generateAsync({ type: 'blob' });
                saveAs(blob, 'project_files.zip');
              }
            }}
            className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 rounded-xl transition-all w-full justify-center"
          >
            <Download size={16} />
            {isArabic ? 'تحميل الكل (ZIP)' : 'Download All as Zip'}
          </button>
        )}
        
        {/* Generated Files */}
        {msg.generatedFiles && msg.generatedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            {msg.generatedFiles.map((file: GeneratedFile, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/10 hover:bg-black/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  {file.type === 'pdf' ? <span className="text-xl">📄</span> : 
                   file.type === 'excel' ? <span className="text-xl">📊</span> :
                   file.type === 'image' ? <span className="text-xl">🖼️</span> :
                   file.type === 'audio' ? <span className="text-xl">🔊</span> :
                   <span className="text-xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{file.filename}</div>
                  <div className="text-xs opacity-60">Ready to download</div>
                </div>
                
                {/* Preview Button (for supported types) */}
                {(file.type === 'pdf' || file.type === 'image' || file.type === 'audio') && (
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(file.blob);
                      window.open(url, '_blank');
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye size={18} />
                  </button>
                )}
                
                {/* Download Button */}
                <button
                  onClick={() => downloadFile(file.blob, file.filename)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Provider info + Speak button */}
        {msg.role === 'assistant' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSpeak(displayContent)}
                className="text-sm opacity-60 hover:opacity-100 transition-all flex items-center gap-1"
              >
                🔊 {isArabic ? 'استمع' : 'Listen'}
              </button>
              
              {/* Live Preview Button - ENHANCED */}
              {(msg.content.includes('```html') || msg.content.includes('```react') || msg.content.includes('```jsx') || msg.content.includes('```tsx')) && (
                <button
                  onClick={() => onPreview(msg.content)}
                  className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all"
                >
                  <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></span>
                  <Eye size={14} className="relative z-10" />
                  <span className="relative z-10 text-xs">{isArabic ? 'معاينة التطبيق' : 'OPEN PREVIEW'}</span>
                </button>
              )}
            </div>

            {msg.provider && (
              <span className="text-xs opacity-40">
                {msg.provider} • {msg.model}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
