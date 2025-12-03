
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Lead, DealStage, Message } from '../types';
import { Search, Send, Sparkles, List, Download, Filter, CheckCircle2, XCircle, Bot, ShieldAlert, History, User, Terminal, Cpu, Trash2, ChevronRight, Check, ChevronDown, FileText, HelpCircle, BarChart3, TrendingUp, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { interpretCrmCommand, qualifyLead } from '../services/geminiService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from 'recharts';

interface TelegramChatProps {
    leads?: Lead[];
    onUpdateLeads?: (leads: Lead[]) => void;
    userRole?: UserRole;
}

interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    status: 'Success' | 'Failed' | 'Denied';
    details: string;
    severity: 'Low' | 'Medium' | 'High';
}

const initialAuditLogs: AuditLogEntry[] = [
    { id: 'sys_log_003', timestamp: '2023-10-24 14:15:22', actor: 'Amplify AI', action: 'Lead Creation', status: 'Success', details: 'Created lead: TechSahara via command', severity: 'Medium' },
    { id: 'sys_log_004', timestamp: '2023-10-24 14:10:00', actor: 'System', action: 'Invoice Sent', status: 'Success', details: 'Invoice #INV-002 auto-generated', severity: 'Low' },
    { id: 'sys_log_005', timestamp: '2023-10-23 09:00:00', actor: 'System', action: 'Connection Error', status: 'Failed', details: 'External API timeout', severity: 'High' },
    { id: 'sys_log_006', timestamp: '2023-10-23 08:45:10', actor: 'Eva Robinson', action: 'Delete Attempt', status: 'Denied', details: 'Attempted to delete protected record', severity: 'High' },
    { id: 'sys_log_007', timestamp: '2023-10-23 08:30:00', actor: 'Amplify AI', action: 'System Status', status: 'Success', details: 'Diagnostic run completed', severity: 'Low' },
];

