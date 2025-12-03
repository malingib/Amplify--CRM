
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, Maximize2, Minimize2, Bot, Terminal, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { interpretCrmCommand, qualifyLead } from '../services/geminiService';
import { Lead, DealStage, UserRole } from '../types';

interface AICommandCenterProps {
    leads?: Lead[];
    onUpdateLeads?: (leads: Lead[]) => void;
    userRole?: UserRole;
}

interface ChatMessage {
    role: 'user' | 'ai' | 'system';
    text: string;
    type?: 'text' | 'analysis' | 'success' | 'error';
    data?: any;
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({ leads = [], onUpdateLeads, userRole = 'Admin' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'system', text: `Amplify Copilot v2.5 Online\nConnected as ${userRole}`, type: 'text' },
        { role: 'ai', text: 'Hello! I can manage leads, analyze deals, or provide system status. Try "Analyze Wanjiku Trading".', type: 'text' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isExpanded]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg, type: 'text' }]);
        setInput('');
        setIsThinking(true);

        try {
            // Interpret Command
            const interpretation = await interpretCrmCommand(userMsg, userRole!);
            const { intent, data, response_text } = interpretation;
            
            let responseMsg = response_text || "Command processed.";
            let responseType: ChatMessage['type'] = 'text';
            let responseData: any = null;

            // Execute Client-Side Logic based on Intent
            if (intent === 'CREATE_LEAD' && onUpdateLeads) {
                 const newLead: Lead = {
                    id: Date.now().toString(),
                    name: data.name || 'New Lead',
                    company: data.name || 'Unknown Company',
                    value: data.value || 50000,
                    stage: DealStage.INTAKE,
                    lastContact: new Date().toISOString().split('T')[0],
                    probability: 10,
                    avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
                    source: 'Copilot',
                    order: leads.length
                };
                onUpdateLeads([...leads, newLead]);
                responseMsg = `✅ Created lead: ${newLead.name}`;
                responseType = 'success';
            }
            
            else if (intent === 'UPDATE_LEAD' && onUpdateLeads) {
                const targetLead = leads.find(l => 
                    l.name.toLowerCase().includes(data.name?.toLowerCase() || '') || 
                    l.company.toLowerCase().includes(data.name?.toLowerCase() || '')
                );

                if (targetLead) {
                    const newLeads = leads.map(l => {
                        if (l.id === targetLead.id) {
                            const changes: any = {};
                            if (data.field === 'value') changes.value = data.newValue;
                            if (data.field === 'stage') changes.stage = data.newValue; 
                            if (data.field === 'probability') changes.probability = data.newValue;
                            return { ...l, ...changes };
                        }
                        return l;
                    });
                    onUpdateLeads(newLeads);
                    responseMsg = `✅ Updated ${targetLead.name}: ${data.field} → ${data.newValue}`;
                    responseType = 'success';
                } else {
                    responseMsg = `⚠️ Lead not found: ${data.name}`;
                    responseType = 'error';
                }
            }

            else if (intent === 'DELETE_LEAD' && onUpdateLeads) {
                const targetLead = leads.find(l => l.name.toLowerCase().includes(data.name?.toLowerCase() || ''));
                if (targetLead) {
                    onUpdateLeads(leads.filter(l => l.id !== targetLead.id));
                    responseMsg = `🗑️ Deleted lead: ${targetLead.name}`;
                    responseType = 'success';
                } else {
                    responseMsg = `⚠️ Lead not found for deletion: ${data.name}`;
                    responseType = 'error';
                }
            }

            else if (intent === 'ANALYZE_LEAD') {
                const leadToAnalyze = leads.find(l => l.name.toLowerCase().includes(data.name?.toLowerCase() || '') || l.company.toLowerCase().includes(data.name?.toLowerCase() || ''));
                if (leadToAnalyze) {
                    const analysis = await qualifyLead(leadToAnalyze.name, leadToAnalyze.company, leadToAnalyze.notes || '', leadToAnalyze.value);
                    responseType = 'analysis';
                    responseData = { ...analysis, leadName: leadToAnalyze.name };
                    responseMsg = "Here is the BANT analysis:";
                } else {
                    responseMsg = `⚠️ I couldn't find "${data.name}" to analyze.`;
                    responseType = 'error';
                }
            }
            
            setMessages(prev => [...prev, { role: 'ai', text: responseMsg, type: responseType, data: responseData }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now.", type: 'error' }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-[100] group ring-4 ring-white"
            >
                <Sparkles className="w-6 h-6 group-hover:animate-pulse text-yellow-400" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-8 right-8 bg-white rounded-[32px] shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 ring-1 ring-slate-900/5 transition-all duration-300 ${isExpanded ? 'w-[450px] h-[700px]' : 'w-[360px] h-[550px]'}`}>
            {/* Header */}
            <div className="bg-slate-900 p-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                        <Terminal className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">Copilot Terminal</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg">
                        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'system' ? (
                            <div className="w-full flex justify-center my-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">{msg.text}</span>
                            </div>
                        ) : (
                            <>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs md:text-sm font-medium shadow-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-br-none shadow-slate-900/20' 
                                    : msg.type === 'error' 
                                        ? 'bg-red-50 text-red-800 border border-red-100 rounded-bl-none'
                                        : msg.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-bl-none'
                                            : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'
                                }`}>
                                    {msg.text}
                                </div>
                                {msg.type === 'analysis' && msg.data && (
                                    <div className="mt-2 w-[90%] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{msg.data.leadName}</p>
                                                <p className="text-[10px] text-slate-500 uppercase">Qualification Report</p>
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-lg">
                                                <Sparkles className="w-3 h-3 text-yellow-300" />
                                                <span className="text-xs font-bold">{msg.data.score}/100</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-3 italic">"{msg.data.summary}"</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                                                <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Strengths</p>
                                                <ul className="list-disc list-inside text-[10px] text-emerald-800 space-y-0.5">
                                                    {msg.data.strengths?.slice(0, 2).map((s: string, i: number) => <li key={i}>{s}</li>) || <li>High potential</li>}
                                                </ul>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                                                <p className="text-[9px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risks</p>
                                                <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-0.5">
                                                    {msg.data.weaknesses?.slice(0, 2).map((w: string, i: number) => <li key={i}>{w}</li>) || <li>Review budget</li>}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex gap-2 items-center">
                            <Bot className="w-4 h-4 text-slate-400 animate-pulse" />
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl flex items-center p-1.5 border border-slate-200 focus-within:ring-4 focus-within:ring-slate-100 focus-within:border-slate-300 transition-all shadow-inner">
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none focus:outline-none px-3 text-xs md:text-sm font-semibold text-slate-800 placeholder:text-slate-400"
                        placeholder="Create lead, analyze deal, or check status..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        autoFocus
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
                    >
                        {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;
