
import React, { useState } from 'react';
import { Client } from '../types';
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone, ArrowUpRight, Download, Building2, MapPin, X, Save, Trash2, CheckSquare, Square, MessageSquare, Send, Calendar, Loader2, Clock, FileText, CreditCard, ChevronRight, Briefcase, History, Receipt } from 'lucide-react';
import { sendBulkSms } from '../services/smsService';

const initialClients: Client[] = [
    { 
        id: '1', 
        name: 'Wanjiku Trading', 
        company: 'Wanjiku Ltd', 
        email: 'info@wanjiku.co.ke',
        phone: '+254711222333',
        status: 'Active',
        lastOrder: '2023-10-25',
        totalRevenue: 1250000,
        avatar: 'https://picsum.photos/100/100?random=1',
        industry: 'Textiles'
    },
    { 
        id: '2', 
        name: 'TechSahara', 
        company: 'Sahara Systems', 
        email: 'procurement@techsahara.com',
        phone: '+254722444555',
        status: 'Active',
        lastOrder: '2023-10-20',
        totalRevenue: 3400000,
        avatar: 'https://picsum.photos/100/100?random=2',
        industry: 'Technology'
    },
    { 
        id: '3', 
        name: 'GreenGrocers', 
        company: 'GG Exporters', 
        email: 'orders@greengrocers.ke',
        phone: '+254733666777',
        status: 'Pending',
        lastOrder: '2023-09-15',
        totalRevenue: 450000,
        avatar: 'https://picsum.photos/100/100?random=3',
        industry: 'Agriculture'
    },
    { 
        id: '4', 
        name: 'Nairobi Logistics', 
        company: 'NL Group', 
        email: 'director@nlogistics.com',
        phone: '+254744888999',
        status: 'Inactive',
        lastOrder: '2023-08-10',
        totalRevenue: 890000,
        avatar: 'https://picsum.photos/100/100?random=4',
        industry: 'Logistics'
    },
    {
        id: '5',
        name: 'Mombasa Marine',
        company: 'Blue Ocean Ltd',
        email: 'sales@blueocean.co.ke',
        phone: '+254755111222',
        status: 'Active',
        lastOrder: '2023-10-28',
        totalRevenue: 5600000,
        avatar: 'https://picsum.photos/100/100?random=5',
        industry: 'Maritime'
    }
];

// Mock History Data linked to Client IDs
const mockClientHistory = [
    { id: 'h1', clientId: '1', type: 'Invoice', date: '2023-10-25', description: 'Invoice #INV-2023-089', amount: 150000, status: 'Unpaid' },
    { id: 'h2', clientId: '1', type: 'Payment', date: '2023-09-10', description: 'M-Pesa Payment - RHI89...', amount: 45000, status: 'Verified' },
    { id: 'h3', clientId: '1', type: 'Invoice', date: '2023-09-01', description: 'Invoice #INV-2023-042', amount: 45000, status: 'Paid' },
    { id: 'h4', clientId: '2', type: 'Invoice', date: '2023-10-20', description: 'Invoice #INV-2023-091', amount: 1200000, status: 'Pending' },
    { id: 'h5', clientId: '2', type: 'Payment', date: '2023-10-15', description: 'Bank Transfer - REF: 992...', amount: 500000, status: 'Verified' },
    { id: 'h6', clientId: '3', type: 'Invoice', date: '2023-09-15', description: 'Invoice #INV-2023-055', amount: 85000, status: 'Overdue' },
    { id: 'h7', clientId: '5', type: 'Invoice', date: '2023-10-28', description: 'Invoice #INV-2023-102', amount: 250000, status: 'Paid' },
];

