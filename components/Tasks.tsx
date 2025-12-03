
import React, { useState } from 'react';
import { Task, TeamMember } from '../types';
import { Plus, MoreHorizontal, Clock, Search, Filter, X, Save, Bell, Smartphone, CalendarCheck, Loader2 } from 'lucide-react';
import { scheduleSmsReminder } from '../services/smsService';

const initialTasks: Task[] = [
    { id: '1', title: 'Prepare Q3 Financial Report', description: 'Review revenue streams and expenses.', assigneeId: '1', dueDate: '2025-10-20', priority: 'High', status: 'To Do' },
    { id: '2', title: 'Client Meeting with Safaricom', description: 'Discuss the new API integration proposal.', assigneeId: '1', dueDate: '2025-10-21', priority: 'High', status: 'In Progress' },
    { id: '3', title: 'Update CRM Database', description: 'Clean up duplicate contacts.', assigneeId: '2', dueDate: '2025-10-25', priority: 'Low', status: 'To Do' },
    { id: '4', title: 'Draft Newsletter', description: 'Monthly update for stakeholders.', assigneeId: '3', dueDate: '2025-10-22', priority: 'Medium', status: 'Done' },
];

const teamMembers: TeamMember[] = [
    { id: '1', name: 'Eva Robinson', role: 'Admin', email: 'eva@company.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', status: 'Active', phone: '+254711000001' },
    { id: '2', name: 'John Doe', role: 'Sales', email: 'john@company.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', status: 'Active', phone: '+254711000002' },
    { id: '3', name: 'Jane Smith', role: 'Manager', email: 'jane@company.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', status: 'Offline', phone: '+254711000003' },
];

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Filter State
    const [priorityFilter, setPriorityFilter] = useState<'All' | 'High'>('All');
    
    // Form State
    const [newTask, setNewTask] = useState<Partial<Task>>({
        title: '', description: '', assigneeId: '1', priority: 'Medium', status: 'To Do', dueDate: ''
    });
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderPhone, setReminderPhone] = useState('');
    const [reminderTime, setReminderTime] = useState('');

    const getAssignee = (id: string) => teamMembers.find(m => m.id === id);

    const columns = ['To Do', 'In Progress', 'Done'];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-700 border-red-100 ring-1 ring-red-50';
            case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-100 ring-1 ring-orange-50';
            case 'Low': return 'bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-50';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const assigneeId = e.target.value;
        const assignee = teamMembers.find(m => m.id === assigneeId);
        setNewTask({ ...newTask, assigneeId });
        if (assignee?.phone) {
            setReminderPhone(assignee.phone);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title) return;
        setIsSaving(true);

        const taskToAdd: Task = {
            id: Date.now().toString(),
            title: newTask.title!,
            description: newTask.description || '',
            assigneeId: newTask.assigneeId || '1',
            dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
            priority: newTask.priority as any || 'Medium',
            status: newTask.status as any || 'To Do',
            reminderSet: reminderEnabled,
            reminderPhone: reminderPhone,
            reminderTime: reminderTime
        };

        // Trigger SMS API if enabled
        if (reminderEnabled && reminderPhone && reminderTime) {
            const message = `Reminder: Task "${taskToAdd.title}" is due on ${taskToAdd.dueDate}. Please ensure it is completed on time.`;
            try {
               const result = await scheduleSmsReminder(reminderPhone, message, reminderTime);
               if (result.status === 'success') {
                   console.log('SMS Scheduled successfully');
               } else {
                   console.error('Failed to schedule SMS', result.message);
               }
            } catch (e) {
                console.error('SMS Error', e);
            }
        }

        setTasks([...tasks, taskToAdd]);
        
        // Reset and close
        setIsSaving(false);
        setIsAddModalOpen(false);
        setNewTask({ title: '', description: '', assigneeId: '1', priority: 'Medium', status: 'To Do', dueDate: '' });
        setReminderEnabled(false);
        setReminderPhone('');
        setReminderTime('');
    };

    const filteredTasks = tasks.filter(t => priorityFilter === 'All' || t.priority === priorityFilter);

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto pb-20 h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Track and manage team deliverables.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative hidden md:block group">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input type="text" placeholder="Search tasks..." className="pl-10 pr-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none text-sm font-semibold w-64 transition-all" />
                    </div>
                    <button 
                        onClick={() => setPriorityFilter(priorityFilter === 'All' ? 'High' : 'All')}
                        className={`px-5 py-3 border text-slate-700 font-semibold rounded-xl transition flex items-center gap-2 shadow-sm text-sm ${priorityFilter === 'High' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-4 h-4" /> {priorityFilter === 'High' ? 'High Priority Only' : 'Filter Priority'}
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 ring-2 ring-slate-100 text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Task
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[1000px] h-full">
                    {columns.map(col => (
                        <div key={col} className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-sm text-slate-900 tracking-wide uppercase">{col}</h3>
                                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {filteredTasks.filter(t => t.status === col).length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-white rounded-full transition"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>

                            <div className="flex-1 bg-slate-100/50 rounded-[32px] p-4 space-y-4 border border-slate-200/60 overflow-y-auto custom-scrollbar">
                                {filteredTasks.filter(t => t.status === col).map(task => {
                                    const assignee = getAssignee(task.assigneeId);
                                    return (
                                        <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:shadow-slate-200/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                            
                                            <h4 className="font-bold text-slate-900 mb-2 leading-snug text-base tracking-tight">{task.title}</h4>
                                            {task.description && <p className="text-xs text-slate-500 mb-5 line-clamp-2 font-medium leading-relaxed">{task.description}</p>}
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <img src={assignee?.avatar} className="w-8 h-8 rounded-full object-cover border-[2px] border-slate-100 shadow-sm" alt={assignee?.name} />
                                                    <span className="text-[11px] font-semibold text-slate-700">{assignee?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {task.reminderSet && (
                                                        <div className="text-emerald-500" title="SMS Reminder Set">
                                                            <Bell className="w-3.5 h-3.5 fill-emerald-500" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wide">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{task.dueDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold text-xs hover:border-slate-300 hover:text-slate-600 hover:bg-white transition flex items-center justify-center gap-2 group"
                                >
                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add New Task
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Task Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                         <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Task</h3>
                            <p className="text-slate-500 font-medium mt-1 text-sm">Assign a new task to a team member.</p>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Task Title</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    placeholder="e.g. Finalize Budget"
                                    value={newTask.title}
                                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Assignee</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newTask.assigneeId}
                                        onChange={handleAssigneeChange}
                                    >
                                        {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Due Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Description</label>
                                <textarea 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[80px] resize-none"
                                    placeholder="Add details..."
                                    value={newTask.description}
                                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                                />
                            </div>

                            {/* SMS Notifications Section */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${reminderEnabled ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">SMS Notification</p>
                                            <p className="text-[10px] text-slate-500 font-bold">Powered by Mobiwave</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReminderEnabled(!reminderEnabled)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${reminderEnabled ? 'bg-slate-900' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>

                                {reminderEnabled && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Recipient Phone</label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="tel" 
                                                    placeholder="+254..."
                                                    className="w-full pl-9 p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                                    value={reminderPhone}
                                                    onChange={e => setReminderPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Reminder Time</label>
                                            <div className="relative">
                                                <CalendarCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="datetime-local" 
                                                    className="w-full pl-9 p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs"
                                                    value={reminderTime}
                                                    onChange={e => setReminderTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Priority</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newTask.priority}
                                        onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Status</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newTask.status}
                                        onChange={e => setNewTask({...newTask, status: e.target.value as any})}
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                            <button onClick={handleAddTask} disabled={isSaving} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Saving...' : 'Save Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
