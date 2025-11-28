import React, { useState } from 'react';
import { Send, Clock, CheckCircle, AlertCircle, Plus, Search, Filter, MessageSquare, Calendar, X, Loader2, Smartphone, Users, ChevronRight, Zap } from 'lucide-react';
import { sendBulkSms } from '../services/smsService';
import { Client } from '../types';

// Mock Clients Data (In a real app, this would come from a global store or API)
const mockClients: Client[] = [
    { id: '1', name: 'Wanjiku Trading', company: 'Wanjiku Ltd', email: 'info@wanjiku.co.ke', phone: '+254711222333', status: 'Active', lastOrder: '2023-10-25', totalRevenue: 1250000, avatar: '', industry: 'Textiles' },
    { id: '2', name: 'TechSahara', company: 'Sahara Systems', email: 'procurement@techsahara.com', phone: '+254722444555', status: 'Active', lastOrder: '2023-10-20', totalRevenue: 3400000, avatar: '', industry: 'Technology' },
    { id: '3', name: 'GreenGrocers', company: 'GG Exporters', email: 'orders@greengrocers.ke', phone: '+254733666777', status: 'Pending', lastOrder: '2023-09-15', totalRevenue: 450000, avatar: '', industry: 'Agriculture' },
    { id: '4', name: 'Nairobi Logistics', company: 'NL Group', email: 'director@nlogistics.com', phone: '+254744888999', status: 'Inactive', lastOrder: '2023-08-10', totalRevenue: 890000, avatar: '', industry: 'Logistics' },
    { id: '5', name: 'Mombasa Marine', company: 'Blue Ocean Ltd', email: 'sales@blueocean.co.ke', phone: '+254755111222', status: 'Active', lastOrder: '2023-10-28', totalRevenue: 5600000, avatar: '', industry: 'Maritime' }
];

const templates = [
    { id: 1, title: 'Payment Reminder', text: 'Hello, this is a gentle reminder that your invoice #INV-001 is overdue. Please pay via M-Pesa Paybill 123456.' },
    { id: 2, title: 'Holiday Greeting', text: 'Happy Holidays from Amplify! We appreciate your business and wish you a prosperous new year.' },
    { id: 3, title: 'System Maintenance', text: 'Dear Customer, our system will be down for maintenance this Saturday from 10 PM to 2 AM. Sorry for any inconvenience.' },
    { id: 4, title: 'New Stock Alert', text: 'New Arrivals! Check out our latest stock of premium goods available at discounted rates this week.' },
];

const initialCampaigns = [
    { id: 1, name: 'Q4 Sales Promo', recipients: 154, message: 'Get 20% off all services this December!', status: 'Delivered', date: '2023-12-01 09:00', successRate: 98 },
    { id: 2, name: 'November Newsletter', recipients: 142, message: 'Check your email for our monthly update.', status: 'Delivered', date: '2023-11-01 10:00', successRate: 95 },
    { id: 3, name: 'System Outage Alert', recipients: 160, message: 'Urgent: Maintenance scheduled for tonight.', status: 'Failed', date: '2023-10-15 14:30', successRate: 40 },
];

