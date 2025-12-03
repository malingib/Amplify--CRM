
import React, { useState } from 'react';
import { 
    Bell, Lock, User, Globe, Moon, Shield, Users, Check, Search, Filter, 
    MoreHorizontal, Plus, X, ToggleRight, ToggleLeft, Save, AlertCircle, 
    CheckCircle2, Layout, Zap, FileText, CreditCard, Smartphone, Mail, 
    MessageSquare, Building2, BarChart2, HardDrive, Cpu, TrendingUp, Download, PieChart, ArrowUpRight, Sliders, ShieldCheck, Send, Edit3, Trash2, Key, RefreshCw, PenTool, Image as ImageIcon, Eye, Laptop, Monitor, LogOut, Loader2
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
    { id: 3, device: 'Firefox / Windows 11', ip: '41.89.200.5', location: 'Nakuru, KE', active: '1 day ago' },
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

    // Ensure objects exist
    if (!localConfig.notifications) {
        localConfig.notifications = {
            leadAssigned: { email: true, sms: false, inApp: true },
            invoicePaid: { email: true, sms: true, inApp: true },
            taskDue: { email: false, sms: false, inApp: true },
            systemUpdate: { email: true, sms: false, inApp: true },
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

    // Mock Permissions State
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
        // Save new integration forms into main config
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
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-white relative custom-scrollbar">
                    
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

                    {/* Placeholder for other tabs if they were selected in the full app context */}
                    {activeTab !== 'integrations' && (
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
        </div>
    );
};

export default Settings;
