
import React from 'react';
import { TrendingUp, Users, MoreHorizontal, ArrowUpRight, Calendar, ArrowRight, Lock } from 'lucide-react';
import { UserRole, ViewState } from '../types';

interface DashboardProps {
    userRole: UserRole;
    onNavigate?: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, onNavigate }) => {
  const showFinancials = ['Admin', 'Manager'].includes(userRole);

  const handleNav = (view: ViewState) => {
    if (onNavigate) onNavigate(view);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-24">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <span className="text-2xl font-bold text-slate-900 whitespace-nowrap tracking-tight">Dashboard</span>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            <div className="flex gap-2">
                {['Overview', 'Sales Performance', 'Team Activity', showFinancials ? 'Revenue' : null].filter(Boolean).map((item, i) => (
                    <button key={item} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${i === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'}`}>
                        {item}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
         
         {/* Financial Card - Conditional */}
         {showFinancials ? (
            <div 
                onClick={() => handleNav('pipeline')}
                className="bg-white p-5 rounded-2xl flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
            >
                <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shrink-0 border border-slate-100">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">$1.98M</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100 shrink-0">+11%</span>
            </div>
         ) : (
            <div 
                onClick={() => handleNav('pipeline')}
                className="bg-white p-5 rounded-2xl flex items-center gap-4 w-full shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer hover:shadow-md"
            >
                 <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0 border border-blue-100">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">My Pipeline Value</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">$245k</p>
                </div>
            </div>
         )}

         <div 
            onClick={() => handleNav('clients')}
            className="bg-white p-5 rounded-2xl flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shrink-0 border border-slate-100">
                <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Customers</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">+89</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100 shrink-0">+12</span>
         </div>

         <div 
            onClick={() => handleNav('tasks')}
            className="bg-white p-5 rounded-2xl flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300 shrink-0 border border-slate-100">
                <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">My Tasks</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">12</p>
            </div>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 shrink-0">+4</span>
         </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Full Width Content */}
        <div className="lg:col-span-12 space-y-8">
            
            {/* Interaction History Header */}
            <div className="flex justify-between items-end px-1">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h3>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Latest deal movements and key milestones.</p>
                </div>
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition hover:border-slate-300 shadow-sm">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition hover:border-slate-300 shadow-sm">
                        <ArrowUpRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* The Colored Cards Row - Compacted */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Royal Blue Card */}
                <div 
                    onClick={() => handleNav('pipeline')}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[32px] p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-blue-600/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer min-h-[280px] flex flex-col justify-between border border-blue-500/50 ring-4 ring-white shadow-sm"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -mr-20 -mt-20 pointer-events-none blur-3xl"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-white ring-1 ring-white/20 uppercase tracking-wider">Oct 4 • Active</div>
                        <button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition ring-1 ring-white/10"><MoreHorizontal className="w-5 h-5 text-white" /></button>
                    </div>
                    <div className="space-y-1 relative z-10 mt-auto mb-6">
                        <p className="text-xs font-bold text-blue-100 uppercase tracking-wider opacity-90">Royal Package</p>
                        <p className="text-3xl font-bold tracking-tight leading-tight">Opportunity</p>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                         <span className="text-4xl font-bold tracking-tighter">$11.2k</span>
                         <div className="flex -space-x-3 pl-4 pb-1">
                            {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-blue-600 object-cover shadow-sm" />)}
                         </div>
                    </div>
                </div>

                {/* Warm Amber Card */}
                <div 
                    onClick={() => handleNav('pipeline')}
                    className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-[32px] p-8 text-slate-900 relative overflow-hidden group hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer min-h-[280px] flex flex-col justify-between border border-amber-300 ring-4 ring-white shadow-sm"
                >
                     <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-[0.2] rounded-full -ml-20 -mb-20 pointer-events-none blur-3xl"></div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="text-[10px] font-bold bg-black/5 px-3 py-1.5 rounded-lg text-slate-900 backdrop-blur-sm border border-black/5 uppercase tracking-wider">Oct 11 • Pending</div>
                        <button className="bg-black/5 p-2 rounded-full hover:bg-black/10 transition border border-black/5"><MoreHorizontal className="w-5 h-5 text-slate-900" /></button>
                    </div>
                    <div className="space-y-1 relative z-10 mt-auto mb-6">
                        <p className="text-xs font-bold text-slate-900/70 uppercase tracking-wider">Golden Tier</p>
                        <p className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Opportunity</p>
                    </div>
                    <div className="flex items-end justify-between relative z-10">
                         <span className="text-4xl font-bold tracking-tighter text-slate-900">$4.1k</span>
                         <div className="flex -space-x-3 pl-4 pb-1">
                            {[4,5].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-amber-400 object-cover shadow-sm" />)}
                         </div>
                    </div>
                </div>

                {/* Deep Black Card - Show only for Admin/Manager/Sales, else show placeholder */}
                {['Admin', 'Manager', 'Sales'].includes(userRole) ? (
                    <div 
                        onClick={() => handleNav('pipeline')}
                        className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[32px] p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-slate-900/30 transition-all duration-500 hover:-translate-y-1 cursor-pointer min-h-[280px] flex flex-col justify-between border border-slate-800 ring-4 ring-white shadow-sm"
                    >
                        <div className="absolute top-6 right-6 z-20">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                <ArrowUpRight className="w-6 h-6 text-black" />
                            </div>
                        </div>
                        <div className="mt-auto mb-6 space-y-1 relative z-10">
                            <div className="text-[10px] font-bold text-slate-400 mb-4 border border-slate-700 px-2 py-1 rounded-md w-fit uppercase tracking-wider bg-slate-800/50">Oct 12 • Closed</div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absolute</p>
                            <p className="text-3xl font-bold tracking-tight text-white leading-tight">Success Deal</p>
                        </div>
                        <div className="flex items-end justify-between relative z-10">
                             <span className="text-4xl font-bold tracking-tighter text-white">$2.1k</span>
                             <div className="flex -space-x-3 pl-4 pb-1">
                                {[6,7,8].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-slate-900 object-cover shadow-sm" />)}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center border border-slate-200/60 min-h-[280px]">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                            <Lock className="w-6 h-6 text-slate-300" />
                        </div>
                        <h4 className="font-bold text-slate-900">Access Restricted</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-[150px]">Deal details are limited to sales team members.</p>
                    </div>
                )}
            </div>

            {/* Second Row of Content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                 {/* Tasks Schedule */}
                <div 
                    onClick={() => handleNav('tasks')}
                    className="md:col-span-6 bg-white rounded-[32px] p-8 min-h-[380px] border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col cursor-pointer group"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-900 text-xl tracking-tight group-hover:text-blue-600 transition-colors">Tasks Schedule</h4>
                         <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition"><MoreHorizontal className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-3xl p-6 shadow-inner flex-1 flex flex-col justify-center border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition shadow-sm"><ArrowRight className="w-4 h-4 rotate-180" /></button>
                            <span className="font-bold text-slate-900 text-lg tracking-tight">October 2025</span>
                            <button className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition shadow-sm"><ArrowRight className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-2 text-center text-[10px]">
                            {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-slate-400 pb-2 font-bold tracking-wider uppercase">{d}</div>)}
                            {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                <div key={d} className={`py-2 rounded-xl aspect-square flex items-center justify-center font-bold transition-all cursor-pointer text-sm ${d === 20 ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30 scale-105 ring-2 ring-white' : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900'}`}>
                                    {d}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stage Funnel */}
                <div 
                    onClick={() => handleNav('pipeline')}
                    className="md:col-span-6 bg-gradient-to-b from-indigo-50 to-blue-50 rounded-[32px] p-8 min-h-[380px] relative overflow-hidden flex flex-col border border-blue-100 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h4 className="font-bold text-slate-900 text-xl tracking-tight">Stage Funnel</h4>
                         <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition border border-white/50"><MoreHorizontal className="w-5 h-5" /></button>
                        </div>
                    </div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                         <div className="mb-8">
                             <h2 className="text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                                {showFinancials ? '$350k' : '12 Deals'}
                             </h2>
                             <p className="text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-emerald-100"></span>
                                Total in Pipeline
                             </p>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl flex flex-col justify-center shadow-sm border border-white/60 hover:bg-white hover:scale-105 transition duration-300">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qualification</span>
                                 <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {showFinancials ? '$92k' : '4'}
                                 </span>
                             </div>
                             <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl flex flex-col justify-center shadow-sm border border-white/60 hover:bg-white hover:scale-105 transition duration-300">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Negotiation</span>
                                 <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                     {showFinancials ? '$67k' : '3'}
                                 </span>
                             </div>
                         </div>
                    </div>

                    {/* Decorative gradient blur */}
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-400 rounded-full blur-3xl opacity-10 -mr-32 -mb-32 pointer-events-none mix-blend-multiply"></div>
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full blur-3xl opacity-10 -ml-16 -mt-10 pointer-events-none mix-blend-multiply"></div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
