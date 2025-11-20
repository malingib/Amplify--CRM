
import React, { useState } from 'react';
import { Client } from '../types';
import { Search, Filter, Plus, MoreHorizontal, Mail, Phone, ArrowUpRight, Download, Building2, MapPin } from 'lucide-react';

const initialClients: Client[] = [
    { 
        id: '1', 
        name: 'Wanjiku Trading', 
        company: 'Wanjiku Ltd', 
        email: 'info@wanjiku.co.ke',
        phone: '+254 711 222 333',
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
        phone: '+254 722 444 555',
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
        phone: '+254 733 666 777',
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
        phone: '+254 744 888 999',
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
        phone: '+254 755 111 222',
        status: 'Active',
        lastOrder: '2023-10-28',
        totalRevenue: 5600000,
        avatar: 'https://picsum.photos/100/100?random=5',
        industry: 'Maritime'
    }
];

const Clients: React.FC = () => {
    const [clients] = useState<Client[]>(initialClients);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Client Directory</h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Manage your relationships and customer data.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2 shadow-sm text-sm">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100 text-sm">
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
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-8 py-5">Client Name</th>
                                <th className="px-6 py-5">Contact Info</th>
                                <th className="px-6 py-5">Total Revenue</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50/60 transition duration-200 group cursor-pointer">
                                    <td className="px-8 py-5">
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
                                            <button className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-emerald-600 transition">
                                                <Phone className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition">
                                                <ArrowUpRight className="w-4 h-4" />
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
        </div>
    );
};

export default Clients;