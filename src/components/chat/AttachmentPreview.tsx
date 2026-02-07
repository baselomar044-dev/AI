import React from 'react';

export interface Attachment {
  id: string;
  file: File;
  preview?: string;
  base64?: string;
  type: 'image' | 'audio' | 'document' | 'other';
}

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-wrap gap-3">
        {attachments.map(att => (
          <div key={att.id} className="relative group">
            {att.type === 'image' && att.preview ? (
              <img src={att.preview} alt="" className="h-20 w-20 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600" />
            ) : (
              <div className="h-20 w-20 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center text-2xl">
                {att.type === 'audio' ? '🎵' : att.type === 'document' ? '📄' : '📎'}
              </div>
            )}
            <button
              onClick={() => onRemove(att.id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-gray-400 border border-gray-700 rounded-full text-sm shadow-lg hover:bg-gray-700 hover:text-white transition-all"
            >
              ✕
            </button>
            <div className="text-xs truncate w-20 text-center mt-1">{att.file.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
