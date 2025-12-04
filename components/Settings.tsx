
import React, { useState } from 'react';
import { 
    Bell, Lock, User, Globe, Moon, Shield, Users, Check, Search, Filter, 
    MoreHorizontal, Plus, X, ToggleRight, ToggleLeft, Save, AlertCircle, 
    CheckCircle2, Layout, Zap, FileText, CreditCard, Smartphone, Mail, 
    MessageSquare, Building2, BarChart2, HardDrive, Cpu, TrendingUp, Download, PieChart, ArrowUpRight, Sliders, ShieldCheck, Send, Edit3, Trash2, Key, RefreshCw, PenTool, Image as ImageIcon, Eye, Laptop, Monitor, LogOut, Loader2, Fingerprint, Receipt, Clock
} from 'lucide-react';
import { TeamMember, SystemConfig } from '../types';
import { useToast } from './Toast';

const initialTeam: TeamMember[] = [
    { id: '1', name: 'Eva Robinson', role: 'Admin', email: 'eva@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', status: 'Active' },
    { id: '2', name: 'Liam Johnson', role: 'Sales', email: 'liam@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', status: 'Away' },
    { id: '3', name: 'Sarah Williams', role: 'Manager', email: 'sarah@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', status: 'Active' },
    { id: '4', name: 'Michael Brown', role: 'Viewer', email: 'mike@alabamamachinery.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', status: 'Offline' },
];

const mockTemplates = [
    { id: 1, name: 'Invoice Overdue', channel: 'Email', content: 'Dear {Client}, your invoice {InvoiceNo} is overdue. Please remit payment immediately.' },
    { id: 2, name: 'Welcome Message', channel: 'SMS', content: 'Habari {Client}! Welcome to Amplify. We are excited to work with you.' },
    { id: 3, name: 'Proposal Follow-up', channel: 'Email', content: 'Hi {Client}, just checking in on the proposal I sent last week.' },
];

const initialSessions = [
    { id: 1, device: 'Chrome / macOS', ip: '102.44.12.1', location: 'Nairobi, KE', active: 'Current Session' },
    { id: 2, device: 'Safari / iPhone 14', ip: '196.201.33.2', location: 'Mombasa, KE', active: '2 hours ago' },
    { id: '3', device: 'Firefox / Windows 11', ip: '41.89.200.5', location: 'Nakuru, KE', active: '1 day ago' },
];

