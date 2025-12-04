
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MoreHorizontal, ArrowUpRight, Calendar, ArrowRight, Lock, Filter, Download, ChevronDown, Activity, DollarSign, Target, Briefcase, Clock, RefreshCw, ChevronRight, CreditCard, Layout, Eye } from 'lucide-react';
import { UserRole, ViewState, SystemConfig } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart
} from 'recharts';

// Mock Data for Charts
const revenueData = [
  { name: 'Jan', revenue: 4000, target: 2400, expense: 2000 },
  { name: 'Feb', revenue: 3000, target: 1398, expense: 2200 },
  { name: 'Mar', revenue: 2000, target: 9800, expense: 1800 },
  { name: 'Apr', revenue: 2780, target: 3908, expense: 2400 },
  { name: 'May', revenue: 1890, target: 4800, expense: 2100 },
  { name: 'Jun', revenue: 2390, target: 3800, expense: 2500 },
  { name: 'Jul', revenue: 3490, target: 4300, expense: 3000 },
  { name: 'Aug', revenue: 4200, target: 4500, expense: 3200 },
  { name: 'Sep', revenue: 5100, target: 4800, expense: 3500 },
  { name: 'Oct', revenue: 4800, target: 5000, expense: 3100 },
];

const pipelineStageData = [
  { name: 'Intake', count: 12, value: 450000 },
  { name: 'Qualified', count: 8, value: 920000 },
  { name: 'Proposal', count: 5, value: 1200000 },
  { name: 'Negotiation', count: 3, value: 670000 },
  { name: 'Closed', count: 2, value: 350000 },
];

const leadSourceData = [
  { name: 'Referral', value: 400 },
  { name: 'LinkedIn', value: 300 },
  { name: 'Cold Email', value: 300 },
  { name: 'Website', value: 200 },
];

