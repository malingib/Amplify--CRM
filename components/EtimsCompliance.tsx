
import React, { useState } from 'react';
import { Invoice } from '../types';
import { ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, RefreshCw, Server, QrCode, ArrowRight, Download, Filter, Search, Receipt } from 'lucide-react';

const initialInvoices: Invoice[] = [
    { id: '1', invoiceNumber: 'INV-001', clientId: '1', clientName: 'Wanjiku Trading', amount: 150000, date: '2023-10-01', dueDate: '2023-10-15', status: 'Overdue', items: [], etimsCompliant: false },
    { id: '2', invoiceNumber: 'INV-002', clientId: '2', clientName: 'TechSahara', amount: 85000, date: '2023-10-10', dueDate: '2023-10-25', status: 'Pending', items: [], etimsCompliant: false },
    { id: '3', invoiceNumber: 'INV-003', clientId: '5', clientName: 'Mombasa Marine', amount: 2500000, date: '2023-10-05', dueDate: '2023-10-05', status: 'Paid', items: [], etimsCompliant: true, cuSerialNumber: 'KRA001293842', etimsDate: '2023-10-05 14:32:11' },
    { id: '4', invoiceNumber: 'INV-004', clientId: '3', clientName: 'GreenGrocers', amount: 45000, date: '2023-10-28', dueDate: '2023-11-10', status: 'Pending', items: [], etimsCompliant: false },
];

const EtimsCompliance: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [transmittingId, setTransmittingId] = useState<string | null>(null);
    const [showReceipt, setShowReceipt] = useState<Invoice | null>(null);
    const [filter, setFilter] = useState<'All' | 'Compliant' | 'Pending'>('All');

    const handleTransmit = (id: string) => {
        setTransmittingId(id);
        // Simulate KRA API latency
        setTimeout(() => {
            setInvoices(prev => prev.map(inv => {
                if (inv.id === id) {
                    return {
                        ...inv,
                        etimsCompliant: true,
                        cuSerialNumber: `KRA${Math.floor(Math.random() * 1000000000)}`,
                        etimsDate: new Date().toISOString(),
                        qrCodeUrl: 'generated' 
                    };
                }
                return inv;
            }));
            setTransmittingId(null);
        }, 2000);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filter === 'All') return true;
        if (filter === 'Compliant') return inv.etimsCompliant;
        if (filter === 'Pending') return !inv.etimsCompliant;
        return true;
    });

    const compliantCount = invoices.filter(i => i.etimsCompliant).length;
    const vatLiability = invoices.filter(i => i.etimsCompliant).reduce((acc, curr) => acc + (curr.amount * 0.16), 0);

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-600/20">
                            <ShieldCheck className="w-5 h-5" />
                        </span>
                        eTIMS Compliance Hub
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage KRA tax invoice transmission and reporting.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-bold">
                        <Server className="w-4 h-4" />
                        VSCU Connected
                    </div>
                    <button className="px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" /> Monthly Returns
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Rate</p>
                        <div className="flex items-baseline gap-1 mt-1">
                            <p className="text-3xl font-bold text-slate-900">{Math.round((compliantCount / invoices.length) * 100)}%</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <FileCheck className="w-6 h-6" />
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT Output Tax (16%)</p>
                        <p className="text-3xl font-bold text-slate-900 mt-1">KES {vatLiability.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Receipt className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl shadow-slate-900/10 flex flex-col relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Transmission</p>
                            <p className="text-3xl font-bold mt-1">{invoices.length - compliantCount}</p>
                        </div>
                        <div className="p-2 bg-white/10 rounded-xl">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                    </div>
                    <div className="mt-4 relative z-10">
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${((invoices.length - compliantCount) / invoices.length) * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Action required for compliance</p>
                    </div>
                </div>
            </div>

            {/* Invoice List */}
            <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilter('All')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === 'All' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            All Invoices
                        </button>
                        <button 
                            onClick={() => setFilter('Pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            Pending KRA
                        </button>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search invoice #" className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-4">Invoice Details</th>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">KRA Status</th>
                                <th className="px-6 py-4">Control Unit Serial</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900 text-sm">{inv.invoiceNumber}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{inv.date}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-700 text-xs">{inv.clientName}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900 text-sm">KES {inv.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400">VAT: KES {(inv.amount * 0.16).toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inv.etimsCompliant ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                                        {inv.cuSerialNumber || '---'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {inv.etimsCompliant ? (
                                            <button 
                                                onClick={() => setShowReceipt(inv)}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 transition"
                                            >
                                                View Receipt
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleTransmit(inv.id)}
                                                disabled={transmittingId === inv.id}
                                                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {transmittingId === inv.id ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Server className="w-3.5 h-3.5" />
                                                )}
                                                {transmittingId === inv.id ? 'Signing...' : 'Sign Invoice'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
                        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <Receipt className="w-6 h-6 text-slate-900" />
                            </div>
                            <h3 className="text-white font-bold text-lg">Fiscal Receipt</h3>
                            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Kenya Revenue Authority</p>
                        </div>
                        
                        <div className="p-8 text-center space-y-6">
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Invoice Amount</p>
                                <p className="text-3xl font-bold text-slate-900">KES {showReceipt.amount.toLocaleString()}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-bold">CU Serial</span>
                                    <span className="font-mono font-bold text-slate-900">{showReceipt.cuSerialNumber}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-bold">Invoice Date</span>
                                    <span className="font-bold text-slate-900">{showReceipt.date}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500 font-bold">Buyer PIN</span>
                                    <span className="font-bold text-slate-900">P051238491Z</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="p-2 bg-white border-4 border-slate-900 rounded-xl">
                                    <QrCode className="w-24 h-24 text-slate-900" />
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 font-medium">Scan to verify on iTax Portal</p>

                            <button onClick={() => setShowReceipt(null)} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition">
                                Close Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EtimsCompliance;