const industries = ['Technology', 'Agriculture', 'Logistics', 'Maritime', 'Textiles', 'Retail', 'Manufacturing', 'Finance', 'General'];

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClient, setNewClient] = useState<Partial<Client>>({
        name: '', company: '', email: '', phone: '', status: 'Active', totalRevenue: 0, industry: 'General'
    });

    // Client Detail View State
    const [viewingClient, setViewingClient] = useState<Client | null>(null);

    // Selection State
    const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
    
    // Bulk SMS State
    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [smsMessage, setSmsMessage] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isSending, setIsSending] = useState(false);

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = () => {
        if (!newClient.name || !newClient.company) return;
        const clientToAdd: Client = {
            id: Date.now().toString(),
            name: newClient.name!,
            company: newClient.company!,
            email: newClient.email || '',
            phone: newClient.phone || '',
            status: newClient.status as any || 'Active',
            totalRevenue: newClient.totalRevenue || 0,
            lastOrder: new Date().toISOString().split('T')[0],
            avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
            industry: newClient.industry || 'General'
        };
        setClients([...clients, clientToAdd]);
        setIsAddModalOpen(false);
        setNewClient({ name: '', company: '', email: '', phone: '', status: 'Active', totalRevenue: 0, industry: 'General' });
    };

    const handleExport = () => {
        const headers = ['ID,Name,Company,Email,Phone,Status,Revenue,Industry'];
        const rows = clients.map(c => `${c.id},"${c.name}","${c.company}",${c.email},${c.phone},${c.status},${c.totalRevenue},${c.industry}`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "clients_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to remove this client?")) {
            setClients(clients.filter(c => c.id !== id));
            if (selectedClientIds.has(id)) {
                const newSet = new Set(selectedClientIds);
                newSet.delete(id);
                setSelectedClientIds(newSet);
            }
            if (viewingClient?.id === id) {
                setViewingClient(null);
            }
        }
    };

    // Selection Logic
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedClientIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedClientIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedClientIds.size === filteredClients.length) {
            setSelectedClientIds(new Set());
        } else {
            setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
        }
    };

    const handleBulkSms = async () => {
        if (!smsMessage.trim()) return;
        
        setIsSending(true);
        const recipients = clients
            .filter(c => selectedClientIds.has(c.id) && c.phone)
            .map(c => c.phone);
        
        if (recipients.length > 0) {
            await sendBulkSms(recipients, smsMessage, scheduleTime || undefined);
            // Simulate success feedback
            alert(`Campaign scheduled for ${recipients.length} clients.`);
        } else {
            alert('No valid phone numbers found for selected clients.');
        }

        setIsSending(false);
        setIsSmsModalOpen(false);
        setSmsMessage('');
        setScheduleTime('');
        setSelectedClientIds(new Set()); // Deselect after sending
    };

    const openSmsForClient = (client: Client) => {
        setSelectedClientIds(new Set([client.id]));
        setIsSmsModalOpen(true);
    };

    const getClientHistory = (clientId: string) => {
        return mockClientHistory.filter(h => h.clientId === clientId);
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col relative">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage your relationships and customer data.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleExport}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm text-sm"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100 text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Client
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4 shrink-0">
                <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by name, company..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 outline-none text-sm font-semibold transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {['All Clients', 'Active', 'Inactive', 'Pending'].map((filter, i) => (
                        <button 
                            key={filter} 
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${i === 0 ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <button className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition ml-auto">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Client List */}
            <div className="flex-1 bg-white rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1 pb-24"> 
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-5 w-16 text-center">
                                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-slate-900">
                                        {selectedClientIds.size === filteredClients.length && filteredClients.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-slate-900" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-2 py-5">Client Name</th>
                                <th className="px-6 py-5">Contact Info</th>
                                <th className="px-6 py-5">Total Revenue</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.map((client) => (
                                <tr 
                                    key={client.id} 
                                    className={`hover:bg-slate-50/60 transition duration-200 group cursor-pointer ${selectedClientIds.has(client.id) ? 'bg-slate-50' : ''}`}
                                    onClick={() => setViewingClient(client)}
                                >
                                    <td className="px-6 py-5 text-center" onClick={(e) => { e.stopPropagation(); toggleSelect(client.id); }}>
                                        <button className="flex items-center justify-center">
                                            {selectedClientIds.has(client.id) ? (
                                                <CheckSquare className="w-5 h-5 text-slate-900" />
                                            ) : (
                                                <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-2 py-5">
                                        <div className="flex items-center gap-4">
                                            <img src={client.avatar} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm" alt={client.name} />
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{client.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" /> {client.company}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-slate-400" /> {client.email}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                                <Phone className="w-3 h-3 text-slate-400" /> {client.phone}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-slate-900 text-sm">KES {client.totalRevenue.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Lifetime Value</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                            client.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            client.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                client.status === 'Active' ? 'bg-emerald-500' :
                                                client.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                                            }`}></span>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition"
                                                onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${client.email}`; }}
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-emerald-600 transition"
                                                onClick={(e) => { e.stopPropagation(); openSmsForClient(client); }}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                                                className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-red-200 text-slate-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination / Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-4">Showing {filteredClients.length} Clients</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm">Previous</button>
                        <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">Next</button>
                    </div>
                </div>
            </div>

            {/* Bulk Action Floating Bar */}
            {selectedClientIds.size > 0 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl shadow-2xl p-2 px-6 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4 duration-300 ring-4 ring-white">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                         <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white">{selectedClientIds.size}</div>
                         <span className="text-sm font-bold">Selected</span>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setIsSmsModalOpen(true)}
                            className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition text-sm font-bold"
                         >
                            <MessageSquare className="w-4 h-4" /> Bulk SMS
                         </button>
                         <button 
                            onClick={() => setSelectedClientIds(new Set())}
                            className="flex items-center gap-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-3 py-2 rounded-xl transition text-sm font-bold"
                         >
                            <X className="w-4 h-4" /> Clear
                         </button>
                    </div>
                </div>
            )}

            {/* Add Client Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative">
                         <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                        
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Client</h3>
                            <p className="text-slate-500 font-medium mt-1 text-sm">Create a new customer record.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Contact Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    placeholder="e.g. John Kamau"
                                    value={newClient.name}
                                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Company</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    placeholder="e.g. Kamau Enterprises"
                                    value={newClient.company}
                                    onChange={e => setNewClient({...newClient, company: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        placeholder="john@example.com"
                                        value={newClient.email}
                                        onChange={e => setNewClient({...newClient, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Phone</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        placeholder="+254 7..."
                                        value={newClient.phone}
                                        onChange={e => setNewClient({...newClient, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Initial Revenue</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newClient.totalRevenue}
                                        onChange={e => setNewClient({...newClient, totalRevenue: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Industry</label>
                                    <select 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                        value={newClient.industry}
                                        onChange={e => setNewClient({...newClient, industry: e.target.value})}
                                    >
                                        {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Status</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    value={newClient.status}
                                    onChange={e => setNewClient({...newClient, status: e.target.value as any})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                            <button onClick={handleAddClient} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
                                <Save className="w-4 h-4" /> Save Client
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk SMS Modal */}
            {isSmsModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative">
                        <button onClick={() => setIsSmsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                        
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Bulk SMS Campaign</h3>
                                    <p className="text-slate-500 text-xs font-medium">Powered by Mobiwave</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl mt-4 flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs">{selectedClientIds.size}</div>
                                <p className="text-xs text-blue-800 font-medium">You are sending a message to <strong>{selectedClientIds.size} selected clients</strong>.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Message Body</label>
                                <textarea 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[120px] resize-none"
                                    placeholder="Type your message here..."
                                    value={smsMessage}
                                    onChange={e => setSmsMessage(e.target.value)}
                                    maxLength={160}
                                />
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] font-bold ${smsMessage.length > 150 ? 'text-red-500' : 'text-slate-400'}`}>{smsMessage.length}/160</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Schedule (Optional)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="datetime-local" 
                                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs"
                                        value={scheduleTime}
                                        onChange={e => setScheduleTime(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1">Leave blank to send immediately.</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setIsSmsModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                            <button 
                                onClick={handleBulkSms} 
                                disabled={isSending || !smsMessage}
                                className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {isSending ? 'Sending...' : 'Send Campaign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Detail Slide-over */}
            {viewingClient && (
                <>
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                        onClick={() => setViewingClient(null)}
                    />
                    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-8 border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex gap-4">
                                <img src={viewingClient.avatar} className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt={viewingClient.name} />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{viewingClient.name}</h2>
                                    <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5" /> {viewingClient.company}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                            viewingClient.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                            viewingClient.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                viewingClient.status === 'Active' ? 'bg-emerald-500' : 
                                                viewingClient.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-400'
                                            }`}></span>
                                            {viewingClient.status}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100 uppercase tracking-wide">
                                            {viewingClient.industry || 'General'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setViewingClient(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group">
                                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Call</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Email</span>
                            </button>
                            <button 
                                onClick={() => openSmsForClient(viewingClient)}
                                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group"
                            >
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">SMS</span>
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Lifetime Value</p>
                                <p className="text-2xl font-bold tracking-tight text-slate-900">KES {(viewingClient.totalRevenue || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Clock className="w-3 h-3" /> Last Activity</p>
                                <p className="text-2xl font-bold text-slate-900 tracking-tight">{viewingClient.lastOrder}</p>
                            </div>
                        </div>

                        {/* Tabs / Sections */}
                        <div className="flex-1 flex flex-col gap-6">
                            {/* Contact Details */}
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Contact Details</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</p>
                                            <p className="text-sm font-semibold text-slate-900">{viewingClient.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number</p>
                                            <p className="text-sm font-semibold text-slate-900">{viewingClient.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Location</p>
                                            <p className="text-sm font-semibold text-slate-900">Nairobi, Kenya</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Transaction History</h3>
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                                     {getClientHistory(viewingClient.id).length > 0 ? (
                                         getClientHistory(viewingClient.id).map((historyItem) => (
                                             <div key={historyItem.id} className="p-4 flex items-center justify-between border-b border-slate-100 last:border-0 hover:bg-slate-100 transition group cursor-pointer">
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-slate-100 ${
                                                         historyItem.type === 'Payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-blue-600'
                                                     }`}>
                                                         {historyItem.type === 'Payment' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                     </div>
                                                     <div>
                                                         <p className="text-xs font-bold text-slate-900">{historyItem.description}</p>
                                                         <p className="text-[10px] text-slate-500 font-medium">{historyItem.date} • <span className={`${historyItem.status === 'Overdue' ? 'text-red-500' : historyItem.status === 'Paid' || historyItem.status === 'Verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{historyItem.status}</span></p>
                                                     </div>
                                                 </div>
                                                 <span className="text-xs font-bold text-slate-900">KES {historyItem.amount.toLocaleString()}</span>
                                             </div>
                                         ))
                                     ) : (
                                         <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                                             <History className="w-8 h-8 mb-2 opacity-20" />
                                             <p className="text-xs font-medium">No history found</p>
                                         </div>
                                     )}
                                     {getClientHistory(viewingClient.id).length > 0 && (
                                        <button className="w-full py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide hover:bg-slate-100 transition flex items-center justify-center gap-1">
                                            View Full Ledger <ChevronRight className="w-3 h-3" />
                                        </button>
                                     )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => handleDelete(viewingClient.id)}
                                className="py-3 px-4 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition text-xs flex items-center justify-center"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                                className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 text-xs"
                            >
                                <Briefcase className="w-3.5 h-3.5" /> Manage Account
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Clients;
