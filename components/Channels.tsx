
import React, { useState } from 'react';
import { Send, MessageCircle, MessageSquare, MessageSquareText } from 'lucide-react';
import { Lead, UserRole } from '../types';
import TelegramChat from './TelegramChat';
import WhatsAppChat from './WhatsAppChat';
import BulkSMS from './BulkSMS';
import GoogleChatView from './GoogleChatView';

interface ChannelsProps {
    leads?: Lead[];
    onUpdateLeads?: (leads: Lead[]) => void;
    userRole?: UserRole;
}

type ChannelTab = 'googlechat' | 'telegram' | 'whatsapp' | 'bulksms';

const Channels: React.FC<ChannelsProps> = ({ leads = [], onUpdateLeads, userRole = 'Admin' }) => {
    const [activeChannel, setActiveChannel] = useState<ChannelTab>('googlechat');

    const tabs: { id: ChannelTab; label: string; icon: React.ElementType; activeColor: string }[] = [
        { id: 'googlechat', label: 'Google Chat', icon: MessageSquareText, activeColor: 'text-blue-600' },
        { id: 'telegram', label: 'Telegram Bridge', icon: Send, activeColor: 'text-sky-600' },
        { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageCircle, activeColor: 'text-emerald-600' },
        { id: 'bulksms', label: 'Bulk SMS', icon: MessageSquare, activeColor: 'text-blue-600' },
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-1 px-8 lg:px-12 pt-6 pb-0 shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveChannel(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-bold transition-all ${
                            activeChannel === tab.id
                            ? `bg-white ${tab.activeColor} shadow-sm border border-b-0 border-slate-200 -mb-px`
                            : 'text-slate-400 hover:text-slate-600 bg-transparent border border-transparent'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 min-h-0">
                {activeChannel === 'googlechat' && (
                    <GoogleChatView leads={leads} onUpdateLeads={onUpdateLeads} userRole={userRole} />
                )}
                {activeChannel === 'telegram' && (
                    <TelegramChat leads={leads} onUpdateLeads={onUpdateLeads} userRole={userRole} />
                )}
                {activeChannel === 'whatsapp' && (
                    <WhatsAppChat leads={leads} onUpdateLeads={onUpdateLeads} userRole={userRole} />
                )}
                {activeChannel === 'bulksms' && (
                    <BulkSMS />
                )}
            </div>
        </div>
    );
};

export default Channels;
