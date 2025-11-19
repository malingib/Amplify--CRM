
import React, { useState } from 'react';
import { Task, TeamMember } from '../types';
import { Plus, MoreHorizontal, Clock, Search, Filter } from 'lucide-react';

const initialTasks: Task[] = [
    { id: '1', title: 'Prepare Q3 Financial Report', description: 'Review revenue streams and expenses.', assigneeId: '1', dueDate: '2025-10-20', priority: 'High', status: 'To Do' },
    { id: '2', title: 'Client Meeting with Safaricom', description: 'Discuss the new API integration proposal.', assigneeId: '1', dueDate: '2025-10-21', priority: 'High', status: 'In Progress' },
    { id: '3', title: 'Update CRM Database', description: 'Clean up duplicate contacts.', assigneeId: '2', dueDate: '2025-10-25', priority: 'Low', status: 'To Do' },
    { id: '4', title: 'Draft Newsletter', description: 'Monthly update for stakeholders.', assigneeId: '3', dueDate: '2025-10-22', priority: 'Medium', status: 'Done' },
];

const teamMembers: TeamMember[] = [
    { id: '1', name: 'Eva Robinson', role: 'Admin', email: 'eva@company.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', status: 'Active' },
    { id: '2', name: 'John Doe', role: 'Sales', email: 'john@company.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', status: 'Active' },
    { id: '3', name: 'Jane Smith', role: 'Manager', email: 'jane@company.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', status: 'Offline' },
];

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [filter, setFilter] = useState('All');

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
                    <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm hover:shadow-md hover:border-slate-300 text-sm">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 ring-2 ring-slate-100 text-sm">
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
                                        {tasks.filter(t => t.status === col).length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-white rounded-full transition"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>

                            <div className="flex-1 bg-slate-100/50 rounded-[32px] p-4 space-y-4 border border-slate-200/60 overflow-y-auto custom-scrollbar">
                                {tasks.filter(t => t.status === col).map(task => {
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
                                                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wide">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Oct 20</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold text-xs hover:border-slate-300 hover:text-slate-600 hover:bg-white transition flex items-center justify-center gap-2 group">
                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add New Task
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Tasks;