interface SettingsProps {
    systemConfig?: SystemConfig;
    onUpdateConfig?: (config: SystemConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ systemConfig, onUpdateConfig }) => {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('configuration');
    const [team, setTeam] = useState<TeamMember[]>(initialTeam);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Viewer');
    const [isSaving, setIsSaving] = useState(false);
    
    // Config State Local Fallback
    const [localConfig, setLocalConfig] = useState<SystemConfig>(systemConfig || {
        modules: { leadAcquisition: true, compliance: true, bulkSms: true, telegram: true },
        crm: { autoConvert: false, stagnationAlertDays: 7, defaultView: 'board' },
        finance: { vatRate: 16, invoiceDueDays: 14, currency: 'KES' },
        security: { require2FA: true, sessionTimeout: 30 },
        workspace: { companyName: 'Alabama Machinery', timezone: 'EAT (UTC+3)', dateFormat: 'DD/MM/YYYY', primaryColor: '#4f46e5', kraPin: 'P051238491Z' },
        notifications: {
            leadAssigned: { email: true, sms: false, inApp: true },
            invoicePaid: { email: true, sms: true, inApp: true },
            taskDue: { email: false, sms: false, inApp: true },
            systemUpdate: { email: true, sms: false, inApp: true },
        },
        mpesaConfig: { consumerKey: '', consumerSecret: '', shortcode: '', passkey: '' },
        paystackConfig: { publicKey: '', secretKey: '' },
        mobiwaveConfig: { apiKey: '', senderId: '' }
    });

    // Ensure objects exist (Defensive Programming for Migration)
    if (!localConfig.notifications) {
        localConfig.notifications = {
            leadAssigned: { email: true, sms: false, inApp: true },
            invoicePaid: { email: true, sms: true, inApp: true },
            taskDue: { email: false, sms: false, inApp: true },
            systemUpdate: { email: true, sms: false, inApp: true },
        };
    }
    if (!localConfig.workspace) {
        localConfig.workspace = {
            companyName: 'Alabama Machinery',
            timezone: 'EAT (UTC+3)',
            dateFormat: 'DD/MM/YYYY',
            primaryColor: '#4f46e5',
            kraPin: 'P051238491Z'
        };
    }
    if (!localConfig.security) {
        localConfig.security = {
            require2FA: true,
            sessionTimeout: 30
        };
    }
    if (!localConfig.paystackConfig) localConfig.paystackConfig = { publicKey: '', secretKey: '' };
    if (!localConfig.mobiwaveConfig) localConfig.mobiwaveConfig = { apiKey: '', senderId: '' };

    // Integration Forms
    const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
    const [telegramForm, setTelegramForm] = useState({ botName: '', botToken: '', chatId: '' });
    const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
    const [mpesaForm, setMpesaForm] = useState({ consumerKey: '', consumerSecret: '', passkey: '', shortcode: '' });
    const [whatsAppWaitlist, setWhatsAppWaitlist] = useState(false);

    // New Integrations
    const [paystackForm, setPaystackForm] = useState({ publicKey: '', secretKey: '' });
    const [mobiwaveForm, setMobiwaveForm] = useState({ apiKey: '', senderId: '' });

    // Templates State
    const [templates, setTemplates] = useState(mockTemplates);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', channel: 'SMS', content: '' });

    // Security State
    const [sessions, setSessions] = useState(initialSessions);

    // Mock Permissions State (RBAC Matrix)
    const [permissionMode, setPermissionMode] = useState<'users' | 'roles'>('users');
    const [permissions, setPermissions] = useState({
        Admin: { finance: true, users: true, pipeline: true, settings: true, exports: true, delete: true },
        Manager: { finance: true, users: true, pipeline: true, settings: false, exports: true, delete: false },
        Sales: { finance: false, users: false, pipeline: true, settings: false, exports: false, delete: false },
        Viewer: { finance: false, users: false, pipeline: false, settings: false, exports: false, delete: false },
    });

    const togglePermission = (role: keyof typeof permissions, key: string) => {
        setPermissions(prev => ({
            ...prev,
            [role]: { ...prev[role], [key]: !prev[role][key as keyof typeof prev[typeof role]] }
        }));
    };

    const handleSaveConfig = () => {
        setIsSaving(true);
        const updatedConfig = { 
            ...localConfig, 
            paystackConfig: paystackForm.publicKey ? paystackForm : localConfig.paystackConfig,
            mobiwaveConfig: mobiwaveForm.apiKey ? mobiwaveForm : localConfig.mobiwaveConfig
        };
        
        if (onUpdateConfig) onUpdateConfig(updatedConfig);
        setTimeout(() => {
            setIsSaving(false);
            addToast('System configuration saved successfully.', 'success');
        }, 800);
    };

    const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
        const newConfig = {
            ...localConfig,
            [section]: {
                ...localConfig[section],
                [key]: value
            }
        };
        setLocalConfig(newConfig);
    };

    const updateNotificationConfig = (event: keyof NonNullable<SystemConfig['notifications']>, channel: 'email' | 'sms' | 'inApp') => {
        if (!localConfig.notifications) return;
        const newConfig = {
            ...localConfig,
            notifications: {
                ...localConfig.notifications,
                [event]: {
                    ...localConfig.notifications[event],
                    [channel]: !localConfig.notifications[event][channel]
                }
            }
        };
        setLocalConfig(newConfig);
    };

    const handleInviteMember = () => {
        if (!inviteEmail) return;
        const newMember: TeamMember = {
            id: `new-${Date.now()}`,
            name: inviteEmail.split('@')[0],
            email: inviteEmail,
            role: inviteRole as any,
            avatar: `https://ui-avatars.com/api/?name=${inviteEmail}&background=random`,
            status: 'Offline'
        };
        setTeam([...team, newMember]);
        setShowInviteModal(false);
        setInviteEmail('');
        addToast('Invitation sent successfully.', 'success');
    };

    const handleSaveTelegramConfig = () => {
        const newConfig = {
            ...localConfig,
            telegramConfig: {
                botToken: telegramForm.botToken,
                chatId: telegramForm.chatId,
                botName: telegramForm.botName
            }
        };
        setLocalConfig(newConfig);
        if (onUpdateConfig) onUpdateConfig(newConfig);
        setIsTelegramModalOpen(false);
        addToast('Telegram settings updated.', 'success');
    };

    const handleSaveMpesaConfig = () => {
        const newConfig = {
            ...localConfig,
            mpesaConfig: mpesaForm
        };
        setLocalConfig(newConfig);
        if (onUpdateConfig) onUpdateConfig(newConfig);
        setIsMpesaModalOpen(false);
        addToast('M-Pesa API credentials saved.', 'success');
    };

    const handleSaveTemplate = () => {
        if (!newTemplate.name || !newTemplate.content) return;
        setTemplates([...templates, { id: Date.now(), ...newTemplate }]);
        setIsTemplateModalOpen(false);
        setNewTemplate({ name: '', channel: 'SMS', content: '' });
        addToast('Template created successfully.', 'success');
    };

    const revokeSession = (id: number) => {
        if(confirm("Are you sure you want to revoke this session? The user will be logged out.")) {
            setSessions(sessions.filter(s => s.id !== id));
            addToast('Session revoked.', 'info');
        }
    };

    const logoutAllSessions = () => {
        if(confirm("This will log out all devices including this one. Continue?")) {
            const current = sessions.find(s => s.active === 'Current Session');
            setSessions(current ? [current] : []);
            addToast('All other sessions logged out.', 'info');
        }
    }

    const tabs = [
        { id: 'configuration', label: 'System Config', icon: Sliders },
        { id: 'workspace', label: 'Workspace', icon: Layout },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'team', label: 'Team Access', icon: Users },
        { id: 'integrations', label: 'Integrations', icon: Zap },
        { id: 'templates', label: 'Templates', icon: FileText },
        { id: 'billing', label: 'Usage & Billing', icon: CreditCard },
    ];

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto pb-24 h-[calc(100vh-2rem)] flex flex-col">
             <div className="mb-8 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage platform configuration and preferences.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col lg:flex-row ring-4 ring-slate-50">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 bg-slate-50/80 border-r border-slate-100 p-6 flex flex-col gap-2 overflow-y-auto backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-4">System</div>
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
                                 <p className="text-[10px] text-slate-500 font-bold mt-0.5">Admin</p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-white relative custom-scrollbar">
                    
                    {/* SYSTEM CONFIGURATION TAB */}
                    {activeTab === 'configuration' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                            {/* ... (Existing Config Code) ... */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Control global modules and operational defaults.</p>
                                </div>
                                <button 
                                    onClick={handleSaveConfig}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 text-sm flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                            
                            {/* ... (Existing Module Toggles) ... */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Active Modules</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { key: 'leadAcquisition', label: 'Lead Acquisition', desc: 'AI-driven web scraping and maps discovery.', icon: Search },
                                        { key: 'compliance', label: 'eTIMS Compliance', desc: 'KRA tax invoice integration and reporting.', icon: ShieldCheck },
                                        { key: 'bulkSms', label: 'Bulk SMS Marketing', desc: 'Campaign management and message templates.', icon: MessageSquare },
                                        { key: 'telegram', label: 'Telegram Copilot', desc: 'AI agent integration for natural language.', icon: Send },
                                    ].map((mod) => (
                                        <div key={mod.key} className={`p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                                            localConfig.modules[mod.key as keyof typeof localConfig.modules]
                                            ? 'bg-blue-50/50 border-blue-200' 
                                            : 'bg-white border-slate-200 opacity-70'
                                        }`}>
                                            <div className={`p-3 rounded-xl ${
                                                localConfig.modules[mod.key as keyof typeof localConfig.modules] ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                <mod.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h5 className="font-bold text-slate-900">{mod.label}</h5>
                                                    <button 
                                                        onClick={() => updateConfig('modules', mod.key, !localConfig.modules[mod.key as keyof typeof localConfig.modules])}
                                                        className={`relative transition-all duration-300 ${
                                                            localConfig.modules[mod.key as keyof typeof localConfig.modules] ? 'text-blue-600' : 'text-slate-300'
                                                        }`}
                                                    >
                                                        {localConfig.modules[mod.key as keyof typeof localConfig.modules] ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WORKSPACE TAB */}
                    {activeTab === 'workspace' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Workspace & Branding</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Identity and regional settings.</p>
                                </div>
                                <button onClick={handleSaveConfig} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm">Save Changes</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Organization Profile</h4>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 font-bold text-slate-900" value={localConfig.workspace.companyName} onChange={(e) => updateConfig('workspace', 'companyName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">KRA PIN (Compliance)</label>
                                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 font-bold text-slate-900" value={localConfig.workspace.kraPin} onChange={(e) => updateConfig('workspace', 'kraPin', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Brand Color</label>
                                        <div className="flex items-center gap-3 mt-1">
                                            <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent" value={localConfig.workspace.primaryColor} onChange={(e) => updateConfig('workspace', 'primaryColor', e.target.value)} />
                                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{localConfig.workspace.primaryColor}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Regional Settings</h4>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Timezone</label>
                                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 font-bold text-slate-900 text-sm">
                                            <option>EAT (UTC+3)</option>
                                            <option>GMT (UTC+0)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Date Format</label>
                                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 font-bold text-slate-900 text-sm">
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Currency</label>
                                        <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 font-bold text-slate-900 text-sm">
                                            <option>KES (Kenyan Shilling)</option>
                                            <option>USD (US Dollar)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Security Administration</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Manage sessions, 2FA, and access policies.</p>
                                </div>
                                <button onClick={logoutAllSessions} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                                    <LogOut className="w-4 h-4" /> Log Out All Devices
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Authentication Policies</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Fingerprint className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">Two-Factor Authentication (2FA)</p>
                                                <p className="text-xs text-slate-500">Enforce 2FA for all admin and finance roles.</p>
                                            </div>
                                        </div>
                                        <button onClick={() => updateConfig('security', 'require2FA', !localConfig.security.require2FA)} className={`${localConfig.security.require2FA ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {localConfig.security.require2FA ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">Session Timeout</p>
                                                <p className="text-xs text-slate-500">Auto-lock screen after inactivity.</p>
                                            </div>
                                        </div>
                                        <select 
                                            value={localConfig.security.sessionTimeout} 
                                            onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                                            className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold p-2"
                                        >
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="60">1 Hour</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Active Sessions</h4>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                                            <tr>
                                                <th className="p-4">Device</th>
                                                <th className="p-4">Location</th>
                                                <th className="p-4">Last Active</th>
                                                <th className="p-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sessions.map(session => (
                                                <tr key={session.id}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {session.device.includes('iPhone') ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Laptop className="w-4 h-4 text-slate-400" />}
                                                            <span className="text-sm font-bold text-slate-700">{session.device}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-xs font-medium text-slate-600">{session.location} <span className="text-slate-300">({session.ip})</span></td>
                                                    <td className="p-4">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${session.active === 'Current Session' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}>{session.active}</span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {session.active !== 'Current Session' && (
                                                            <button onClick={() => revokeSession(session.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded transition">Revoke</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Notification Center</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Configure alert channels for system events.</p>
                                </div>
                                <button onClick={handleSaveConfig} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm">Save Preferences</button>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                                        <tr>
                                            <th className="p-4 w-1/3">Event Type</th>
                                            <th className="p-4 text-center">Email</th>
                                            <th className="p-4 text-center">SMS</th>
                                            <th className="p-4 text-center">In-App</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { key: 'leadAssigned', label: 'New Lead Assigned' },
                                            { key: 'invoicePaid', label: 'Invoice Payment Received' },
                                            { key: 'taskDue', label: 'Task Deadline Approaching' },
                                            { key: 'systemUpdate', label: 'System Alerts & Maintenance' },
                                        ].map((row) => (
                                            <tr key={row.key}>
                                                <td className="p-4 text-sm font-bold text-slate-900">{row.label}</td>
                                                {['email', 'sms', 'inApp'].map((channel) => (
                                                    <td key={channel} className="p-4 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={localConfig.notifications?.[row.key as keyof typeof localConfig.notifications]?.[channel as 'email' | 'sms' | 'inApp']}
                                                            onChange={() => updateNotificationConfig(row.key as any, channel as any)}
                                                            className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TEAM TAB */}
                    {activeTab === 'team' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Team & Permissions</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Manage authorized officers and role-based access.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button onClick={() => setPermissionMode('users')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${permissionMode === 'users' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Users</button>
                                        <button onClick={() => setPermissionMode('roles')} className={`px-4 py-2 rounded-lg text-xs font-bold transition ${permissionMode === 'roles' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Roles & Rights</button>
                                    </div>
                                    {permissionMode === 'users' && (
                                        <button onClick={() => setShowInviteModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Invite Member
                                        </button>
                                    )}
                                </div>
                            </div>

                            {permissionMode === 'users' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {team.map(member => (
                                        <div key={member.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition">
                                            <img src={member.avatar} className="w-12 h-12 rounded-full border border-slate-100" alt={member.name} />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">{member.role}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{member.status}</span>
                                                </div>
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Role</th>
                                                <th className="p-4 text-center">Finance Access</th>
                                                <th className="p-4 text-center">User Mgmt</th>
                                                <th className="p-4 text-center">Pipeline Edit</th>
                                                <th className="p-4 text-center">Settings</th>
                                                <th className="p-4 text-center">Delete Records</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {Object.entries(permissions).map(([role, perms]) => (
                                                <tr key={role}>
                                                    <td className="p-4 font-bold text-slate-900 text-sm">{role}</td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={(perms as any).finance} onChange={() => togglePermission(role as any, 'finance')} className="rounded text-slate-900 focus:ring-slate-900" /></td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={(perms as any).users} onChange={() => togglePermission(role as any, 'users')} className="rounded text-slate-900 focus:ring-slate-900" /></td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={(perms as any).pipeline} onChange={() => togglePermission(role as any, 'pipeline')} className="rounded text-slate-900 focus:ring-slate-900" /></td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={(perms as any).settings} onChange={() => togglePermission(role as any, 'settings')} className="rounded text-slate-900 focus:ring-slate-900" /></td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={(perms as any).delete} onChange={() => togglePermission(role as any, 'delete')} className="rounded text-slate-900 focus:ring-slate-900" /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INTEGRATIONS TAB */}
                    {activeTab === 'integrations' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">External Integrations</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Connect third-party services and APIs.</p>
                                </div>
                                <button 
                                    onClick={handleSaveConfig}
                                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 text-sm flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Keys
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Paystack */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Paystack</h4>
                                            <p className="text-xs text-slate-500">Payments & Collections</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Public Key</label>
                                            <input 
                                                type="password" 
                                                value={paystackForm.publicKey || localConfig.paystackConfig?.publicKey}
                                                onChange={(e) => setPaystackForm({...paystackForm, publicKey: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="pk_live_..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Secret Key</label>
                                            <input 
                                                type="password" 
                                                value={paystackForm.secretKey || localConfig.paystackConfig?.secretKey}
                                                onChange={(e) => setPaystackForm({...paystackForm, secretKey: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="sk_live_..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mobiwave SMS */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">Mobiwave SMS</h4>
                                            <p className="text-xs text-slate-500">Bulk Messaging Gateway</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">API Key</label>
                                            <input 
                                                type="password" 
                                                value={mobiwaveForm.apiKey || localConfig.mobiwaveConfig?.apiKey}
                                                onChange={(e) => setMobiwaveForm({...mobiwaveForm, apiKey: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-100"
                                                placeholder="Enter API Key"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Sender ID</label>
                                            <input 
                                                type="text" 
                                                value={mobiwaveForm.senderId || localConfig.mobiwaveConfig?.senderId}
                                                onChange={(e) => setMobiwaveForm({...mobiwaveForm, senderId: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-100"
                                                placeholder="e.g. AMPLIFY"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* M-Pesa (Existing Mock) */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-90">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                                <Smartphone className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">M-Pesa Daraja</h4>
                                                <p className="text-xs text-slate-500">Mobile Money API</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsMpesaModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition">Configure</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">C2B Enabled</div>
                                        <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">B2C Enabled</div>
                                    </div>
                                </div>

                                {/* Telegram (Existing Mock) */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm opacity-90">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center">
                                                <Send className="w-6 h-6 text-sky-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Telegram Bot</h4>
                                                <p className="text-xs text-slate-500">AI Assistant Channel</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsTelegramModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition">Configure</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-[10px] font-bold">Bot Active</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TEMPLATES TAB */}
                    {activeTab === 'templates' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Communication Templates</h3>
                                    <p className="text-slate-500 mt-1 font-medium text-sm">Standardize messaging for SMS and Email.</p>
                                </div>
                                <button onClick={() => setIsTemplateModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> New Template
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map(t => (
                                    <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                {t.channel === 'Email' ? <Mail className="w-5 h-5 text-blue-500" /> : <MessageSquare className="w-5 h-5 text-emerald-500" />}
                                            </div>
                                            <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm mb-2">{t.name}</h4>
                                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg leading-relaxed line-clamp-3">
                                            {t.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/10">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Plan</p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h3 className="text-3xl font-bold">Enterprise</h3>
                                        <span className="text-sm font-medium text-slate-400">/ Yearly</span>
                                    </div>
                                    <div className="mt-6 flex gap-2">
                                        <button className="flex-1 bg-white text-slate-900 py-2 rounded-lg text-xs font-bold hover:bg-slate-100 transition">Manage</button>
                                        <button className="flex-1 bg-white/10 text-white py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition">Invoices</button>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seat Usage</p>
                                        <span className="text-xs font-bold text-slate-900">12 / 20 Users</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                                        <div className="bg-blue-600 h-full w-[60%]"></div>
                                    </div>
                                    <p className="text-xs text-slate-500">You have 8 seats remaining.</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMS Credits</p>
                                        <span className="text-xs font-bold text-slate-900">2,450 / 5,000</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                                        <div className="bg-emerald-500 h-full w-[49%]"></div>
                                    </div>
                                    <button className="text-xs font-bold text-blue-600 hover:underline">Top Up Credits</button>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg mb-4">Payment History</h4>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                                            <tr>
                                                <th className="p-4">Invoice</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Amount</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Download</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            <tr>
                                                <td className="p-4 text-sm font-bold text-slate-900">INV-2024-001</td>
                                                <td className="p-4 text-sm text-slate-600">Oct 1, 2024</td>
                                                <td className="p-4 text-sm font-bold text-slate-900">$499.00</td>
                                                <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-100">Paid</span></td>
                                                <td className="p-4 text-right"><Download className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer ml-auto" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs if they were selected in the full app context */}
                    {activeTab !== 'integrations' && activeTab !== 'configuration' && activeTab !== 'workspace' && activeTab !== 'security' && activeTab !== 'notifications' && activeTab !== 'team' && activeTab !== 'templates' && activeTab !== 'billing' && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Settings className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-medium">Select a settings category from the sidebar.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* M-Pesa Modal */}
            {isMpesaModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">M-Pesa Configuration</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Consumer Key" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={mpesaForm.consumerKey} onChange={e => setMpesaForm({...mpesaForm, consumerKey: e.target.value})} />
                            <input type="password" placeholder="Consumer Secret" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={mpesaForm.consumerSecret} onChange={e => setMpesaForm({...mpesaForm, consumerSecret: e.target.value})} />
                            <input type="text" placeholder="Shortcode / Paybill" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={mpesaForm.shortcode} onChange={e => setMpesaForm({...mpesaForm, shortcode: e.target.value})} />
                            <input type="password" placeholder="Passkey" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={mpesaForm.passkey} onChange={e => setMpesaForm({...mpesaForm, passkey: e.target.value})} />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsMpesaModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                            <button onClick={handleSaveMpesaConfig} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">Save Credentials</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Telegram Modal */}
            {isTelegramModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Telegram Bot Setup</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Bot Name (e.g. AmplifyBot)" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={telegramForm.botName} onChange={e => setTelegramForm({...telegramForm, botName: e.target.value})} />
                            <input type="password" placeholder="Bot Token (from @BotFather)" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={telegramForm.botToken} onChange={e => setTelegramForm({...telegramForm, botToken: e.target.value})} />
                            <input type="text" placeholder="Chat ID (Optional)" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none" value={telegramForm.chatId} onChange={e => setTelegramForm({...telegramForm, chatId: e.target.value})} />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsTelegramModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                            <button onClick={handleSaveTelegramConfig} className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition shadow-lg shadow-sky-500/20">Connect Bot</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {isTemplateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">New Communication Template</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Template Name</label>
                                <input type="text" className="w-full p-3 bg-slate-50 rounded-xl mt-1 text-sm font-bold border border-slate-200 outline-none" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="e.g. Sales Follow-up" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Channel</label>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => setNewTemplate({...newTemplate, channel: 'SMS'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newTemplate.channel === 'SMS' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>SMS</button>
                                    <button onClick={() => setNewTemplate({...newTemplate, channel: 'Email'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newTemplate.channel === 'Email' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>Email</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Content</label>
                                <textarea className="w-full p-3 bg-slate-50 rounded-xl mt-1 text-sm font-medium border border-slate-200 outline-none min-h-[120px]" value={newTemplate.content} onChange={e => setNewTemplate({...newTemplate, content: e.target.value})} placeholder="Use {ClientName} for dynamic insertion..." />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsTemplateModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                            <button onClick={handleSaveTemplate} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">Create Template</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Invite Team Member</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                                <input type="email" className="w-full p-3 bg-slate-50 rounded-xl mt-1 text-sm font-bold border border-slate-200 outline-none" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl mt-1 text-sm font-bold border border-slate-200 outline-none" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                                    <option value="Viewer">Viewer (Read Only)</option>
                                    <option value="Sales">Sales (Pipeline Access)</option>
                                    <option value="Manager">Manager (Reports & Approval)</option>
                                    <option value="Admin">Admin (Full Access)</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowInviteModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
                            <button onClick={handleInviteMember} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">Send Invite</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
