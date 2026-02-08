// ============================================
// REMINDERS PAGE - Themed Properly
// ============================================

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { Bell, Plus, Trash2, Check, Clock, Calendar, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Reminder {
  id: string;
  title: string;
  description: string;
  datetime: string;
  completed: boolean;
  createdAt: string;
}

const RemindersPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', datetime: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Load reminders
  useEffect(() => {
    const saved = localStorage.getItem('tryit-reminders');
    if (saved) {
      setReminders(JSON.parse(saved));
    }
  }, []);

  const saveReminders = (updated: Reminder[]) => {
    localStorage.setItem('tryit-reminders', JSON.stringify(updated));
    setReminders(updated);
  };

  const createReminder = () => {
    if (!formData.title.trim() || !formData.datetime) {
      toast.error(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveReminders([...reminders, newReminder]);
    setShowModal(false);
    setFormData({ title: '', description: '', datetime: '' });
    toast.success(isAr ? 'تم إنشاء التذكير' : 'Reminder created');
  };

  const toggleComplete = (id: string) => {
    const updated = reminders.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    saveReminders(reminders.filter(r => r.id !== id));
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'pending') return !r.completed;
    if (filter === 'completed') return r.completed;
    return true;
  }).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const pendingCount = reminders.filter(r => !r.completed).length;

  return (
    <div className={`h-full flex flex-col ${c.bg} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${c.gradient}`}>
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${c.text}`}>
              {isAr ? 'التذكيرات' : 'Reminders'}
            </h1>
            <p className={c.textSecondary}>
              {isAr ? `${pendingCount} تذكير قادم` : `${pendingCount} pending`}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className={`px-4 py-2 rounded-xl ${c.gradient} text-white flex items-center gap-2 hover:opacity-90 transition`}
        >
          <Plus size={18} />
          {isAr ? 'تذكير جديد' : 'New Reminder'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-xl transition
              ${filter === f 
                ? `${c.gradient} text-white` 
                : `${c.bgSecondary} ${c.textSecondary} hover:opacity-80`
              }
            `}
          >
            {f === 'all' && (isAr ? 'الكل' : 'All')}
            {f === 'pending' && (isAr ? 'قادم' : 'Pending')}
            {f === 'completed' && (isAr ? 'مكتمل' : 'Completed')}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredReminders.length === 0 ? (
          <div className={`text-center py-12 ${c.textMuted}`}>
            <Bell size={60} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">{isAr ? 'لا توجد تذكيرات' : 'No reminders'}</p>
            <button
              onClick={() => setShowModal(true)}
              className={`mt-4 px-4 py-2 rounded-xl ${c.gradient} text-white`}
            >
              {isAr ? 'إنشاء تذكير' : 'Create reminder'}
            </button>
          </div>
        ) : (
          filteredReminders.map(reminder => {
            const isPast = new Date(reminder.datetime) < new Date();
            const isUrgent = !reminder.completed && isPast;
            
            return (
              <div
                key={reminder.id}
                className={`
                  group p-4 rounded-xl border transition
                  ${reminder.completed 
                    ? `${c.bgSecondary} ${c.border} opacity-60` 
                    : isUrgent 
                      ? 'bg-red-500/10 border-red-500/30'
                      : `${c.bgSecondary} ${c.border}`
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(reminder.id)}
                    className={`
                      mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                      ${reminder.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : `${c.border} ${c.textSecondary} hover:border-green-500`
                      }
                    `}
                  >
                    {reminder.completed && <Check size={14} />}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`font-bold ${reminder.completed ? 'line-through' : ''} ${c.text}`}>
                      {reminder.title}
                    </h3>
                    {reminder.description && (
                      <p className={`text-sm ${c.textSecondary} mt-1`}>{reminder.description}</p>
                    )}
                    <div className={`flex items-center gap-4 mt-2 text-sm ${c.textMuted}`}>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(reminder.datetime).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(reminder.datetime).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md ${c.bgSecondary} rounded-2xl border ${c.border} shadow-2xl`}>
            {/* Modal Header */}
            <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${c.text}`}>
                {isAr ? 'تذكير جديد' : 'New Reminder'}
              </h2>
              <button onClick={() => setShowModal(false)} className={`p-2 rounded-lg ${c.bgTertiary} ${c.text}`}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'العنوان' : 'Title'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={isAr ? 'عنوان التذكير' : 'Reminder title'}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                  placeholder={isAr ? 'وصف إضافي...' : 'Additional description...'}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-2`}>
                  {isAr ? 'التاريخ والوقت' : 'Date & Time'} *
                </label>
                <input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl ${c.bgTertiary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${c.border} flex justify-end gap-3`}>
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl ${c.bgTertiary} ${c.text} hover:opacity-80 transition`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={createReminder}
                className={`px-4 py-2 rounded-xl ${c.gradient} text-white flex items-center gap-2 hover:opacity-90 transition`}
              >
                <Save size={18} />
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage;
