import React, { useState, useEffect } from 'react';
import { Invoice, Transaction, Client } from '../types';
import { FileText, Plus, Search, CheckCircle2, AlertCircle, Smartphone, Download, Share2, Sparkles, X, Printer, Receipt, Building2, CreditCard, Loader2, Send, TrendingUp, Mail } from 'lucide-react';
import { generatePaymentReminder } from '../services/geminiService';
import { generatePaymentLink } from '../services/paystackService';
import { invoicesApi, workspaceApi } from '../src/api/client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Financials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // AI Reminder State
    const [reminderModal, setReminderModal] = useState<{open: boolean, invoice?: Invoice, content?: string}>({ open: false });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                const res = await invoicesApi.list();
                setInvoices((res.invoices || []).map((inv: any) => ({
                    id: inv.id,
                    invoiceNumber: inv.invoiceNumber,
                    clientId: inv.clientId,
                    clientName: inv.client?.name || 'Unknown',
                    amount: inv.amount,
                    date: inv.date,
                    dueDate: inv.dueDate,
                    status: inv.status,
                    items: inv.items || [],
                    etimsCompliant: inv.etimsCompliant,
                    cuSerialNumber: inv.cuSerialNumber,
                    etimsDate: inv.etimsDate,
                    paymentLink: inv.paymentLink,
                })));
            } catch (err) {
                console.error('Failed to load invoices:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadInvoices();
    }, []);

    // Paystack State
    const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);
    const [emailingInvoice, setEmailingInvoice] = useState<string | null>(null);

    const cashFlowData = [
        { name: 'May', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.2), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.15) },
        { name: 'Jun', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.3), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.2) },
        { name: 'Jul', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.25), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.18) },
        { name: 'Aug', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.35), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.22) },
        { name: 'Sep', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.4), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.25) },
        { name: 'Oct', inflow: Math.round(invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0) * 0.45), outflow: Math.round(invoices.reduce((sum, i) => sum + i.amount, 0) * 0.28) },
    ];

    const handleSendInvoiceEmail = async (invoice: Invoice) => {
        setEmailingInvoice(invoice.id);
        const clientEmail = (invoice as any).client?.email || `${invoice.clientName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        const body = `
            <h2>Invoice ${invoice.invoiceNumber}</h2>
            <p>Dear ${invoice.clientName},</p>
            <p>Please find your invoice details below:</p>
            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                ${(invoice.items || []).map((i: any) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>KES ${i.unitPrice}</td><td>KES ${i.total}</td></tr>`).join('')}
            </table>
            <p><strong>Total: KES ${invoice.amount.toLocaleString()}</strong></p>
            <p>Due: ${invoice.dueDate}</p>
            ${invoice.paymentLink ? `<p>Pay online: <a href="${invoice.paymentLink}">${invoice.paymentLink}</a></p>` : ''}
            <hr><p><em>Amplify CRM — Automated Invoice</em></p>
        `;
        await workspaceApi.sendEmail({
            to: clientEmail,
            subject: `Invoice ${invoice.invoiceNumber} from Amplify CRM`,
            body,
        });
        setEmailingInvoice(null);
    };

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
        const response = await generatePaymentLink(email, invoice.amount, invoice.id);
        
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
        <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 shrink-0 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 shrink-0">
                <div className="p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">KES 235,000</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
                <div className="p-5 rounded-2xl flex items-center justify-between">
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

                </div>
            </div>

            {/* Cash Flow Graph */}
            <div className="bg-white p-6 rounded-3xl mb-8 shrink-0">
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
                <div className="min-h-[200px] md:min-h-[300px] h-[250px] md:h-[300px] w-full">
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
            <div className="flex-1 rounded-3xl overflow-hidden flex flex-col">
                {activeTab === 'invoices' ? (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="relative w-full sm:w-64">
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
                            <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Invoice #</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Client</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Date</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Amount</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Status</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">eTIMS</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition group">
                                            <td className="px-3 py-2 md:px-6 md:py-4 font-bold text-slate-900 text-xs md:text-sm">{inv.invoiceNumber}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-semibold text-slate-700">{inv.clientName}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-bold text-slate-500">{inv.date}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-bold text-slate-900">KES {inv.amount.toLocaleString()}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4">
                                                <span className={`px-2 py-1 md:px-2.5 md:py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                    inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' : 
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4">
                                                {inv.etimsCompliant ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                    </div>
                                                ) : (
                                                     <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-right">
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
                                                    <button
                                                        onClick={() => handleSendInvoiceEmail(inv)}
                                                        disabled={emailingInvoice === inv.id}
                                                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition border border-purple-100"
                                                        title="Send via Gmail"
                                                    >
                                                        {emailingInvoice === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                    </button>
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
                        </div>
                    </>
                ) : (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                            <div className="overflow-x-auto">
                             <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Trans ID</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Method</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Sender</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Amount</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Time</th>
                                        <th className="px-3 py-2 md:px-6 md:py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-3 py-2 md:px-6 md:py-4 font-mono text-xs md:text-sm font-bold text-slate-600">{tx.code}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4">
                                                <span className={`flex items-center gap-1.5 text-xs md:text-sm font-bold ${tx.method === 'M-Pesa' ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {tx.method === 'M-Pesa' ? <Smartphone className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                                                    {tx.method}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-semibold text-slate-900">{tx.sender}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-bold text-slate-900">KES {tx.amount.toLocaleString()}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm font-medium text-slate-500">{tx.date}</td>
                                            <td className="px-3 py-2 md:px-6 md:py-4">
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
                        </div>
                    </>
                )}
            </div>

            {/* AI Reminder Modal */}
            {reminderModal.open && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
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