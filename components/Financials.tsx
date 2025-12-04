import React, { useState } from 'react';
import { Invoice, Transaction, Client } from '../types';
import { FileText, Plus, Search, CheckCircle2, AlertCircle, Smartphone, Download, Share2, Sparkles, X, Printer, Receipt, Building2, CreditCard, Loader2, Send, TrendingUp } from 'lucide-react';
import { generatePaymentReminder } from '../services/geminiService';
import { generatePaymentLink } from '../services/paystackService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const initialInvoices: Invoice[] = [
    { id: '1', invoiceNumber: 'INV-001', clientId: '1', clientName: 'Wanjiku Trading', amount: 150000, date: '2023-10-01', dueDate: '2023-10-15', status: 'Overdue', items: [], etimsCompliant: false },
    { id: '2', invoiceNumber: 'INV-002', clientId: '2', clientName: 'TechSahara', amount: 85000, date: '2023-10-10', dueDate: '2023-10-25', status: 'Pending', items: [], etimsCompliant: false },
    { id: '3', invoiceNumber: 'INV-003', clientId: '5', clientName: 'Mombasa Marine', amount: 2500000, date: '2023-10-05', dueDate: '2023-10-05', status: 'Paid', items: [], etimsCompliant: true, cuSerialNumber: 'KRA001293842', etimsDate: '2023-10-05 14:32:11' },
    { id: '4', invoiceNumber: 'INV-004', clientId: '3', clientName: 'GreenGrocers', amount: 45000, date: '2023-10-28', dueDate: '2023-11-10', status: 'Pending', items: [], etimsCompliant: false },
];

const initialTransactions: Transaction[] = [
    { id: '1', code: 'RHI892KD2L', amount: 2500000, sender: 'BLUE OCEAN LTD', date: '2023-10-05 14:30', method: 'M-Pesa', status: 'Verified' },
    { id: '2', code: 'RHI441MQ9P', amount: 5000, sender: 'JOHN KAMAU', date: '2023-10-12 09:15', method: 'M-Pesa', status: 'Unreconciled' },
    { id: '3', code: 'BNK-TX-992', amount: 120000, sender: 'WANJIKU TRADING', date: '2023-10-01 10:00', method: 'Bank', status: 'Verified' },
];

const cashFlowData = [
  { name: 'May', inflow: 1200000, outflow: 850000 },
  { name: 'Jun', inflow: 1800000, outflow: 1200000 },
  { name: 'Jul', inflow: 1600000, outflow: 950000 },
  { name: 'Aug', inflow: 2100000, outflow: 1100000 },
  { name: 'Sep', inflow: 2400000, outflow: 1300000 },
  { name: 'Oct', inflow: 2850000, outflow: 1600000 },
];

