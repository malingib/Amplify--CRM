
import React, { useState } from 'react';
import { Bell, Lock, User, Globe, Moon, Shield, Users, Check, Search, Filter, MoreHorizontal, Plus, X, ToggleRight, ToggleLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TeamMember } from '../types';

const initialTeam: TeamMember[] = [
    { id: '1', name: 'Eva Robinson', role: 'Admin', email: 'eva@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', status: 'Active' },
    { id: '2', name: 'Liam Johnson', role: 'Sales', email: 'liam@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', status: 'Away' },
    { id: '3', name: 'Sarah Williams', role: 'Manager', email: 'sarah@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', status: 'Active' },
    { id: '4', name: 'Michael Brown', role: 'Viewer', email: 'mike@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', status: 'Offline' },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('team');
    const [team, setTeam] = useState<TeamMember[]>(initialTeam);
    const [showInviteModal, setShowInviteModal] = useState(false);
    
    // Mock Permissions State
    const [permissions, setPermissions] = useState({
        Admin: { finance: true, users: true, pipeline: true, settings: true, exports: true },
        Manager: { finance: true, users: true, pipeline: true, settings: false, exports: true },
        Sales: { finance: false, users: false, pipeline: true, settings: false, exports: false },
        Viewer: { finance: false, users: false, pipeline: false, settings: false, exports: false },
    });

    const togglePermission = (role: keyof typeof permissions, key: string) => {
        setPermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [key]: !prev[role][key as keyof typeof prev[typeof role]] }
        }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'team', label: 'Team & Roles', icon: Users },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'billing', label: 'Billing', icon: Globe },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto pb-24 h-[calc(100vh-2rem)] flex flex-col">
             <div className="mb-8 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage workspace, team, and preferences.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col lg:flex-row ring-4 ring-slate-50">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 bg-slate-50/80 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">Configuration</div>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-xs transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]' 
                                    : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:shadow-slate-200/50'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                    
                    <div className="mt-auto pt-6 border-t border-slate-200/60 px-1">
                         <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition cursor-pointer border border-transparent hover:border-slate-100 group">
                             <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">ER</div>
                             <div>
                                 <p className="text-xs font-bold text-slate-900">Eva Robinson</p>
                                 <p className="text-[10px] text-slate-500 font-bold mt-0.5">Admin Workspace</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-white relative custom-scrollbar">
                    
                    {activeTab === 'team' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                            
                            {/* Section Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Team Members</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Manage access and assign roles to your team.</p>
                                </div>
                                <button 
                                    onClick={() => setShowInviteModal(true)}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Invite Member
                                </button>
                            </div>

                            {/* Team List */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/30 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between backdrop-blur-md">
                                    <div className="relative flex-1 min-w-[240px] max-w-sm group">
                                        <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                        <input type="text" placeholder="Search members..." className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all shadow-sm placeholder:font-medium" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm">
                                            <Filter className="w-4 h-4" /> Filter
                                        </button>
                                        <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm">
                                            <Save className="w-4 h-4" /> Export
                                        </button>
                                    </div>
                                </div>
                                
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {team.map(member => (
                                            <tr key={member.id} className="hover:bg-slate-50/60 transition duration-200 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <img src={member.avatar} className="w-10 h-10 rounded-full object-cover border-[2px] border-white shadow-sm" alt="" />
                                                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                                                member.status === 'Active' ? 'bg-emerald-500' :
                                                                member.status === 'Away' ? 'bg-amber-500' : 'bg-slate-400'
                                                            }`}></span>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                                                            <p className="text-slate-500 text-[11px] font-semibold mt-0.5 opacity-80">{member.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative inline-block">
                                                        <select 
                                                            className="appearance-none bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-800 py-2 pl-4 pr-10 rounded-xl cursor-pointer focus:ring-2 focus:ring-slate-900/10 outline-none transition shadow-sm"
                                                            defaultValue={member.role}
                                                        >
                                                            <option value="Admin">Admin</option>
                                                            <option value="Manager">Manager</option>
                                                            <option value="Sales">Sales</option>
                                                            <option value="Viewer">Viewer</option>
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                                        member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        member.status === 'Away' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            member.status === 'Active' ? 'bg-emerald-500' :
                                                            member.status === 'Away' ? 'bg-amber-500' : 'bg-slate-400'
                                                        }`}></span>
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-full text-slate-400 hover:text-slate-900 transition border border-transparent hover:border-slate-200 hover:shadow-sm ml-auto">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Permissions Matrix */}
                            <div className="pt-8 border-t border-slate-200/60">
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Role Permissions</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Define granular access levels for each role.</p>
                                </div>
                                
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/30 overflow-hidden">
                                    <div className="grid grid-cols-5 gap-4 p-6 border-b border-slate-100 bg-slate-50/80 font-bold text-[10px] text-slate-500 tracking-widest uppercase backdrop-blur-sm">
                                        <div className="text-slate-800 normal-case font-bold tracking-normal pl-2 text-xs">Permission Context</div>
                                        <div className="text-center flex items-center justify-center gap-2"><Shield className="w-3.5 h-3.5 text-slate-900" /> Admin</div>
                                        <div className="text-center flex items-center justify-center gap-2"><Users className="w-3.5 h-3.5 text-purple-600" /> Manager</div>
                                        <div className="text-center flex items-center justify-center gap-2"><Globe className="w-3.5 h-3.5 text-blue-500" /> Sales</div>
                                        <div className="text-center flex items-center justify-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /> Viewer</div>
                                    </div>
                                    
                                    {/* Permission Rows */}
                                    {[
                                        { key: 'finance', label: 'Financial Reports', desc: 'View revenue and payouts' },
                                        { key: 'users', label: 'User Management', desc: 'Invite and edit members' },
                                        { key: 'pipeline', label: 'Pipeline Access', desc: 'Create and move deals' },
                                        { key: 'settings', label: 'System Settings', desc: 'Configure preferences' },
                                        { key: 'exports', label: 'Data Export', desc: 'Download CSV/PDF' },
                                    ].map((perm, idx) => (
                                        <div key={perm.key} className={`grid grid-cols-5 gap-4 p-6 items-center transition hover:bg-slate-50/50 ${idx !== 4 && 'border-b border-slate-50'}`}>
                                            <div className="pl-2">
                                                <p className="font-bold text-slate-900 text-sm">{perm.label}</p>
                                                <p className="text-[10px] text-slate-500 font-semibold mt-1">{perm.desc}</p>
                                            </div>
                                            {['Admin', 'Manager', 'Sales', 'Viewer'].map((role) => (
                                                <div key={role} className="flex justify-center">
                                                    <button 
                                                        onClick={() => togglePermission(role as any, perm.key)}
                                                        className={`relative transition-all duration-300 hover:scale-110 active:scale-95 ${
                                                            permissions[role as keyof typeof permissions][perm.key as keyof (typeof permissions)['Admin']]
                                                            ? 'text-slate-900 drop-shadow-md' 
                                                            : 'text-slate-200'
                                                        }`}
                                                    >
                                                        {permissions[role as keyof typeof permissions][perm.key as keyof (typeof permissions)['Admin']] ? (
                                                            <ToggleRight className="w-10 h-10" />
                                                        ) : (
                                                            <ToggleLeft className="w-10 h-10" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl space-y-8">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">General Preferences</h3>
                                <p className="text-slate-500 mt-1 font-medium text-sm">Customize your workspace experience.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-slate-200/50 border border-slate-100">
                                            <Moon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-slate-900 tracking-tight">Appearance</p>
                                            <p className="text-sm text-slate-500 font-semibold mt-1">Switch between light and dark themes</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-slate-900 transition-colors shadow-inner"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Language</label>
                                        <div className="relative">
                                            <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition appearance-none shadow-sm text-sm">
                                                <option>English (US)</option>
                                                <option>Kiswahili</option>
                                                <option>French</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Timezone</label>
                                        <div className="relative">
                                            <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition appearance-none shadow-sm text-sm">
                                                <option>Nairobi (GMT+3)</option>
                                                <option>London (GMT+0)</option>
                                                <option>New York (GMT-5)</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {['notifications', 'security', 'billing'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-[50vh] animate-in fade-in zoom-in duration-500 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-slate-50/50">
                                <Lock className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Section Restricted</h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium text-sm">These settings are managed by your organization's administrator.</p>
                            <button className="mt-8 px-8 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-md shadow-slate-200/40 text-sm">
                                Contact Support
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal Overlay */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl p-10 w-full max-w-lg relative animate-in zoom-in-95 duration-300 border border-slate-200">
                        <button 
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition p-2 hover:bg-slate-50 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="mb-8 text-center">
                            <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-900/20 rotate-3">
                                <Plus className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Invite Member</h3>
                            <p className="text-slate-500 font-medium mt-2 text-sm">Send an invitation to join your workspace.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-2 uppercase tracking-widest">Email Address</label>
                                <input type="email" placeholder="colleague@company.com" className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition placeholder:text-slate-400 text-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-2 ml-2 uppercase tracking-widest">Assign Role</label>
                                <div className="relative">
                                    <select className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition appearance-none text-sm">
                                        <option value="Viewer">Viewer (Read Only)</option>
                                        <option value="Sales">Sales (Pipeline Access)</option>
                                        <option value="Manager">Manager (Team Access)</option>
                                        <option value="Admin">Admin (Full Access)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                            <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
                                Send Invite <Check className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
