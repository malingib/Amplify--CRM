import React from 'react';
import { MessageSquareText, Bot, ExternalLink } from 'lucide-react';
import { Lead, UserRole } from '../types';

interface GoogleChatViewProps {
    leads?: Lead[];
    onUpdateLeads?: (leads: Lead[]) => void;
    userRole?: UserRole;
}

const GoogleChatView: React.FC<GoogleChatViewProps> = ({ userRole = 'Admin' }) => {
    return (
        <div className="flex flex-col h-full p-4 md:p-6 lg:p-8">
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 border border-blue-100 shadow-sm">
                    <MessageSquareText className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Google Chat</h3>
                <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                    Manage your CRM directly from Google Chat. Install the Amplify Bot
                    in your Workspace to run commands without leaving Chat.
                </p>

                <div className="w-full space-y-4 text-left">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            Available Commands
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
                            <li><code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">/pipeline</code> View lead summary</li>
                            <li><code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">/tasks</code> Check pending tasks</li>
                            <li><code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">/status</code> System health</li>
                            <li><code className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">/create &lt;name&gt; &lt;value&gt;</code> Quick lead creation</li>
                        </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                            Setup
                        </h4>
                        <ol className="space-y-1.5 text-xs text-slate-600 font-medium list-decimal list-inside">
                            <li>Go to <strong>Google Cloud Console &gt; APIs &gt; Google Chat API</strong></li>
                            <li>Configure the bot with your Workspace domain</li>
                            <li>Set the connection type to <strong>HTTP</strong> and point to your webhook URL</li>
                            <li>Role: <span className="font-bold text-slate-800">{userRole}</span></li>
                        </ol>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs font-bold text-emerald-700">Google Chat integration ready — configure in Settings &gt; Integrations</span>
                </div>
            </div>
        </div>
    );
};

export default GoogleChatView;
