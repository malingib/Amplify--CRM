

import React, { useState } from 'react';
import { Tenant } from '../types';
import { 
    Users, CreditCard, Activity, MoreHorizontal, AlertCircle, 
    CheckCircle2, Search, Plus, Server, ArrowUpRight, ShieldCheck, 
    Zap, FileText, Download, X, Check, Ban, Clock, Settings, Bell,
    Building2, Mail, Calendar
} from 'lucide-react';

// Extended Mock Data
const initialTenants: Tenant[] = [
    { id: '1', businessName: 'Alabama Machinery', contactPerson: 'Eva Robinson', email: 'eva@alabamamachinery.com', plan: 'Enterprise', status: 'Active', nextBillingDate: '2025-11-01', usersCount: 15, monthlyFee: 45000 },
    { id: '2', businessName: 'Nairobi Logistics', contactPerson: 'John Kamau', email: 'john@nlogistics.co.ke', plan: 'Pro', status: 'Active', nextBillingDate: '2025-10-28', usersCount: 8, monthlyFee: 25000 },
    { id: '3', businessName: 'Mombasa Marine', contactPerson: 'Sarah Ochieng', email: 'sarah@marine.co.ke', plan: 'Starter', status: 'Past Due', nextBillingDate: '2025-10-15', usersCount: 3, monthlyFee: 10000 },
    { id: '4', businessName: 'Rift Valley Dairy', contactPerson: 'Peter Koech', email: 'peter@rvdairy.co.ke', plan: 'Pro', status: 'Suspended', nextBillingDate: '2025-11-05', usersCount: 6, monthlyFee: 25000 },
    { id: '5', businessName: 'Kisumu Health Clinic', contactPerson: 'Dr. Amani', email: 'admin@kisumuhealth.org', plan: 'Enterprise', status: 'Active', nextBillingDate: '2025-11-10', usersCount: 22, monthlyFee: 55000 },
];

const initialPayments = [
    { id: 'PAY-001', tenant: 'Alabama Machinery', date: '2025-10-01', amount: 45000, method: 'Bank Transfer', status: 'Cleared' },
    { id: 'PAY-002', tenant: 'Nairobi Logistics', date: '2025-09-28', amount: 25000, method: 'M-Pesa', status: 'Cleared' },
    { id: 'PAY-003', tenant: 'Mombasa Marine', date: '2025-09-15', amount: 10000, method: 'Card', status: 'Failed' },
    { id: 'PAY-004', tenant: 'Kisumu Health Clinic', date: '2025-10-10', amount: 55000, method: 'Bank Transfer', status: 'Processing' },
];

const initialRequests = [
    { id: 'REQ-1', type: 'Plan Upgrade', tenant: 'Nairobi Logistics', details: 'Requesting upgrade to Enterprise Plan', date: '2 hrs ago', status: 'Pending' },
    { id: 'REQ-2', type: 'KYC Verification', tenant: 'Rift Valley Dairy', details: 'Submitted business registration documents', date: '1 day ago', status: 'Pending' },
    { id: 'REQ-3', type: 'User Limit Increase', tenant: 'Kisumu Health Clinic', details: 'Add +5 users temporarily', date: '3 days ago', status: 'Resolved' },
];

type TabView = 'overview' | 'tenants' | 'financials' | 'approvals';

interface SystemDashboardProps {
    activeTab: TabView;
}

