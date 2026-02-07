import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, Copy, Check } from 'lucide-react';
import { saveAs } from 'file-saver';

interface CodeBlockProps {
  language: string;
  value: string;
  filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, filename }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    saveAs(blob, filename || `code.${language || 'txt'}`);
  };

  // Detect filename from first line if not provided
  const detectedFilename = filename || (() => {
    const firstLine = value.split('\n')[0].trim();
    if (firstLine.startsWith('//') || firstLine.startsWith('#') || firstLine.startsWith('<!--')) {
      const match = firstLine.match(/[\w-]+\.\w+/);
      return match ? match[0] : null;
    }
    return null;
  })();

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-xs font-mono font-bold text-blue-400">
              {detectedFilename || language || 'Code'}
            </span>
          </button>
          {!isExpanded && (
            <span className="text-xs text-gray-500">
              {value.split('\n').length} lines
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownload}
            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded transition-all"
            title="Download File"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-all"
            title="Copy Code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 overflow-x-auto bg-[#1e1e1e]">
          <pre className="font-mono text-sm text-gray-300 leading-relaxed">
            <code>{value}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