const BulkSMS: React.FC = () => {
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // New Campaign State
    const [audienceType, setAudienceType] = useState<'all' | 'industry' | 'manual'>('all');
    const [selectedIndustry, setSelectedIndustry] = useState('Technology');
    const [manualNumbers, setManualNumbers] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    
    const getRecipientCount = () => {
        if (audienceType === 'all') return mockClients.length;
        if (audienceType === 'industry') return mockClients.filter(c => c.industry === selectedIndustry).length;
        if (audienceType === 'manual') return manualNumbers.split(',').filter(n => n.trim().length > 5).length;
        return 0;
    };

    const handleSend = async () => {
        if (!messageBody) return;
        setIsSending(true);

        // Gather Recipients
        let recipients: string[] = [];
        if (audienceType === 'all') recipients = mockClients.map(c => c.phone);
        else if (audienceType === 'industry') recipients = mockClients.filter(c => c.industry === selectedIndustry).map(c => c.phone);
        else if (audienceType === 'manual') recipients = manualNumbers.split(',').map(n => n.trim());

        // API Call
        await sendBulkSms(recipients, messageBody, scheduleDate || undefined);

        // Add to history (Mock)
        const newCampaign = {
            id: Date.now(),
            name: `Campaign ${new Date().toLocaleDateString()}`,
            recipients: recipients.length,
            message: messageBody,
            status: scheduleDate ? 'Scheduled' : 'Delivered',
            date: scheduleDate || new Date().toLocaleString(),
            successRate: 100
        };
        
        setCampaigns([newCampaign, ...campaigns]);
        
        setIsSending(false);
        setIsModalOpen(false);
        setMessageBody('');
        setManualNumbers('');
        setScheduleDate('');
    };

    const applyTemplate = (text: string) => {
        setMessageBody(text);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk SMS Marketing</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Create and track SMS campaigns.</p>
                </div>
                <div className="flex gap-3">
                     <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm text-sm">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100 text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 shrink-0">
                <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl shadow-slate-900/10 flex flex-col relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-colors"></div>
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded-md">Healthy</span>
                     </div>
                     <div className="mt-auto">
                        <p className="text-3xl font-bold tracking-tight">2,450</p>
                        <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">SMS Credits Left</p>
                     </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Send className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sent Today</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">154</p>
                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 100% Delivery</p>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">3</p>
                    <p className="text-xs font-bold text-slate-500 mt-2">Upcoming Campaigns</p>
                </div>

                 <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Failed</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">12</p>
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">Action Required</p>
                </div>
            </div>

            {/* Campaign History */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-lg">Recent Campaigns</h3>
                    <div className="relative w-64">
                         <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                         <input type="text" placeholder="Search history..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-200" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-4">Campaign Name</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Message Preview</th>
                                <th className="px-6 py-4">Recipients</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Success Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {campaigns.map(camp => (
                                <tr key={camp.id} className="hover:bg-slate-50/50 transition cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{camp.name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{camp.date}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 truncate max-w-[200px]">{camp.message}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-slate-400" /> {camp.recipients}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                            camp.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            camp.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-20">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${camp.successRate}%`}}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600">{camp.successRate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Compose Modal */}
            {isModalOpen && (
                 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[32px] shadow-2xl flex overflow-hidden border border-slate-200">
                        
                        {/* Left: Configuration */}
                        <div className="w-[60%] p-8 overflow-y-auto flex flex-col bg-white">
                             <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">New Campaign</h3>
                                    <p className="text-slate-500 font-medium mt-1 text-sm">Target customers and schedule blasts.</p>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                {/* Audience Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Audience</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button 
                                            onClick={() => setAudienceType('all')}
                                            className={`p-4 rounded-2xl border text-left transition ${audienceType === 'all' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                        >
                                            <div className="mb-2"><Users className="w-5 h-5" /></div>
                                            <p className="font-bold text-sm">All Contacts</p>
                                            <p className={`text-[10px] font-bold mt-1 ${audienceType === 'all' ? 'text-slate-400' : 'text-slate-400'}`}>{mockClients.length} Recipients</p>
                                        </button>
                                        <button 
                                             onClick={() => setAudienceType('industry')}
                                             className={`p-4 rounded-2xl border text-left transition ${audienceType === 'industry' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                        >
                                            <div className="mb-2"><Filter className="w-5 h-5" /></div>
                                            <p className="font-bold text-sm">By Industry</p>
                                            <p className={`text-[10px] font-bold mt-1 ${audienceType === 'industry' ? 'text-slate-400' : 'text-slate-400'}`}>Target specific sector</p>
                                        </button>
                                        <button 
                                             onClick={() => setAudienceType('manual')}
                                             className={`p-4 rounded-2xl border text-left transition ${audienceType === 'manual' ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                        >
                                            <div className="mb-2"><Plus className="w-5 h-5" /></div>
                                            <p className="font-bold text-sm">Manual Input</p>
                                            <p className={`text-[10px] font-bold mt-1 ${audienceType === 'manual' ? 'text-slate-400' : 'text-slate-400'}`}>Paste numbers</p>
                                        </button>
                                    </div>

                                    {audienceType === 'industry' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <select 
                                                value={selectedIndustry}
                                                onChange={(e) => setSelectedIndustry(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-slate-200 outline-none text-sm"
                                            >
                                                {['Technology', 'Agriculture', 'Logistics', 'Maritime', 'Textiles'].map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {audienceType === 'manual' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <textarea 
                                                value={manualNumbers}
                                                onChange={(e) => setManualNumbers(e.target.value)}
                                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-slate-200 outline-none text-xs h-20 resize-none"
                                                placeholder="Paste comma separated numbers: +254700000000, +254711111111"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Message Input */}
                                <div className="space-y-3">
                                     <div className="flex justify-between items-center">
                                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Message Content</label>
                                         <span className={`text-[10px] font-bold ${messageBody.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>{messageBody.length} / 160 chars</span>
                                     </div>
                                     <textarea 
                                        value={messageBody}
                                        onChange={(e) => setMessageBody(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900 focus:ring-4 focus:ring-slate-100 outline-none text-sm h-32 resize-none shadow-inner"
                                        placeholder="Type your message here..."
                                        maxLength={320}
                                     />
                                </div>

                                {/* Templates */}
                                <div className="space-y-3">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Quick Templates</label>
                                     <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                         {templates.map(temp => (
                                             <button 
                                                key={temp.id} 
                                                onClick={() => applyTemplate(temp.text)}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition whitespace-nowrap shadow-sm"
                                            >
                                                 {temp.title}
                                             </button>
                                         ))}
                                     </div>
                                </div>

                                {/* Schedule */}
                                <div className="space-y-3">
                                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Schedule (Optional)</label>
                                     <div className="relative">
                                         <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                         <input 
                                            type="datetime-local" 
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-slate-200 outline-none text-sm shadow-sm"
                                         />
                                     </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 text-sm">Cancel</button>
                                <button 
                                    onClick={handleSend}
                                    disabled={isSending || !messageBody}
                                    className="flex-1 py-4 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {isSending ? 'Sending...' : `Send to ${getRecipientCount()} Recipients`}
                                </button>
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="w-[40%] bg-slate-50 border-l border-slate-200 p-8 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            
                            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-6 relative z-10">Live Preview</h4>
                            
                            {/* Phone Mockup */}
                            <div className="w-[280px] h-[500px] bg-white rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                                <div className="h-6 bg-slate-800 w-32 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                                <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 pt-2">
                                     <div className="w-6 h-6 bg-slate-300 rounded-full"></div>
                                     <div className="ml-2">
                                         <div className="w-20 h-2 bg-slate-300 rounded-full"></div>
                                     </div>
                                </div>
                                <div className="flex-1 bg-slate-50 p-4 space-y-4 overflow-y-auto">
                                    <div className="flex flex-col gap-1 items-start">
                                         <div className="bg-slate-200 text-slate-600 p-3 rounded-2xl rounded-bl-none text-xs max-w-[80%] shadow-sm">
                                             Hello!
                                         </div>
                                    </div>
                                    {messageBody && (
                                        <div className="flex flex-col gap-1 items-end animate-in zoom-in-95 duration-300">
                                            <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-br-none text-xs max-w-[90%] shadow-md break-words leading-relaxed">
                                                {messageBody}
                                            </div>
                                            <span className="text-[8px] text-slate-400 font-bold">Just now</span>
                                        </div>
                                    )}
                                </div>
                                <div className="h-12 bg-white border-t border-slate-100 flex items-center justify-center">
                                    <div className="w-32 h-1 bg-slate-200 rounded-full"></div>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex gap-2 relative z-10">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-600">iOS Preview</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm opacity-50">
                                    <Zap className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-600">Android</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default BulkSMS;