const Financials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [transactions] = useState<Transaction[]>(initialTransactions);
    
    // AI Reminder State
    const [reminderModal, setReminderModal] = useState<{open: boolean, invoice?: Invoice, content?: string}>({ open: false });
    const [isGenerating, setIsGenerating] = useState(false);

    // Paystack State
    const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);

    const handleGenerateReminder = async (invoice: Invoice) => {
        setIsGenerating(true);
        setReminderModal({ open: true, invoice });
        const text = await generatePaymentReminder(invoice.clientName, invoice.amount, invoice.invoiceNumber, 5);
        setReminderModal({ open: true, invoice, content: text });
        setIsGenerating(false);
    };

    const handleCreatePaymentLink = async (invoice: Invoice) => {
        setGeneratingLinkFor(invoice.id);
        // Mock email
        const email = invoice.clientName.toLowerCase().replace(' ', '') + '@example.com';
        const response = await generatePaymentLink(email, invoice.amount, invoice.invoiceNumber);
        
        if (response.status === 'success' && response.data) {
            setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, paymentLink: response.data?.authorization_url } : inv));
            alert(`Payment Link Generated: ${response.data.authorization_url}`);
        } else {
            alert('Failed to generate Paystack link.');
        }
        setGeneratingLinkFor(null);
    };

    const handleExport = () => {
        if (activeTab === 'invoices') {
            const headers = ['ID,Number,Client,Amount,Date,DueDate,Status'];
            const rows = invoices.map(inv => `${inv.id},${inv.invoiceNumber},"${inv.clientName}",${inv.amount},${inv.date},${inv.dueDate},${inv.status}`);
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "invoices_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const headers = ['ID,Code,Sender,Amount,Method,Date,Status'];
            const rows = transactions.map(tx => `${tx.id},${tx.code},"${tx.sender}",${tx.amount},${tx.method},${tx.date},${tx.status}`);
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "transactions_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financials & Compliance</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage invoices, M-Pesa reconciliation, and tax records.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setActiveTab('transactions')}
                        className={`px-5 py-2.5 rounded-xl font-bold transition text-sm flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                        <Smartphone className="w-4 h-4" /> M-Pesa Log
                    </button>
                    <button 
                        onClick={() => setActiveTab('invoices')}
                        className={`px-5 py-2.5 rounded-xl font-bold transition text-sm flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    >
                        <FileText className="w-4 h-4" /> Invoices
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">KES 235,000</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collected (This Month)</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">KES 2.5M</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 shadow-lg text-white flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tax Liability (16%)</p>
                        <p className="text-2xl font-bold mt-1">KES 400,000</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white relative z-10">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                </div>
            </div>

            {/* Cash Flow Graph */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm mb-8 shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Cash Flow Analysis
                        </h3>
                        <p className="text-slate-500 text-xs font-medium mt-1">Income vs Expenses (Last 6 Months)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-bold text-emerald-700">Inflow</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-100">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs font-bold text-red-700">Outflow</span>
                        </div>
                    </div>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `K${value/1000}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: number) => [`KES ${value.toLocaleString()}`, '']}
                            />
                            <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" name="Inflow" />
                            <Area type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOutflow)" name="Outflow" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                {activeTab === 'invoices' ? (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-200" />
                            </div>
                            <div className="flex gap-2">
                                 <button 
                                    onClick={handleExport}
                                    className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-50 transition"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-slate-900/10">
                                    <Plus className="w-4 h-4" /> Create Invoice
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4">Invoice #</th>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">eTIMS</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition group">
                                            <td className="px-6 py-4 font-bold text-slate-900 text-xs">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{inv.clientName}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{inv.date}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                    inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' : 
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {inv.etimsCompliant ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                    </div>
                                                ) : (
                                                     <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {inv.status !== 'Paid' && (
                                                        <button 
                                                            onClick={() => handleCreatePaymentLink(inv)}
                                                            disabled={generatingLinkFor === inv.id}
                                                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100" 
                                                            title="Generate Paystack Link"
                                                        >
                                                            {generatingLinkFor === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    {inv.status === 'Overdue' && (
                                                        <button 
                                                            onClick={() => handleGenerateReminder(inv)}
                                                            className="p-2 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition border border-sky-100" 
                                                            title="Generate Telegram Reminder"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                                                        <Printer className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm">Recent Transactions (M-Pesa & Bank)</h3>
                             <div className="flex gap-2">
                                <button 
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-50 transition"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button className="text-xs font-bold text-blue-600 hover:underline px-4 py-2">Refresh Feed</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                             <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-4">Trans ID</th>
                                        <th className="px-6 py-4">Method</th>
                                        <th className="px-6 py-4">Sender</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{tx.code}</td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-xs font-bold ${tx.method === 'M-Pesa' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {tx.method === 'M-Pesa' ? <Smartphone className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                                                    {tx.method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{tx.sender}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-900">KES {tx.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{tx.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                    tx.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </div>
                    </>
                )}
            </div>

            {/* AI Reminder Modal */}
            {reminderModal.open && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-sky-500" />
                                <h3 className="font-bold text-slate-900">Payment Reminder</h3>
                            </div>
                            <button onClick={() => setReminderModal({ open: false })} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {isGenerating ? (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold">Drafting message...</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-sm font-medium text-slate-800 leading-relaxed relative">
                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                        <Send className="w-3 h-3" />
                                    </div>
                                    "{reminderModal.content}"
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setReminderModal({ open: false })} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 text-xs">Edit Manually</button>
                                    <button className="flex-1 py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-600/20 text-xs flex items-center justify-center gap-2">
                                        <Share2 className="w-3.5 h-3.5" /> Send Telegram
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Financials;