const SystemDashboard: React.FC<SystemDashboardProps> = ({ activeTab }) => {
    const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
    const [requests, setRequests] = useState(initialRequests);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [planFilter, setPlanFilter] = useState('All');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [newTenant, setNewTenant] = useState<Partial<Tenant>>({
        businessName: '', contactPerson: '', email: '', plan: 'Pro', monthlyFee: 25000
    });

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
        const matchesPlan = planFilter === 'All' || t.plan === planFilter;
        return matchesSearch && matchesStatus && matchesPlan;
    });

    const totalRevenue = tenants.reduce((acc, curr) => acc + curr.monthlyFee, 0);
    const activeTenantsCount = tenants.filter(t => t.status === 'Active').length;

    const handleAddTenant = () => {
        if (!newTenant.businessName) return;
        const tenant: Tenant = {
            id: Date.now().toString(),
            businessName: newTenant.businessName!,
            contactPerson: newTenant.contactPerson || 'Admin',
            email: newTenant.email || '',
            plan: newTenant.plan as any || 'Starter',
            status: 'Active',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            usersCount: 1,
            monthlyFee: newTenant.monthlyFee || 0
        };
        setTenants([...tenants, tenant]);
        setIsAddModalOpen(false);
        setNewTenant({ businessName: '', contactPerson: '', email: '', plan: 'Pro', monthlyFee: 25000 });
    };

    const handleApproveRequest = (id: string) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    };

    const handleRejectRequest = (id: string) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Past Due': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Suspended': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-200';
        }
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto space-y-8 pb-24 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                     <div className="bg-purple-600 p-2.5 rounded-xl shadow-lg shadow-purple-600/20">
                         <ShieldCheck className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Owner Console</h2>
                        <p className="text-slate-500 font-medium text-sm">Monitor SaaS performance and manage tenant accounts.</p>
                     </div>
                 </div>
                 
                 {/* Current Section Indicator */}
                 <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold text-sm border border-purple-100 uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                     {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                 </div>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-purple-100 transition-colors"></div>
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">+12% MoM</span>
                            </div>
                            <div className="mt-auto relative z-10">
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">KES {totalRevenue.toLocaleString()}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Recurring Revenue</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{activeTenantsCount}</p>
                                    <span className="text-sm font-bold text-slate-400 mb-1.5">/ {tenants.length} Total</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Tenants</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-600">Operational</span>
                                </div>
                            </div>
                            <div className="mt-auto">
                                <p className="text-3xl font-bold text-slate-900 tracking-tight">99.9%</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Uptime</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl shadow-slate-900/10 flex flex-col relative overflow-hidden border border-slate-800">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="p-3 bg-white/10 rounded-xl text-white backdrop-blur-md">
                                    <Server className="w-6 h-6" />
                                </div>
                                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="mt-auto relative z-10">
                                <p className="text-3xl font-bold tracking-tight">24.5k</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">AI API Calls (Today)</p>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        </div>
                    </div>

                    {/* Pending Requests Preview */}
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Pending Actions</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {requests.filter(r => r.status === 'Pending').slice(0, 3).map(req => (
                                <div key={req.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 text-slate-500">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{req.type}</p>
                                        <p className="text-xs text-slate-500 font-medium">{req.tenant}</p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold">{req.date}</p>
                                    </div>
                                </div>
                            ))}
                            {requests.filter(r => r.status === 'Pending').length === 0 && (
                                <div className="col-span-3 py-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    All caught up! No pending actions.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TENANTS TAB */}
            {activeTab === 'tenants' && (
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[600px] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Tenant Directory</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage Accounts</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                             <div className="relative w-full lg:w-64 group">
                                 <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                 <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition" 
                                 />
                             </div>
                             
                             <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-purple-200"
                             >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Past Due">Past Due</option>
                                <option value="Suspended">Suspended</option>
                             </select>

                             <select 
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-purple-200"
                             >
                                <option value="All">All Plans</option>
                                <option value="Starter">Starter</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                             </select>

                             <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition active:scale-95"
                             >
                                 <Plus className="w-4 h-4" /> Add Tenant
                             </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4">Business Name</th>
                                    <th className="px-6 py-4">Plan & Usage</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Revenue</th>
                                    <th className="px-6 py-4">Next Bill</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTenants.length > 0 ? filteredTenants.map(tenant => (
                                    <tr 
                                        key={tenant.id} 
                                        onClick={() => setSelectedTenant(tenant)}
                                        className="hover:bg-slate-50/50 transition group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center border border-purple-100 shadow-sm">
                                                    {tenant.businessName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{tenant.businessName}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{tenant.contactPerson}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    tenant.plan === 'Enterprise' ? 'bg-slate-900 text-white border-slate-900' :
                                                    tenant.plan === 'Pro' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {tenant.plan}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold">{tenant.usersCount} Users</p>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(tenant.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-current`}></span>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                                            KES {tenant.monthlyFee.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {tenant.nextBillingDate}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No tenants found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FINANCIALS TAB */}
            {activeTab === 'financials' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                        <div>
                             <h3 className="font-bold text-slate-900 text-lg">Payment History</h3>
                             <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Global Transaction Ledger</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-slate-200 transition">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                    </div>

                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Transaction ID</th>
                                    <th className="px-6 py-4">Tenant</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {initialPayments.map(pay => (
                                    <tr key={pay.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{pay.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{pay.tenant}</td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{pay.date}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">KES {pay.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{pay.method}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                                                pay.status === 'Cleared' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                pay.status === 'Failed' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                                {pay.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* APPROVALS TAB */}
            {activeTab === 'approvals' && (
                <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-lg">System Requests</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Pending Administrative Actions</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {requests.map(req => (
                                <div key={req.id} className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:bg-slate-50/50 transition">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900">{req.type}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                                req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                                req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                            }`}>{req.status}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">{req.tenant} • <span className="text-slate-400">{req.details}</span></p>
                                        <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1"><Clock className="w-3 h-3" /> {req.date}</p>
                                    </div>
                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRejectRequest(req.id)}
                                                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition flex items-center gap-2"
                                            >
                                                <X className="w-4 h-4" /> Reject
                                            </button>
                                            <button 
                                                onClick={() => handleApproveRequest(req.id)}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg shadow-slate-900/10"
                                            >
                                                <Check className="w-4 h-4" /> Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Tenant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Onboard New Tenant</h3>
                            <p className="text-slate-500 font-medium mt-1 text-sm">Create a new workspace for a business/clinic.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Business Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                        placeholder="e.g. Apex Health Clinic"
                                        value={newTenant.businessName}
                                        onChange={e => setNewTenant({...newTenant, businessName: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Contact Person</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                        placeholder="Full Name"
                                        value={newTenant.contactPerson}
                                        onChange={e => setNewTenant({...newTenant, contactPerson: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                        placeholder="admin@company.com"
                                        value={newTenant.email}
                                        onChange={e => setNewTenant({...newTenant, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Subscription Plan</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                        value={newTenant.plan}
                                        onChange={e => setNewTenant({...newTenant, plan: e.target.value as any})}
                                    >
                                        <option value="Starter">Starter</option>
                                        <option value="Pro">Pro</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Monthly Fee (KES)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                        value={newTenant.monthlyFee}
                                        onChange={e => setNewTenant({...newTenant, monthlyFee: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                            <button onClick={handleAddTenant} className="flex-1 py-3.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
                                <Plus className="w-4 h-4" /> Create Tenant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tenant Detail Slide-over */}
            {selectedTenant && (
                <>
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] animate-in fade-in duration-300"
                        onClick={() => setSelectedTenant(null)}
                    />
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[80] p-8 border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="flex items-start justify-between mb-8">
                             <div>
                                 <h2 className="text-xl font-bold text-slate-900">{selectedTenant.businessName}</h2>
                                 <p className="text-sm font-medium text-slate-500">ID: {selectedTenant.id}</p>
                             </div>
                             <button onClick={() => setSelectedTenant(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                 <div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
                                     <p className={`font-bold ${selectedTenant.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>{selectedTenant.status}</p>
                                 </div>
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                                     <Activity className="w-5 h-5 text-slate-400" />
                                 </div>
                             </div>

                             <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2">Account Details</h3>
                                <div className="flex items-center gap-4">
                                    <Users className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Contact Person</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedTenant.contactPerson}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Email Address</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedTenant.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <CreditCard className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Subscription</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedTenant.plan} • KES {selectedTenant.monthlyFee.toLocaleString()}/mo</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Next Billing</p>
                                        <p className="text-sm font-semibold text-slate-900">{selectedTenant.nextBillingDate}</p>
                                    </div>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-slate-100">
                                 <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest mb-4">Admin Actions</h3>
                                 <div className="space-y-3">
                                     <button className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                                         <Settings className="w-4 h-4" /> Manage Features
                                     </button>
                                     <button className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                                         <Bell className="w-4 h-4" /> Send Notification
                                     </button>
                                     <button className="w-full py-3 px-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2">
                                         <Ban className="w-4 h-4" /> Suspend Account
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SystemDashboard;