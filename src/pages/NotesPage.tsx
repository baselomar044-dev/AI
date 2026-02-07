// ============================================
// NOTES PAGE - Themed Properly
// ============================================

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { Plus, Search, Trash2, Save, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const NotesPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tryit-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('tryit-notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: isAr ? 'ملاحظة جديدة' : 'New Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (!selectedNote) return;
    
    const updatedNotes = notes.map(n => 
      n.id === selectedNote.id 
        ? { ...n, title: editTitle, content: editContent, updatedAt: new Date().toISOString() }
        : n
    );
    saveNotes(updatedNotes);
    setSelectedNote({ ...selectedNote, title: editTitle, content: editContent });
    setIsEditing(false);
    toast.success(isAr ? 'تم الحفظ' : 'Saved');
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    saveNotes(updatedNotes);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full flex ${c.bg}`}>
      {/* Notes List */}
      <div className={`w-80 ${c.bgSecondary} border-r ${c.border} flex flex-col`}>
        {/* Header */}
        <div className={`p-4 border-b ${c.border}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-xl font-bold ${c.text}`}>
              {isAr ? '📝 ملاحظاتي' : '📝 My Notes'}
            </h1>
            <button
              onClick={createNote}
              className={`p-2 rounded-lg ${c.gradient} text-white hover:opacity-90 transition`}
            >
              <Plus size={20} />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className={`w-full pl-10 pr-4 py-2 rounded-lg ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className={`text-center py-8 ${c.textMuted}`}>
              <FileText size={40} className="mx-auto mb-3 opacity-50" />
              <p>{isAr ? 'لا توجد ملاحظات' : 'No notes yet'}</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setEditTitle(note.title);
                  setEditContent(note.content);
                  setIsEditing(false);
                }}
                className={`
                  group p-3 rounded-xl cursor-pointer transition
                  ${selectedNote?.id === note.id 
                    ? `${c.sidebarActive} border ${c.border}` 
                    : `${c.bgTertiary} hover:opacity-80`
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${c.text}`}>{note.title}</h3>
                    <p className={`text-sm truncate ${c.textMuted}`}>
                      {note.content || (isAr ? 'فارغ' : 'Empty')}
                    </p>
                    <p className={`text-xs mt-1 ${c.textMuted}`}>
                      {new Date(note.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`flex-1 text-xl font-bold bg-transparent ${c.text} focus:outline-none`}
                  autoFocus
                />
              ) : (
                <h2 className={`text-xl font-bold ${c.text}`}>{selectedNote.title}</h2>
              )}
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className={`p-2 rounded-lg ${c.bgTertiary} ${c.textSecondary} hover:opacity-80 transition`}
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={saveNote}
                      className={`p-2 rounded-lg ${c.gradient} text-white hover:opacity-90 transition`}
                    >
                      <Save size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`px-4 py-2 rounded-lg ${c.gradient} text-white hover:opacity-90 transition`}
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </button>
                )}
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={isAr ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                  className={`w-full h-full resize-none bg-transparent ${c.text} focus:outline-none`}
                />
              ) : (
                <div className={`whitespace-pre-wrap ${c.text}`}>
                  {selectedNote.content || (
                    <span className={c.textMuted}>{isAr ? 'ملاحظة فارغة' : 'Empty note'}</span>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${c.textMuted}`}>
            <div className="text-center">
              <FileText size={60} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">{isAr ? 'اختر ملاحظة أو أنشئ واحدة جديدة' : 'Select a note or create a new one'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