const teamActivityData = [
  { user: 'Eva Robinson', action: 'Moved deal to Negotiation', target: 'TechSahara', time: '2 mins ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { user: 'John Doe', action: 'Created new proposal', target: 'Wanjiku Trading', time: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' },
  { user: 'Jane Smith', action: 'Completed task', target: 'Q3 Report', time: '3 hours ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  { user: 'System', action: 'Generated invoice', target: '#INV-009', time: '5 hours ago', avatar: '' },
  { user: 'Eva Robinson', action: 'Added new contact', target: 'Peter Koech', time: 'Yesterday', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'];

interface DashboardProps {
    userRole: UserRole;
    onNavigate?: (view: ViewState) => void;
    systemConfig?: SystemConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, onNavigate, systemConfig }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState('This Quarter');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // RBAC for Widgets
  const canSeeFinancials = ['Admin', 'Manager', 'SystemOwner'].includes(userRole);
  const canSeePerformance = ['Admin', 'Manager', 'Sales', 'SystemOwner'].includes(userRole);
  const canSeeActivity = ['Admin', 'Manager', 'SystemOwner', 'Viewer'].includes(userRole);
  const isViewer = userRole === 'Viewer';
  
  // Widget Visibility based on Config AND Role
  const showOverview = systemConfig?.dashboardWidgets?.overview ?? true;
  const showPerformance = (systemConfig?.dashboardWidgets?.performance ?? true) && canSeePerformance;
  const showActivity = (systemConfig?.dashboardWidgets?.activity ?? true) && canSeeActivity;
  const showRevenue = (systemConfig?.dashboardWidgets?.revenue ?? true) && canSeeFinancials;

  // Simulate data fetching on tab/filter change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeTab, timeRange]);

  const handleNav = (view: ViewState) => {
    if (onNavigate) onNavigate(view);
  };

  const RefreshButton = () => (
      <button 
        onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); }}
        className={`p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition ${isLoading ? 'animate-spin text-blue-600' : ''}`}
      >
          <RefreshCw className="w-4 h-4" />
      </button>
  );

  const LoadingSkeleton = () => (
      <div className="animate-pulse space-y-6">
          <div className="h-64 bg-slate-100 rounded-[32px] w-full"></div>
          <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-slate-100 rounded-[32px]"></div>
              <div className="h-48 bg-slate-100 rounded-[32px]"></div>
          </div>
      </div>
  );

  const renderOverview = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-12 space-y-8">
            <div className="flex justify-between items-end px-1">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Focus Items 
                        <RefreshButton />
                    </h3>
                    <p className="text-slate-500 font-medium mt-1 text-sm">High priority items requiring attention.</p>
                </div>
                {['Admin', 'SystemOwner'].includes(userRole) && (
                    <div className="flex gap-2">
                        <button onClick={() => handleNav('settings')} className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition hover:border-slate-300 shadow-sm">
                            <Layout className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? <LoadingSkeleton /> : (
            <>
                {/* The Colored Cards Row */}
                {showOverview && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Royal Blue Card */}
                        {!isViewer ? (
                            <div 
                                onClick={() => handleNav('pipeline')}
                                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[32px] p-8 text-white relative overflow-hidden group hover:shadow-xl hover:shadow-blue-600/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer min-h-[280px] flex flex-col justify-between border border-blue-500/50 ring-4 ring-white shadow-sm"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.05] rounded-full -mr-20 -mt-20 pointer-events-none blur-3xl"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-[10px] font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg text-white ring-1 ring-white/20 uppercase tracking-wider">Oct 4 • Active</div>
                                    <button className="bg-white/10 p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition ring-1 ring-white/10"><ArrowUpRight className="w-5 h-5 text-white" /></button>
                                </div>
                                <div className="space-y-1 relative z-10 mt-auto mb-6">
                                    <p className="text-xs font-bold text-blue-100 uppercase tracking-wider opacity-90">Safaricom PLC</p>
                                    <p className="text-3xl font-bold tracking-tight leading-tight">Enterprise Upgrade</p>
                                </div>
                                <div className="flex items-end justify-between relative z-10">
                                    <span className="text-4xl font-bold tracking-tighter">$11.2k</span>
                                    <div className="flex -space-x-3 pl-4 pb-1">
                                        {[1,2,3].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-blue-600 object-cover shadow-sm" alt="" />)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center border border-slate-200/60 min-h-[280px]">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                    <Eye className="w-6 h-6 text-slate-300" />
                                </div>
                                <h4 className="font-bold text-slate-900">Viewer Mode</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-[150px]">You are in read-only mode. Financial deals are hidden.</p>
                            </div>
                        )}

                        {/* Warm Amber Card */}
                        {!isViewer ? (
                            <div 
                                onClick={() => handleNav('pipeline')}
                                className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-[32px] p-8 text-slate-900 relative overflow-hidden group hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer min-h-[280px] flex flex-col justify-between border border-amber-300 ring-4 ring-white shadow-sm"
                            >
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-[0.2] rounded-full -ml-20 -mb-20 pointer-events-none blur-3xl"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-[10px] font-bold bg-black/5 px-3 py-1.5 rounded-lg text-slate-900 backdrop-blur-sm border border-black/5 uppercase tracking-wider">Oct 11 • Pending</div>
                                    <button className="bg-black/5 p-2 rounded-full hover:bg-black/10 transition border border-black/5"><ArrowUpRight className="w-5 h-5 text-slate-900" /></button>
                                </div>
                                <div className="space-y-1 relative z-10 mt-auto mb-6">
                                    <p className="text-xs font-bold text-slate-900/70 uppercase tracking-wider">Mombasa Marine</p>
                                    <p className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Logistics Hub</p>
                                </div>
                                <div className="flex items-end justify-between relative z-10">
                                    <span className="text-4xl font-bold tracking-tighter text-slate-900">$4.1k</span>
                                    <div className="flex -space-x-3 pl-4 pb-1">
                                        {[4,5].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-amber-400 object-cover shadow-sm" alt="" />)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col min-h-[280px]">
                                 <div className="flex items-center gap-4 mb-6">
                                     <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                         <Clock className="w-6 h-6" />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-slate-900">Recent Updates</h4>
                                         <p className="text-xs text-slate-500">System activity</p>
                                     </div>
                                 </div>
                                 <div className="space-y-4">
                                     <div className="flex items-center gap-3">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                         <p className="text-xs font-medium text-slate-600">Invoice #INV-001 generated</p>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                         <p className="text-xs font-medium text-slate-600">New Client added</p>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                         <p className="text-xs font-medium text-slate-600">Maintenance Scheduled</p>
                                     </div>
                                 </div>
                            </div>
                        )}

                        {/* Deep Black Card */}
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
                                    <div className="text-[10px] font-bold text-slate-400 mb-4 border border-slate-700 px-2 py-1 rounded-md w-fit uppercase tracking-wider bg-slate-800/50">Oct 12 • Closing</div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absolute Systems</p>
                                    <p className="text-3xl font-bold tracking-tight text-white leading-tight">SaaS Contract</p>
                                </div>
                                <div className="flex items-end justify-between relative z-10">
                                    <span className="text-4xl font-bold tracking-tighter text-white">$2.1k</span>
                                    <div className="flex -space-x-3 pl-4 pb-1">
                                        {[6,7,8].map(i => <img key={i} src={`https://picsum.photos/60/60?random=${i}`} className="w-10 h-10 rounded-full border-[2px] border-slate-900 object-cover shadow-sm" alt="" />)}
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
                )}

                {/* Second Row: Charts & Calendar */}
                {showPerformance ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Stage Funnel Chart */}
                        <div className="md:col-span-8 bg-white rounded-[32px] p-8 min-h-[380px] border border-slate-200 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-xl tracking-tight">Pipeline Volume</h4>
                                    <p className="text-xs text-slate-500 font-medium">Deal distribution by stage.</p>
                                </div>
                                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition"><MoreHorizontal className="w-5 h-5" /></button>
                            </div>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pipelineStageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                        <Tooltip 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                            {pipelineStageData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tasks Schedule (Mini) */}
                        <div 
                            onClick={() => handleNav('tasks')}
                            className="md:col-span-4 bg-slate-50 rounded-[32px] p-8 min-h-[380px] border border-slate-100 flex flex-col cursor-pointer group hover:border-slate-200 transition-colors"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-slate-900 text-xl tracking-tight">Today's Tasks</h4>
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                    <Calendar className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-red-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Prepare Q3 Report</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Due: 2:00 PM</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-amber-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Call Alice Kamau</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Due: 4:30 PM</p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 opacity-60">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-through">Team Sync</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Completed</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={(e) => { e.stopPropagation(); handleNav('tasks'); }} className="mt-auto w-full py-3 bg-white text-slate-900 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 text-xs transition flex items-center justify-center gap-2 group/btn">
                                View Calendar <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Alternate View for Viewers/Restricted Roles
                    <div className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Performance Metrics Hidden</h3>
                        <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm">Your current role does not have permission to view detailed sales performance charts and pipeline analytics.</p>
                    </div>
                )}
            </>
            )}
        </div>
      </div>
  );

  const renderRevenue = () => (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {isLoading ? <LoadingSkeleton /> : (
            <>
                {/* Revenue Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-600 rounded-[24px] p-6 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-20">
                             <TrendingUp className="w-16 h-16" />
                         </div>
                         <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Revenue</p>
                         <h3 className="text-3xl font-bold mb-4">KES 12.5M</h3>
                         <div className="flex gap-2">
                             <span className="bg-white/20 px-2 py-1 rounded-lg text-[10px] font-bold">+18% vs Last Month</span>
                         </div>
                    </div>
                    
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm relative">
                         <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full">
                             <CreditCard className="w-5 h-5 text-slate-400" />
                         </div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Invoices</p>
                         <h3 className="text-3xl font-bold text-slate-900 mb-4">KES 850k</h3>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-amber-500 h-full w-[45%]"></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-2 font-bold">12 Invoices Outstanding</p>
                    </div>

                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm relative">
                         <div className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full">
                             <Target className="w-5 h-5 text-slate-400" />
                         </div>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Quarterly Goal</p>
                         <h3 className="text-3xl font-bold text-slate-900 mb-4">82%</h3>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-blue-600 h-full w-[82%]"></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-2 font-bold">KES 2.1M remaining to target</p>
                    </div>
                </div>

                {/* Main Financial Chart */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[450px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg">Cash Flow Analysis</h4>
                            <p className="text-xs text-slate-500 font-medium">Income vs Expenses over time.</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                 <span className="text-[10px] font-bold text-slate-600">Revenue</span>
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                                 <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                 <span className="text-[10px] font-bold text-slate-600">Expenses</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Bar dataKey="expense" barSize={20} fill="#f87171" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="target" stroke="#fbbf24" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </>
           )}
      </div>
  );

  const renderPerformance = () => (
     <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Top KPI Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conversion Rate</p>
                     <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold">+2.4%</span>
                 </div>
                 <p className="text-3xl font-bold text-slate-900">24.8%</p>
                 <p className="text-xs text-slate-400 mt-2 font-medium">Leads to Deals</p>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Deal Size</p>
                     <span className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-[10px] font-bold">-1.2%</span>
                 </div>
                 <p className="text-3xl font-bold text-slate-900">KES 1.2M</p>
                 <p className="text-xs text-slate-400 mt-2 font-medium">Per closed deal</p>
             </div>
             <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sales Cycle</p>
                     <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[10px] font-bold">-3 Days</span>
                 </div>
                 <p className="text-3xl font-bold text-slate-900">18 Days</p>
                 <p className="text-xs text-slate-400 mt-2 font-medium">Avg time to close</p>
             </div>
             <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-lg shadow-slate-900/10">
                 <div className="flex justify-between items-start mb-4">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Won</p>
                     <Activity className="w-4 h-4 text-emerald-400" />
                 </div>
                 <p className="text-3xl font-bold">142</p>
                 <p className="text-xs text-slate-400 mt-2 font-medium">Deals this quarter</p>
             </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Main Chart */}
             <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                 <div className="flex justify-between items-center mb-8">
                     <div>
                        <h4 className="font-bold text-slate-900 text-lg">Sales Trend</h4>
                        <p className="text-xs text-slate-500 font-medium">Revenue vs Targets over time.</p>
                     </div>
                     <select className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none">
                         <option>Last 6 Months</option>
                         <option>This Year</option>
                     </select>
                 </div>
                 <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
             </div>

             {/* Pie Chart */}
             <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
                 <h4 className="font-bold text-slate-900 text-lg mb-2">Lead Sources</h4>
                 <p className="text-xs text-slate-500 font-medium mb-8">Where are your deals coming from?</p>
                 <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={leadSourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {leadSourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-8 text-center">
                        <p className="text-2xl font-bold text-slate-900">1,200</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Leads</p>
                    </div>
                 </div>
             </div>
         </div>
     </div>
  );

  const renderTeamActivity = () => (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">Activity Log</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">Real-time team updates and system alerts.</p>
                    </div>
                    <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filter Log
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {teamActivityData.map((item, idx) => (
                        <div key={idx} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition">
                            {item.avatar ? (
                                <img src={item.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt={item.user} />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm text-slate-900">
                                    <span className="font-bold">{item.user}</span> {item.action} <span className="font-bold text-blue-600">{item.target}</span>
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> {item.time}
                                </p>
                            </div>
                            <button className="p-2 hover:bg-white rounded-lg text-slate-400 transition">
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button className="text-xs font-bold text-blue-600 hover:underline">View All History</button>
                </div>
           </div>
      </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1800px] mx-auto space-y-6 pb-24">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <span className="text-2xl font-bold text-slate-900 whitespace-nowrap tracking-tight">Dashboard</span>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
            <div className="flex gap-2">
                {[
                    showOverview ? 'Overview' : null, 
                    showPerformance ? 'Sales Performance' : null, 
                    showActivity ? 'Team Activity' : null, 
                    showRevenue ? 'Revenue' : null
                ].filter(Boolean).map((item, i) => (
                    <button 
                        key={item} 
                        onClick={() => setActiveTab(item as string)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                            activeTab === item 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                        }`}
                    >
                        {item as string}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden md:block">Last updated: Just now</span>
            <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 font-bold text-xs transition shadow-sm"
                >
                    <Calendar className="w-3.5 h-3.5" />
                    {timeRange}
                    <ChevronDown className="w-3 h-3" />
                </button>
                
                {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                         {['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'].map(range => (
                             <button
                                key={range}
                                onClick={() => { setTimeRange(range); setShowFilterMenu(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition ${timeRange === range ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                             >
                                 {range}
                             </button>
                         ))}
                    </div>
                )}
            </div>
            
            <button className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 text-slate-400 transition">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Stats Row */}
      {showOverview && (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-5">
         {canSeeFinancials ? (
            <div 
                onClick={() => { if(showRevenue) setActiveTab('Revenue') }}
                className={`bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer ${activeTab === 'Revenue' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
            >
                <div className="bg-emerald-50 p-3 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-emerald-100">
                    <DollarSign className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">$1.98M</p>
                </div>
                <div className="h-8 w-16">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData.slice(-5)}>
                             <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                </div>
            </div>
         ) : !isViewer ? (
            <div 
                onClick={() => handleNav('pipeline')}
                className="bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer hover:shadow-md group"
            >
                 <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-blue-100">
                    <Briefcase className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">My Pipeline</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">$245k</p>
                </div>
            </div>
         ) : (
            <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer hover:shadow-md group">
                 <div className="bg-slate-50 p-3 rounded-2xl group-hover:bg-slate-200 transition-colors duration-300 shrink-0 border border-slate-100">
                    <Eye className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Tasks</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">8</p>
                </div>
            </div>
         )}

         <div 
            onClick={() => handleNav('clients')}
            className="bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-purple-50 p-3 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-purple-100">
                <Users className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Customers</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">+89</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-100 shrink-0">+12%</span>
         </div>

         <div 
            onClick={() => handleNav('tasks')}
            className="bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-amber-50 p-3 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-amber-100">
                <Calendar className="w-6 h-6 text-amber-600 group-hover:text-white" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Tasks</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight leading-none">12</p>
            </div>
         </div>
          
         <div className="bg-white p-5 rounded-[24px] flex items-center gap-4 w-full shadow-sm border border-slate-200">
             <div className="bg-slate-50 p-3 rounded-2xl shrink-0 border border-slate-100">
                <Target className="w-6 h-6 text-slate-400" />
             </div>
             <div className="flex-1">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Q4 Goal</p>
                 <div className="flex items-center gap-2">
                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-slate-900 rounded-full" style={{ width: '75%' }}></div>
                     </div>
                     <span className="text-xs font-bold text-slate-900">75%</span>
                 </div>
             </div>
         </div>
      </div>
      )}

      {/* Main Content Area based on Tab */}
      {activeTab === 'Overview' && showOverview && renderOverview()}
      {activeTab === 'Sales Performance' && showPerformance && renderPerformance()}
      {activeTab === 'Team Activity' && showActivity && renderTeamActivity()}
      {activeTab === 'Revenue' && showRevenue && renderRevenue()} 
      
    </div>
  );
};

export default Dashboard;
