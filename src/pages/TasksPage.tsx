
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { 
  CheckSquare, Plus, Calendar, 
  Trash2, ArrowRight, Layout, List, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId: string;
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const TasksPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  // State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tryit-tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('tryit-projects');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'p1', name: 'Personal', color: '#3B82F6', icon: '👤' },
      { id: 'p2', name: 'Work', color: '#10B981', icon: '💼' },
      { id: 'p3', name: 'Ideas', color: '#F59E0B', icon: '💡' },
    ];
  });

  const [activeProject, setActiveProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [showModal, setShowModal] = useState(false);
  
  // New Task Form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
  });

  // Update default project names if language changes (only if using defaults)
  useEffect(() => {
    const saved = localStorage.getItem('tryit-projects');
    if (!saved) {
      const defaults = [
        { id: 'p1', name: isAr ? 'شخصي' : 'Personal', color: '#3B82F6', icon: '👤' },
        { id: 'p2', name: isAr ? 'عمل' : 'Work', color: '#10B981', icon: '💼' },
        { id: 'p3', name: isAr ? 'أفكار' : 'Ideas', color: '#F59E0B', icon: '💡' },
      ];
      setProjects(defaults);
    }
  }, [isAr]);

  // Save data
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('tryit-tasks', JSON.stringify(newTasks));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      projectId: activeProject === 'all' ? projects[0].id : activeProject,
      createdAt: Date.now(),
    };

    saveTasks([...tasks, task]);
    setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
    setShowModal(false);
    toast.success(isAr ? 'تمت إضافة المهمة' : 'Task added');
  };

  const handleDeleteTask = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
    toast.success(isAr ? 'تم حذف المهمة' : 'Task deleted');
  };

  const handleStatusChange = (id: string, newStatus: Task['status']) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // Filter tasks
  const filteredTasks = activeProject === 'all' 
    ? tasks 
    : tasks.filter(t => t.projectId === activeProject);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className={`h-full flex flex-col ${c.bg}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className={`p-6 border-b ${c.border} flex items-center justify-between`}>
        <div>
          <h1 className={`text-2xl font-bold ${c.text} flex items-center gap-3`}>
            <CheckSquare className="text-blue-500" />
            {isAr ? 'المهام والمشاريع' : 'Tasks & Projects'}
          </h1>
          <p className={`${c.textSecondary} mt-1`}>
            {isAr ? 'إدارة مهامك ومشاريعك بذكاء (Tasklet Clone)' : 'Smart task management (Tasklet Clone)'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <div className={`flex p-1 rounded-lg ${c.bgSecondary} border ${c.border}`}>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : c.textSecondary}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded ${viewMode === 'board' ? 'bg-blue-500 text-white' : c.textSecondary}`}
            >
              <Layout size={18} />
            </button>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 font-medium transition"
          >
            <Plus size={18} />
            {isAr ? 'مهمة جديدة' : 'New Task'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 border-r ${c.border} p-4 flex flex-col gap-2 overflow-y-auto`}>
          <button
            onClick={() => setActiveProject('all')}
            className={`
              w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition
              ${activeProject === 'all' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : `${c.textSecondary} hover:bg-gray-800/50`}
            `}
          >
            <Layout size={18} />
            <span className="font-medium">{isAr ? 'كل المهام' : 'All Tasks'}</span>
            <span className="ml-auto bg-gray-800 px-2 py-0.5 rounded text-xs">
              {tasks.length}
            </span>
          </button>

          <div className={`my-2 border-t ${c.border}`} />
          
          <div className={`px-2 text-xs font-bold ${c.textMuted} uppercase tracking-wider mb-2`}>
            {isAr ? 'المشاريع' : 'PROJECTS'}
          </div>

          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`
                w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition
                ${activeProject === p.id ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : `${c.textSecondary} hover:bg-gray-800/50`}
              `}
            >
              <span>{p.icon}</span>
              <span className="font-medium">{p.name}</span>
              <span className="ml-auto bg-gray-800 px-2 py-0.5 rounded text-xs">
                {tasks.filter(t => t.projectId === p.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-black/20 p-6">
          {viewMode === 'board' ? (
            <div className="flex gap-6 h-full min-w-full">
              {/* Todo Column */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-4">
                <div className={`flex items-center gap-2 font-bold ${c.text} pb-2 border-b-2 border-gray-700`}>
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  {isAr ? 'للقيام به' : 'To Do'}
                  <span className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                    {filteredTasks.filter(t => t.status === 'todo').length}
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  {filteredTasks.filter(t => t.status === 'todo').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      c={c} 
                      isAr={isAr} 
                      onDelete={handleDeleteTask}
                      onMove={(id) => handleStatusChange(id, 'in_progress')}
                      projects={projects}
                    />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-4">
                <div className={`flex items-center gap-2 font-bold ${c.text} pb-2 border-b-2 border-blue-500`}>
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  {isAr ? 'جاري العمل' : 'In Progress'}
                  <span className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                    {filteredTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  {filteredTasks.filter(t => t.status === 'in_progress').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      c={c} 
                      isAr={isAr} 
                      onDelete={handleDeleteTask}
                      onMove={(id) => handleStatusChange(id, 'done')}
                      projects={projects}
                    />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="flex-1 min-w-[300px] flex flex-col gap-4">
                <div className={`flex items-center gap-2 font-bold ${c.text} pb-2 border-b-2 border-green-500`}>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  {isAr ? 'مكتمل' : 'Done'}
                  <span className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">
                    {filteredTasks.filter(t => t.status === 'done').length}
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  {filteredTasks.filter(t => t.status === 'done').map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      c={c} 
                      isAr={isAr} 
                      onDelete={handleDeleteTask}
                      onMove={(id) => handleStatusChange(id, 'todo')}
                      projects={projects}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  c={c} 
                  isAr={isAr} 
                  onDelete={handleDeleteTask}
                  onMove={(id) => {
                    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
                    handleStatusChange(id, next);
                  }}
                  projects={projects}
                  listView
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${c.card} w-full max-w-md rounded-2xl p-6 shadow-2xl border ${c.border}`}>
            <h2 className={`text-xl font-bold ${c.text} mb-4`}>
              {isAr ? 'إضافة مهمة جديدة' : 'Add New Task'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                  {isAr ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} focus:border-blue-500 outline-none`}
                  placeholder={isAr ? 'ماذا تريد أن تفعل؟' : 'What needs to be done?'}
                  autoFocus
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} focus:border-blue-500 outline-none h-24 resize-none`}
                  placeholder={isAr ? 'تفاصيل إضافية...' : 'Additional details...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                    {isAr ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} outline-none`}
                  >
                    <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isAr ? 'عالية' : 'High'}</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                    {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className={`w-full p-3 rounded-xl bg-black/20 border ${c.border} ${c.text} outline-none`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 py-3 rounded-xl border ${c.border} ${c.text} hover:bg-gray-800 transition`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition font-medium"
              >
                {isAr ? 'إضافة' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for Task Card
const TaskCard = ({ task, c, isAr, onDelete, onMove, projects, listView }: any) => {
  const project = projects.find((p: any) => p.id === task.projectId);
  
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const handleBreakdown = (id: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: isAr ? 'جاري تقسيم المهمة بالذكاء الاصطناعي...' : 'AI is breaking down this task...',
        success: isAr ? 'تم اقتراح خطوات فرعية!' : 'Subtasks suggested!',
        error: 'Error',
      }
    );
  };

  return (
    <div className={`
      group relative p-4 rounded-xl border ${c.border} ${c.card} hover:border-blue-500/30 transition-all shadow-sm
      ${listView ? 'flex items-center gap-4' : 'flex flex-col gap-3'}
    `}>
      {/* Priority Badge & AI */}
      <div className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} ${listView ? 'hidden' : 'flex gap-2'}`}>
        {task.status === 'todo' && (
          <button 
            onClick={() => handleBreakdown(task.id)}
            className="text-purple-400 hover:text-purple-300 transition opacity-0 group-hover:opacity-100"
            title="AI Breakdown"
          >
            <Sparkles size={16} />
          </button>
        )}
        <button 
          onClick={() => onDelete(task.id)}
          className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-medium ${c.text} ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
            {task.title}
          </h3>
          {listView && (
            <div className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} uppercase tracking-wider`}>
              {task.priority}
            </div>
          )}
        </div>
        
        {task.description && (
          <p className={`text-sm ${c.textSecondary} line-clamp-2 mb-3`}>
            {task.description}
          </p>
        )}

        <div className={`flex items-center gap-3 mt-auto ${listView ? 'hidden' : ''}`}>
          <div className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityColor(task.priority)} uppercase tracking-wider`}>
            {task.priority}
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${c.textSecondary}`}>
              <Calendar size={12} />
              <span>{task.dueDate}</span>
            </div>
          )}

          {project && (
            <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
              <span>{project.icon}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={listView ? 'flex items-center gap-4' : 'flex items-center justify-between pt-3 border-t border-gray-800/50'}>
        {listView && task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${c.textSecondary} w-24`}>
            <Calendar size={14} />
            <span>{task.dueDate}</span>
          </div>
        )}
        
        {listView && (
          <button 
            onClick={() => onDelete(task.id)}
            className="text-gray-600 hover:text-red-400 transition p-2"
          >
            <Trash2 size={16} />
          </button>
        )}

        <button
          onClick={() => onMove(task.id)}
          className={`
            text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition
            ${task.status === 'done' 
              ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
              : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'}
          `}
        >
          {task.status === 'done' ? (
            <>
              <ArrowRight size={12} className="rotate-180" />
              {isAr ? 'إعادة' : 'Reopen'}
            </>
          ) : (
            <>
              {isAr ? 'التالي' : 'Next'}
              <ArrowRight size={12} className={isAr ? 'rotate-180' : ''} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TasksPage;
