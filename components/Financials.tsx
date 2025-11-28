
import React, { useState } from 'react';
import { Invoice, Transaction, Client } from '../types';
import { FileText, Plus, Search, CheckCircle2, AlertCircle, Smartphone, Download, Share2, Sparkles, X, Printer, Receipt, Building2 } from 'lucide-react';
import { generatePaymentReminder } from '../services/geminiService';

const initialInvoices: Invoice[] = [
    { id: '1', invoiceNumber: 'INV-001', clientId: '1', clientName: 'Wanjiku Trading', amount: 150000, date: '2023-10-01', dueDate: '2023-10-15', status: 'Overdue', items: [], etimsCompliant: true },
    { id: '2', invoiceNumber: 'INV-002', clientId: '2', clientName: 'TechSahara', amount: 85000, date: '2023-10-10', dueDate: '2023-10-25', status: 'Pending', items: [], etimsCompliant: true },
    { id: '3', invoiceNumber: 'INV-003', clientId: '5', clientName: 'Mombasa Marine', amount: 2500000, date: '2023-10-05', dueDate: '2023-10-05', status: 'Paid', items: [], etimsCompliant: true },
];

const initialTransactions: Transaction[] = [
    { id: '1', code: 'RHI892KD2L', amount: 2500000, sender: 'BLUE OCEAN LTD', date: '2023-10-05 14:30', method: 'M-Pesa', status: 'Verified' },
    { id: '2', code: 'RHI441MQ9P', amount: 5000, sender: 'JOHN KAMAU', date: '2023-10-12 09:15', method: 'M-Pesa', status: 'Unreconciled' },
    { id: '3', code: 'BNK-TX-992', amount: 120000, sender: 'WANJIKU TRADING', date: '2023-10-01 10:00', method: 'Bank', status: 'Verified' },
];

const Financials: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'transactions'>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [transactions] = useState<Transaction[]>(initialTransactions);
    
    // AI Reminder State
    const [reminderModal, setReminderModal] = useState<{open: boolean, invoice?: Invoice, content?: string}>({ open: false });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateReminder = async (invoice: Invoice) => {
        setIsGenerating(true);
        setReminderModal({ open: true, invoice });
        const text = await generatePaymentReminder(invoice.clientName, invoice.amount, invoice.invoiceNumber, 5);
        setReminderModal({ open: true, invoice, content: text });
        setIsGenerating(false);
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

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                {activeTab === 'invoices' ? (
                    <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search invoices..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-200" />
                            </div>
                            <button className="px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-slate-900/10">
                                <Plus className="w-4 h-4" /> Create Invoice
                            </button>
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
                                                    {inv.status === 'Overdue' && (
                                                        <button 
                                                            onClick={() => handleGenerateReminder(inv)}
                                                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-100" 
                                                            title="Generate WhatsApp Reminder"
                                                        >
                                                            <Share2 className="w-4 h-4" />
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
                            <button className="text-xs font-bold text-blue-600 hover:underline">Refresh Feed</button>
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
                                <Sparkles className="w-5 h-5 text-green-500" />
                                <h3 className="font-bold text-slate-900">Payment Reminder</h3>
                            </div>
                            <button onClick={() => setReminderModal({ open: false })} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {isGenerating ? (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold">Drafting message...</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-sm font-medium text-slate-800 leading-relaxed relative">
                                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                        <Smartphone className="w-3 h-3" />
                                    </div>
                                    "{reminderModal.content}"
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setReminderModal({ open: false })} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 text-xs">Edit Manually</button>
                                    <button className="flex-1 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 text-xs flex items-center justify-center gap-2">
                                        <Share2 className="w-3.5 h-3.5" /> Send WhatsApp
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