const TelegramChat: React.FC<TelegramChatProps> = ({ leads = [], onUpdateLeads, userRole = 'Admin' }) => {
    const [viewMode, setViewMode] = useState<'terminal' | 'audit'>('terminal');
    
    // Command Center State
    const [messages, setMessages] = useState<(Message & { type?: 'text' | 'chart' | 'analysis', data?: any })[]>([
        { 
            id: 'bot-init', 
            sender: 'bot', 
            text: `**Telegram Bridge v2.5**\nLogged in as: **${userRole}**\n\nI am your AI System Admin connected via Telegram Bot API. You can speak naturally to manage the CRM.\n\nType **Help** for a list of commands.`, 
            timestamp: new Date() 
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    // Audit State
    const [auditSearch, setAuditSearch] = useState('');
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);
    
    // Audit Filters
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed' | 'Denied'>('All');

    // Scroll to bottom on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, viewMode, isThinking]);

    // --- Helper: Add to Audit Log ---
    const addToAuditLog = (actor: string, action: string, status: 'Success' | 'Failed' | 'Denied', details: string, severity: 'Low' | 'Medium' | 'High') => {
        const newLog: AuditLogEntry = {
            id: `log_${Date.now()}`,
            timestamp: new Date().toLocaleString(),
            actor,
            action,
            status,
            details,
            severity
        };
        setAuditLogs(prev => [newLog, ...prev]);
    };

    // --- Helper: Download CSV ---
    const handleExportCSV = () => {
        const headers = ['ID,Timestamp,Actor,Action,Status,Severity,Details'];
        const rows = filteredAuditLogs.map(l => `${l.id},"${l.timestamp}",${l.actor},${l.action},${l.status},${l.severity},"${l.details}"`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_log_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- AI Bot Core Logic ---
    const processBotCommand = async (command: string) => {
        setIsThinking(true);
        
        const cleanCommand = command.toLowerCase().trim();

        // Local Commands
        if (cleanCommand === 'clear') {
            setMessages([{ id: 'bot-reset', sender: 'bot', text: 'Console cleared.', timestamp: new Date() }]);
            setIsThinking(false);
            return;
        }

        if (cleanCommand === 'help') {
            const helpText = `
**Amplify Copilot Command List**

**Lead Management:**
• "Add a lead for [Company] worth [Amount]"
• "Update [Company] status to [Stage]"
• "Delete the deal for [Company]"
• "Analyze [Company]" - **Deep BANT Analysis**

**Visualization:**
• "Show me the pipeline summary" - **Renders Chart**

**System Tools:**
• "Status" - Run system diagnostics
• "Clear" - Reset terminal
            `;
            setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: helpText.trim(), timestamp: new Date() }]);
            setIsThinking(false);
            return;
        }

        let responseText = "Processing...";
        let responseType: 'text' | 'chart' | 'analysis' = 'text';
        let responseData: any = null;
        let actionLog: Partial<AuditLogEntry> | null = null;

        try {
            // Step 1: Interpret Intent via AI
            const interpretation = await interpretCrmCommand(command, userRole!);
            const { intent, data, response_text } = interpretation;
            
            // Set initial response from AI
            responseText = response_text || "Command processed.";

            // Step 2: Execute Logic based on Intent
            switch (intent) {
                case 'CREATE_LEAD':
                    if (['Viewer'].includes(userRole!)) {
                        responseText = `🚫 **Access Denied**: Your role '${userRole}' cannot create records.`;
                        actionLog = { action: 'Create Lead', status: 'Denied', details: `User ${userRole} attempted creation`, severity: 'Medium' };
                    } else if (onUpdateLeads) {
                        const newLead: Lead = {
                            id: Date.now().toString(),
                            name: data.name || 'New Lead',
                            company: data.name || 'Unknown Company',
                            value: data.value || 50000,
                            stage: DealStage.INTAKE,
                            lastContact: new Date().toISOString().split('T')[0],
                            probability: 10,
                            avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
                            source: 'WhatsApp Bot',
                            order: leads.length
                        };
                        onUpdateLeads([...leads, newLead]);
                        responseText = `✅ **Success**: Added lead **${newLead.name}** (KES ${newLead.value.toLocaleString()}) to the pipeline.`;
                        actionLog = { action: 'Create Lead', status: 'Success', details: `Created ${newLead.name} val=${newLead.value}`, severity: 'Medium' };
                    }
                    break;

                case 'UPDATE_LEAD':
                    if (['Viewer'].includes(userRole!)) {
                        responseText = `🚫 **Access Denied**: Viewers cannot modify data.`;
                        actionLog = { action: 'Update Lead', status: 'Denied', details: `User ${userRole} attempted update`, severity: 'Medium' };
                    } else {
                        const targetLead = leads.find(l => 
                            l.name.toLowerCase().includes(data.name?.toLowerCase() || '') || 
                            l.company.toLowerCase().includes(data.name?.toLowerCase() || '')
                        );

                        if (!targetLead) {
                            responseText = `⚠️ I couldn't find a lead named "${data.name}". Please try again with the exact name.`;
                            actionLog = { action: 'Update Lead', status: 'Failed', details: `Lead ${data.name} not found`, severity: 'Low' };
                        } else if (onUpdateLeads) {
                            let updated = false;
                            const newLeads = leads.map(l => {
                                if (l.id === targetLead.id) {
                                    updated = true;
                                    const changes: any = {};
                                    if (data.field === 'value') changes.value = data.newValue;
                                    if (data.field === 'stage') changes.stage = data.newValue; 
                                    if (data.field === 'probability') changes.probability = data.newValue;
                                    return { ...l, ...changes };
                                }
                                return l;
                            });
                            
                            if (updated) {
                                onUpdateLeads(newLeads);
                                responseText = `✅ **Updated**: ${targetLead.name} ${data.field} changed to ${data.newValue}.`;
                                actionLog = { action: 'Update Lead', status: 'Success', details: `Updated ${targetLead.name} ${data.field}`, severity: 'Medium' };
                            }
                        }
                    }
                    break;

                case 'DELETE_LEAD':
                    if (['Viewer', 'Sales'].includes(userRole!)) {
                        responseText = `🚫 **Access Denied**: Role '${userRole}' is not authorized to delete records.`;
                        actionLog = { action: 'Delete Lead', status: 'Denied', details: `User ${userRole} attempted delete`, severity: 'High' };
                    } else {
                        const targetLead = leads.find(l => l.name.toLowerCase().includes(data.name?.toLowerCase() || ''));
                        if (targetLead && onUpdateLeads) {
                            onUpdateLeads(leads.filter(l => l.id !== targetLead.id));
                            responseText = `🗑️ **Deleted**: Removed **${targetLead.name}** from the pipeline.`;
                            actionLog = { action: 'Delete Lead', status: 'Success', details: `Deleted ${targetLead.name}`, severity: 'High' };
                        } else {
                            responseText = `⚠️ Could not find a lead to delete matching "${data.name}".`;
                        }
                    }
                    break;

                case 'QUERY_LEAD':
                    // Render a chart instead of just text
                    const stageCounts = leads.reduce((acc, curr) => {
                        acc[curr.stage] = (acc[curr.stage] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    const chartData = Object.keys(stageCounts).map(stage => ({ name: stage, value: stageCounts[stage] }));
                    
                    responseType = 'chart';
                    responseData = { data: chartData, title: 'Pipeline Distribution' };
                    responseText = "Here is the current pipeline distribution:";
                    actionLog = { action: 'Query System', status: 'Success', details: 'Generated visual pipeline summary', severity: 'Low' };
                    break;

                case 'ANALYZE_LEAD':
                    const leadToAnalyze = leads.find(l => l.name.toLowerCase().includes(data.name?.toLowerCase() || '') || l.company.toLowerCase().includes(data.name?.toLowerCase() || ''));
                    
                    if (leadToAnalyze) {
                        const analysis = await qualifyLead(leadToAnalyze.name, leadToAnalyze.company, leadToAnalyze.notes || '', leadToAnalyze.value);
                        responseType = 'analysis';
                        responseData = { ...analysis, leadName: leadToAnalyze.name, leadCompany: leadToAnalyze.company };
                        responseText = "Analysis Complete.";
                        actionLog = { action: 'AI Analysis', status: 'Success', details: `Analyzed ${leadToAnalyze.name}`, severity: 'Low' };
                    } else {
                        responseText = `⚠️ Could not find a lead named "${data.name}" to analyze.`;
                    }
                    break;

                case 'SYSTEM_STATUS':
                    responseText = `🖥️ **System Status**\n\n• **API Gateway**: 🟢 Online (24ms)\n• **Database**: 🟢 Healthy\n• **Telegram Bridge**: 🟢 Connected\n• **AI Agent**: 🟢 Active (v2.5)\n\nYour Role: **${userRole}**`;
                    actionLog = { action: 'System Check', status: 'Success', details: 'Ran diagnostics', severity: 'Low' };
                    break;

                default:
                    break;
            }

        } catch (e) {
            console.error(e);
            responseText = "❌ An internal error occurred while processing your command.";
            actionLog = { action: 'System Error', status: 'Failed', details: 'Exception in command processing', severity: 'High' };
        }

        const botMsg = { id: `bot-${Date.now()}`, sender: 'bot' as const, text: responseText, timestamp: new Date(), type: responseType, data: responseData };
        setMessages(prev => [...prev, botMsg]);
        
        if (actionLog) {
            addToAuditLog('Amplify AI', actionLog.action!, actionLog.status!, actionLog.details!, actionLog.severity!);
        }
        setIsThinking(false);
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newUserMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text: inputText, timestamp: new Date() };
        
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        
        processBotCommand(newUserMsg.text);
    };

    const handleQuickAction = (action: string) => {
        const msg = action;
        const newUserMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text: msg, timestamp: new Date() };
        setMessages(prev => [...prev, newUserMsg]);
        processBotCommand(msg);
    };

    const filteredAuditLogs = auditLogs.filter(log => {
        const matchesSearch = log.actor.toLowerCase().includes(auditSearch.toLowerCase()) || 
                              log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                              log.action.toLowerCase().includes(auditSearch.toLowerCase());
        const matchesSeverity = severityFilter === 'All' || log.severity === severityFilter;
        const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
        
        return matchesSearch && matchesSeverity && matchesStatus;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-6 lg:p-8 gap-6 max-w-[1800px] mx-auto">
            {/* Top Bar Switcher */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-500/20">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Command Center</h2>
                        <p className="text-slate-500 font-medium text-sm">Execute system commands via Telegram Bridge.</p>
                    </div>
                </div>
                <div className="flex p-1.5 bg-slate-100 rounded-xl">
                    <button 
                        onClick={() => setViewMode('terminal')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            viewMode === 'terminal' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Bot className="w-4 h-4" /> Command Terminal
                    </button>
                    <button 
                        onClick={() => setViewMode('audit')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${
                            viewMode === 'audit' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <List className="w-4 h-4" /> Audit Log
                    </button>
                </div>
            </div>

            {viewMode === 'terminal' ? (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Terminal Header */}
                    <div className="bg-slate-50/80 backdrop-blur-xl p-6 border-b border-slate-200 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center shadow-sm border-[2px] border-white ring-1 ring-slate-200">
                                 <Send className="w-5 h-5 text-white" />
                             </div>
                             <div>
                                 <h4 className="font-bold text-lg text-slate-900 tracking-tight">Telegram Copilot</h4>
                                 <div className="flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                         System Online
                                     </p>
                                 </div>
                             </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-2 shadow-sm">
                                <ShieldAlert className="w-3 h-3 text-purple-500" />
                                RBAC: {userRole}
                            </div>
                            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 flex items-center gap-2 shadow-sm">
                                <Cpu className="w-3 h-3 text-blue-500" />
                                Gemini 2.5 Flash
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-8 overflow-y-auto space-y-6 relative z-10 custom-scrollbar bg-slate-50" ref={scrollRef}>
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center mr-3 shrink-0 border border-sky-400 mt-1 shadow-sm">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[70%] p-5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                                    msg.sender === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none shadow-blue-600/20' 
                                    : 'bg-white text-slate-700 rounded-bl-none border border-slate-200 shadow-slate-200/50'
                                }`}>
                                    {msg.type === 'chart' ? (
                                        <div className="w-[400px] h-[300px]">
                                            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                                <BarChart3 className="w-5 h-5 text-blue-500" />
                                                <p className="font-bold text-slate-900">{msg.data.title}</p>
                                            </div>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <BarChart data={msg.data.data}>
                                                    <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                                    <YAxis hide />
                                                    <Tooltip 
                                                        cursor={{fill: '#f1f5f9'}}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                                        {msg.data.data.map((entry: any, index: any) => (
                                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : msg.type === 'analysis' ? (
                                        <div className="min-w-[350px]">
                                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900 text-lg">{msg.data.leadName}</p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.data.score > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {msg.data.score > 70 ? 'Hot Lead' : 'Nurture'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{msg.data.leadCompany}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-slate-900">{msg.data.score}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 block">/ 100</span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-slate-600 mb-4 leading-relaxed text-xs italic border-l-2 border-purple-500 pl-3">
                                                "{msg.data.summary}"
                                            </p>
                                            
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                    <p className="text-[10px] font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Strengths</p>
                                                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                                                        {msg.data.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>High budget potential</li>}
                                                    </ul>
                                                </div>
                                                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                                                    <p className="text-[10px] font-bold text-red-700 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risks</p>
                                                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-1">
                                                        {msg.data.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>) || <li>Timeline unclear</li>}
                                                    </ul>
                                                </div>
                                            </div>

                                            {msg.data.bant_breakdown && (
                                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">BANT Breakdown</p>
                                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                                                        <div className="flex justify-between"><span className="text-slate-500">Budget:</span> <span className="font-bold text-slate-900">{msg.data.bant_breakdown.budget}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">Authority:</span> <span className="font-bold text-slate-900">{msg.data.bant_breakdown.authority}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">Need:</span> <span className="font-bold text-slate-900">{msg.data.bant_breakdown.need}</span></div>
                                                        <div className="flex justify-between"><span className="text-slate-500">Timeline:</span> <span className="font-bold text-slate-900">{msg.data.bant_breakdown.timeline}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap font-mono text-xs md:text-sm">{msg.text}</div>
                                    )}
                                    <div className={`text-[9px] mt-2 flex justify-end items-center gap-1 font-bold opacity-70`}>
                                        <span>{msg.timestamp?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {isThinking && (
                            <div className="flex justify-start animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center mr-3 shrink-0 border border-sky-400 mt-1">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white p-6 relative z-10 border-t border-slate-200">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="w-full pl-6 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-300 transition-all placeholder:text-slate-400" 
                                placeholder="Enter system command or speak naturally..."
                                autoFocus
                            />
                            <button 
                                onClick={handleSendMessage} 
                                disabled={!inputText.trim()}
                                className="absolute right-2 top-2 p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/20 active:scale-95"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-center mt-3 gap-4">
                            {['Add Lead', 'Status', 'Analyze Lead', 'Help'].map(cmd => (
                                <button 
                                    key={cmd}
                                    onClick={() => handleQuickAction(cmd)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100 hover:border-slate-200 transition"
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden animate-in fade-in duration-300">
                    {/* Audit Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center relative z-20">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-900 p-2.5 rounded-xl">
                                <History className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">System Audit Log</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs text-slate-500 font-medium">Monitoring Active</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 relative">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                    placeholder="Search logs..." 
                                    className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-100 w-64" 
                                />
                            </div>
                            
                            {/* Filter Dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm ${
                                        isFilterOpen ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Filter className="w-4 h-4" /> Filter <ChevronDown className="w-3 h-3" />
                                </button>
                                
                                {isFilterOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in slide-in-from-top-2">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">By Status</p>
                                                <select 
                                                    value={statusFilter}
                                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                                                >
                                                    <option value="All">All Statuses</option>
                                                    <option value="Success">Success</option>
                                                    <option value="Failed">Failed</option>
                                                    <option value="Denied">Denied</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">By Severity</p>
                                                <select 
                                                    value={severityFilter}
                                                    onChange={(e) => setSeverityFilter(e.target.value as any)}
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                                                >
                                                    <option value="All">All Severities</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => { setSeverityFilter('All'); setStatusFilter('All'); setIsFilterOpen(false); }}
                                                className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleExportCSV}
                                className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95"
                            >
                                <Download className="w-4 h-4" /> CSV
                            </button>
                        </div>
                    </div>
                    
                    {/* Audit Table */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Severity</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAuditLogs.length > 0 ? (
                                    filteredAuditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition group">
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {log.actor === 'Amplify AI' 
                                                        ? <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-purple-600" /></div>
                                                        : <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-3.5 h-3.5 text-slate-500" /></div>
                                                    }
                                                    <span className="text-sm font-bold text-slate-900">{log.actor}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{log.action}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    {log.status === 'Success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                    {log.status === 'Failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                    {log.status === 'Denied' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
                                                    <span className={`text-xs font-bold ${
                                                        log.status === 'Failed' ? 'text-red-600' : 
                                                        log.status === 'Denied' ? 'text-amber-600' : 'text-emerald-600'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                                                    log.severity === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    log.severity === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600 truncate max-w-[300px]" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            No logs found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelegramChat;
