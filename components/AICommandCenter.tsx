import React, { useState } from 'react';
import { Sparkles, X, Send, Loader2, ChevronUp, MessageSquare } from 'lucide-react';
import { generateChatReply } from '../services/geminiService';

const AICommandCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: 'Hello! I am your CRM Assistant. How can I help you today?' }
    ]);
    const [isThinking, setIsThinking] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsThinking(true);

        // Simulating a generic AI request using the service
        // In a real app, we would have a specific function for general assistant queries
        try {
            const response = await generateChatReply(userMsg, "General User");
            setMessages(prev => [...prev, { role: 'ai', text: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now." }]);
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
                className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-[100] group"
            >
                <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-[380px] h-[600px] bg-white rounded-[32px] shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-black p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Command Center</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-gray-300 font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-2 items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-xs text-slate-500 font-medium">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl flex items-center p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all">
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none focus:outline-none px-3 text-sm font-medium text-slate-700"
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        autoFocus
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="p-2 bg-black text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 flex justify-center">
                    <p className="text-[10px] text-slate-400 font-medium">Powered by Gemini 2.5 Flash</p>
                </div>
            </div>
        </div>
    );
};

export default AICommandCenter;