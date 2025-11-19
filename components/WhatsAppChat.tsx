
import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Search, MoreVertical, Phone, Video, Paperclip, Mic, Send, Sparkles, CheckCheck } from 'lucide-react';
import { generateChatReply } from '../services/geminiService';

const initialSessions: ChatSession[] = [
    {
        id: '1',
        clientName: 'Alice Kamau',
        lastMessage: 'How much is the premium package?',
        unreadCount: 2,
        avatar: 'https://picsum.photos/100/100?random=10',
        messages: [
            { id: 'm1', sender: 'user', text: 'Hello Alice, thanks for contacting us.', timestamp: new Date() },
            { id: 'm2', sender: 'client', text: 'Hi, I saw your ad on Instagram.', timestamp: new Date() },
            { id: 'm3', sender: 'client', text: 'How much is the premium package?', timestamp: new Date() }
        ]
    },
    {
        id: '2',
        clientName: 'John Doe',
        lastMessage: 'Thanks, received the invoice.',
        unreadCount: 0,
        avatar: 'https://picsum.photos/100/100?random=11',
        messages: []
    }
];

const WhatsAppChat: React.FC = () => {
    const [sessions] = useState<ChatSession[]>(initialSessions);
    const [activeSessionId, setActiveSessionId] = useState<string>(initialSessions[0].id);
    const [inputText, setInputText] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const handleGetSuggestion = async () => {
        if (!activeSession) return;
        setIsThinking(true);
        const lastMsg = activeSession.messages[activeSession.messages.length - 1].text;
        const suggestion = await generateChatReply(lastMsg, activeSession.clientName);
        setAiSuggestion(suggestion);
        setIsThinking(false);
    };

    const useSuggestion = () => {
        setInputText(aiSuggestion);
        setAiSuggestion('');
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] p-6 lg:p-8 gap-6 max-w-[1800px] mx-auto">
            {/* Sidebar List */}
            <div className="w-[360px] bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-2xl text-slate-900 tracking-tight">Chats</h3>
                        <button className="p-2 hover:bg-slate-50 rounded-full transition"><MoreVertical className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input type="text" placeholder="Search messages..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white font-semibold transition-all placeholder:font-medium placeholder:text-slate-400" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sessions.map(session => (
                        <div 
                            key={session.id}
                            onClick={() => setActiveSessionId(session.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${activeSessionId === session.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-[1.02]' : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-200'}`}
                        >
                            <div className="relative">
                                <img src={session.avatar} className={`w-12 h-12 rounded-full object-cover border-[2px] ${activeSessionId === session.id ? 'border-slate-700' : 'border-white'} shadow-sm`} alt="" />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-[2px] border-white rounded-full"></span>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className={`font-bold text-sm ${activeSessionId === session.id ? 'text-white' : 'text-slate-900'}`}>{session.clientName}</h4>
                                    <span className={`text-[10px] font-bold ${activeSessionId === session.id ? 'text-slate-400' : 'text-slate-400'}`}>12:30 PM</span>
                                </div>
                                <p className={`text-xs truncate font-medium leading-relaxed ${activeSessionId === session.id ? 'text-slate-400' : 'text-slate-500'}`}>{session.lastMessage}</p>
                            </div>
                            {session.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border border-blue-500">{session.unreadCount}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-xl p-6 border-b border-slate-100 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                             <img src={activeSession?.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm border-[2px] border-white ring-1 ring-slate-100" alt="" />
                             <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-[2px] border-white rounded-full"></span>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 tracking-tight">{activeSession?.clientName}</h4>
                            <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                                Active Now
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-slate-200 hover:shadow-sm flex items-center justify-center text-slate-600 transition"><Phone className="w-5 h-5" /></button>
                        <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-slate-200 hover:shadow-sm flex items-center justify-center text-slate-600 transition"><Video className="w-5 h-5" /></button>
                        <button className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-slate-200 hover:shadow-sm flex items-center justify-center text-slate-600 transition"><Search className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10 custom-scrollbar">
                    {activeSession?.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-slate-900 text-white rounded-br-none' 
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                            }`}>
                                {msg.text}
                                <div className={`text-[9px] mt-2 flex justify-end items-center gap-1 font-bold ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                                    <span>10:42 AM</span>
                                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3" />}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* AI Suggestion Bubble */}
                    {aiSuggestion && (
                        <div className="flex justify-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <div className="bg-white/90 backdrop-blur-md border border-blue-200 rounded-3xl p-6 shadow-xl shadow-blue-200/50 max-w-xl ring-4 ring-white/50">
                                <div className="flex items-center gap-2 mb-3 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                                    <Sparkles className="w-4 h-4 fill-blue-600" /> AI Suggestion
                                </div>
                                <p className="text-slate-800 text-sm font-medium mb-6 leading-relaxed">"{aiSuggestion}"</p>
                                <div className="flex gap-4">
                                    <button onClick={() => setAiSuggestion('')} className="flex-1 py-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-100 transition uppercase tracking-wide">Dismiss</button>
                                    <button onClick={useSuggestion} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-600/30 uppercase tracking-wide">Apply</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="bg-white p-6 relative z-10 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-3xl flex items-center p-2 shadow-inner border border-slate-200 focus-within:ring-4 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300">
                        <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition shadow-none hover:shadow-sm"><Paperclip className="w-5 h-5" /></button>
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1 focus:outline-none bg-transparent px-4 text-slate-900 font-semibold placeholder:text-slate-400 h-full py-3 text-sm" 
                            placeholder="Type your message here..." 
                        />
                         {inputText.length === 0 && !aiSuggestion && (
                             <button 
                                onClick={handleGetSuggestion}
                                disabled={isThinking}
                                className="mr-2 text-blue-600 hover:bg-blue-50 p-3 rounded-2xl transition group" 
                                title="Ask AI for reply"
                             >
                                <Sparkles className={`w-5 h-5 ${isThinking ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                             </button>
                         )}
                        {inputText.length > 0 ? (
                            <button className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition shadow-md shadow-slate-900/20 active:scale-95 hover:rotate-12"><Send className="w-5 h-5" /></button>
                        ) : (
                             <button className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition shadow-none hover:shadow-sm"><Mic className="w-5 h-5" /></button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppChat;
