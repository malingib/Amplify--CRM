
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MoreHorizontal, Calendar, ArrowRight, Lock, Filter, Download, ChevronDown, Activity, DollarSign, Target, Briefcase, Clock, RefreshCw, ChevronRight, CreditCard, Layout, Eye } from 'lucide-react';
import { UserRole, ViewState, SystemConfig } from '../types';
import { dashboardApi } from '../src/api/client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line, ComposedChart
} from 'recharts';

interface DashboardStats {
  leads: { total: number; byStage: { stage: string; count: number; value: number }[] };
  clients: { total: number; active: number };
  revenue: { total: number };
  invoices: { pending: number; overdue: number };
  tasks: { total: number; pending: number; completed: number };
}

interface DashboardActivity {
  id: string;
  type: string;
  content: string;
  performedBy: string;
  leadName?: string;
  date: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'];

interface DashboardProps {
    userRole: UserRole;
    onNavigate?: (view: ViewState) => void;
    systemConfig?: SystemConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, onNavigate, systemConfig }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [timeRange, setTimeRange] = useState('This Quarter');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.activity(),
        ]);
        setStats(statsRes);
        setActivity(activityRes.activity || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const pipelineStageData = stats?.leads.byStage.map(s => ({
    name: s.stage.charAt(0) + s.stage.slice(1).toLowerCase(),
    count: s.count,
    value: s.value,
  })) || [];

  const teamActivityData = activity.slice(0, 5).map(a => ({
    user: a.performedBy,
    action: a.content,
    target: a.leadName || '',
    time: new Date(a.date).toLocaleString(),
    avatar: '',
  }));

  const totalRevenue = stats?.revenue.total || 0;
  const revenueData = [
    { name: 'Jan', revenue: Math.round(totalRevenue * 0.08), target: Math.round(totalRevenue * 0.1), expense: Math.round(totalRevenue * 0.04) },
    { name: 'Feb', revenue: Math.round(totalRevenue * 0.1), target: Math.round(totalRevenue * 0.12), expense: Math.round(totalRevenue * 0.05) },
    { name: 'Mar', revenue: Math.round(totalRevenue * 0.12), target: Math.round(totalRevenue * 0.14), expense: Math.round(totalRevenue * 0.06) },
    { name: 'Apr', revenue: Math.round(totalRevenue * 0.14), target: Math.round(totalRevenue * 0.13), expense: Math.round(totalRevenue * 0.05) },
    { name: 'May', revenue: Math.round(totalRevenue * 0.16), target: Math.round(totalRevenue * 0.15), expense: Math.round(totalRevenue * 0.07) },
    { name: 'Jun', revenue: Math.round(totalRevenue * 0.18), target: Math.round(totalRevenue * 0.17), expense: Math.round(totalRevenue * 0.06) },
  ];

  const leadSourceData = [
    { name: 'Referral', value: Math.round((stats?.leads.total || 0) * 0.35) },
    { name: 'LinkedIn', value: Math.round((stats?.leads.total || 0) * 0.25) },
    { name: 'Cold Email', value: Math.round((stats?.leads.total || 0) * 0.25) },
    { name: 'Website', value: Math.round((stats?.leads.total || 0) * 0.15) },
  ];

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
          <div className="h-64 bg-slate-100 rounded-3xl w-full"></div>
          <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-slate-100 rounded-3xl"></div>
              <div className="h-48 bg-slate-100 rounded-3xl"></div>
          </div>
      </div>
  );

  const renderOverview = () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
        <div className="lg:col-span-12 space-y-4">
            <div className="flex justify-between items-end px-1">
                <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Focus Items 
                        <RefreshButton />
                    </h3>
                    <p className="text-slate-500 font-medium mt-0.5 text-[11px]">High priority items requiring attention.</p>
                </div>
                {['Admin', 'SystemOwner'].includes(userRole) && (
                    <div className="flex gap-1.5">
                        <button onClick={() => handleNav('settings')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition">
                            <Layout className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? <LoadingSkeleton /> : (
            <>
                {/* The Colored Cards Row */}
                {showOverview && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Hero Card — Safaricom Deal */}
                        {!isViewer ? (
                            <div 
                                onClick={() => handleNav('pipeline')}
                                className="bg-slate-900 rounded-2xl p-4 md:p-5 text-white relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[140px] md:min-h-[160px] flex flex-col justify-between border border-slate-800"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white">Safaricom PLC</div>
                                </div>
                                <div className="space-y-0.5 relative z-10 mt-auto">
                                    <p className="text-base md:text-lg font-bold tracking-tight leading-tight">Enterprise Upgrade</p>
                                    <span className="text-2xl md:text-3xl font-bold tracking-tighter">$11.2k</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px]">
                                <Eye className="w-6 h-6 text-slate-300 mb-2" />
                                <h4 className="font-bold text-slate-900 text-xs">Viewer Mode</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Read-only. Deals hidden.</p>
                            </div>
                        )}

                        {/* Secondary Card — Mombasa Marine */}
                        {!isViewer ? (
                            <div 
                                onClick={() => handleNav('pipeline')}
                                className="rounded-2xl p-4 md:p-5 text-slate-900 relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer min-h-[140px] md:min-h-[160px] flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Mombasa Marine</div>
                                </div>
                                <div className="space-y-0.5 relative z-10 mt-auto">
                                    <p className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-tight">Logistics Hub</p>
                                    <span className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900">$4.1k</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 md:p-5 rounded-2xl flex flex-col min-h-[140px] md:min-h-[160px]">
                                 <div className="flex items-center gap-2 mb-3">
                                     <Clock className="w-4 h-4 text-blue-500" />
                                     <h4 className="font-bold text-slate-900 text-xs">Recent Updates</h4>
                                 </div>
                                 <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                         <p className="text-[11px] font-medium text-slate-600">Invoice #INV-001 generated</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                         <p className="text-[11px] font-medium text-slate-600">New Client added</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                         <p className="text-[11px] font-medium text-slate-600">Maintenance Scheduled</p>
                                     </div>
                                 </div>
                            </div>
                        )}

                        {/* Deal Detail Card */}
                        {['Admin', 'Manager', 'Sales'].includes(userRole) ? (
                            <div 
                                onClick={() => handleNav('pipeline')}
                                className="rounded-2xl p-4 md:p-5 text-slate-900 relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer min-h-[140px] md:min-h-[160px] flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">Absolute Systems</div>
                                </div>
                                <div className="mt-auto space-y-0.5 relative z-10">
                                    <p className="text-base md:text-lg font-bold tracking-tight text-slate-900 leading-tight">SaaS Contract</p>
                                    <span className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900">$2.1k</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px]">
                                <Lock className="w-6 h-6 text-slate-300 mb-2" />
                                <h4 className="font-bold text-slate-900 text-xs">Access Restricted</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Limited to sales team.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Second Row: Charts & Calendar */}
                {showPerformance ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Stage Funnel Chart */}
                        <div className="md:col-span-8 rounded-2xl p-4 md:p-6 min-h-[240px] md:min-h-[320px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base tracking-tight">Pipeline Volume</h4>
                                    <p className="text-[11px] text-slate-500 font-medium">Deal distribution by stage.</p>
                                </div>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 w-full min-h-[200px]">
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
                            className="md:col-span-4 rounded-2xl p-4 md:p-6 min-h-[200px] md:min-h-[320px] flex flex-col cursor-pointer group transition-colors"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-900 text-base tracking-tight">Today's Tasks</h4>
                                <Calendar className="w-4 h-4 text-slate-400" />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="p-3 rounded-xl flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Prepare Q3 Report</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Due: 2:00 PM</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Call Alice Kamau</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Due: 4:30 PM</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl flex items-start gap-3 opacity-60">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 line-through">Team Sync</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">Completed</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={(e) => { e.stopPropagation(); handleNav('tasks'); }} className="mt-auto w-full py-2.5 text-slate-900 font-bold rounded-xl hover:bg-slate-100 text-xs transition flex items-center justify-center gap-2 group/btn">
                                View Calendar <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ) : (
                    // Alternate View for Viewers/Restricted Roles
                    <div className="p-8 rounded-2xl text-center">
                        <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-900">Performance Metrics Hidden</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mx-auto text-xs">Your current role does not have permission to view detailed sales performance charts.</p>
                    </div>
                )}
            </>
            )}
        </div>
      </div>
  );

  const renderRevenue = () => (
      <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {isLoading ? <LoadingSkeleton /> : (
            <>
                {/* Revenue Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-600 rounded-2xl p-4 md:p-5 text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-5 opacity-20">
                             <TrendingUp className="w-14 h-14" />
                         </div>
                         <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Revenue</p>
                         <h3 className="text-xl md:text-2xl font-bold mb-2">KES 12.5M</h3>
                         <div className="flex gap-2">
                             <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">+18% vs Last Month</span>
                         </div>
                    </div>
                    
                    <div className="rounded-2xl p-4 md:p-5 relative">
                         <div className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg">
                             <CreditCard className="w-4 h-4 text-slate-400" />
                         </div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Invoices</p>
                         <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">KES 850k</h3>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-amber-500 h-full w-[45%]"></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1.5 font-bold">12 Invoices Outstanding</p>
                    </div>

                    <div className="rounded-2xl p-4 md:p-5 relative">
                         <div className="absolute top-4 right-4 p-1.5 bg-slate-100 rounded-lg">
                             <Target className="w-4 h-4 text-slate-400" />
                         </div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quarterly Goal</p>
                         <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">82%</h3>
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-blue-600 h-full w-[82%]"></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1.5 font-bold">KES 2.1M remaining to target</p>
                    </div>
                </div>

                {/* Main Financial Chart */}
                <div className="rounded-2xl p-4 md:p-6 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="font-bold text-slate-900 text-base">Cash Flow Analysis</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Income vs Expenses over time.</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                 <span className="text-[10px] font-bold text-slate-600">Revenue</span>
                             </div>
                             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                                 <div className="w-2 h-2 bg-red-400 rounded-full"></div>
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
     <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Top KPI Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             <div className="p-3 md:p-4 rounded-2xl">
                 <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Leads</p>
                     <TrendingUp className="w-4 h-4 text-blue-500" />
                 </div>
                 <p className="text-lg md:text-2xl font-bold text-slate-900">{stats?.leads.total || 0}</p>
                 <p className="text-[10px] text-slate-400 mt-0.5 font-medium">In pipeline</p>
             </div>
             <div className="p-3 md:p-4 rounded-2xl">
                 <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</p>
                     <DollarSign className="w-4 h-4 text-emerald-500" />
                 </div>
                 <p className="text-lg md:text-2xl font-bold text-slate-900">KES {((stats?.revenue.total || 0) / 1000).toFixed(0)}k</p>
                 <p className="text-[10px] text-slate-400 mt-0.5 font-medium">All time</p>
             </div>
             <div className="p-3 md:p-4 rounded-2xl">
                 <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Clients</p>
                     <Users className="w-4 h-4 text-purple-500" />
                 </div>
                 <p className="text-lg md:text-2xl font-bold text-slate-900">{stats?.clients.active || 0}</p>
                 <p className="text-[10px] text-slate-400 mt-0.5 font-medium">of {stats?.clients.total || 0} total</p>
             </div>
             <div className="bg-slate-900 text-white p-3 md:p-4 rounded-2xl">
                 <div className="flex justify-between items-start mb-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                     <Activity className="w-4 h-4 text-amber-400" />
                 </div>
                 <p className="text-lg md:text-2xl font-bold">{stats?.tasks.pending || 0}</p>
                 <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{stats?.tasks.completed || 0} completed</p>
             </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
             {/* Main Chart */}
             <div className="lg:col-span-2 rounded-2xl p-4 md:p-6 min-h-[240px] md:min-h-[320px] flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                     <div>
                        <h4 className="font-bold text-slate-900 text-base">Sales Trend</h4>
                        <p className="text-[11px] text-slate-500 font-medium">Revenue vs Targets over time.</p>
                     </div>
                     <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 outline-none">
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
             <div className="rounded-2xl p-4 md:p-6 min-h-[240px] md:min-h-[320px] flex flex-col">
                 <h4 className="font-bold text-slate-900 text-base mb-1">Lead Sources</h4>
                 <p className="text-[11px] text-slate-500 font-medium mb-4">Where are your deals coming from?</p>
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
      <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="rounded-2xl overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-slate-900 text-base">Activity Log</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Real-time team updates and system alerts.</p>
                    </div>
                    <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Filter
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {teamActivityData.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition">
                            {item.avatar ? (
                                <img src={item.avatar} className="w-8 h-8 rounded-full object-cover" alt={item.user} />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-900">
                                    <span className="font-bold">{item.user}</span> {item.action} <span className="font-bold text-blue-600">{item.target}</span>
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {item.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 text-center">
                    <button className="text-[11px] font-bold text-blue-600 hover:underline">View All History</button>
                </div>
           </div>
      </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-4 pb-24">
      {/* Top Navigation / Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <span className="text-xl font-bold text-slate-900 whitespace-nowrap tracking-tight">Dashboard</span>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="flex gap-1.5">
                {[
                    showOverview ? 'Overview' : null, 
                    showPerformance ? 'Sales Performance' : null, 
                    showActivity ? 'Team Activity' : null, 
                    showRevenue ? 'Revenue' : null
                ].filter(Boolean).map((item, i) => (
                    <button 
                        key={item} 
                        onClick={() => setActiveTab(item as string)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap border ${
                            activeTab === item 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                        {item as string}
                    </button>
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400 hidden md:block">Last updated: Just now</span>
            <div className="relative">
                <button 
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500 font-bold text-[11px] transition"
                >
                    <Calendar className="w-3 h-3" />
                    {timeRange}
                    <ChevronDown className="w-2.5 h-2.5" />
                </button>
                
                {showFilterMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                         {['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'].map(range => (
                             <button
                                key={range}
                                onClick={() => { setTimeRange(range); setShowFilterMenu(false); }}
                                className={`w-full text-left px-3 py-2 text-[11px] font-bold hover:bg-slate-50 transition ${timeRange === range ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                             >
                                 {range}
                             </button>
                         ))}
                    </div>
                )}
            </div>
            
            <button className="p-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-400 transition">
                <Filter className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {/* Stats Row */}
      {showOverview && (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
         {canSeeFinancials ? (
            <div 
                onClick={() => { if(showRevenue) setActiveTab('Revenue') }}
                className={`p-3 rounded-2xl flex items-center gap-3 w-full hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer ${activeTab === 'Revenue' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
            >
                <div className="bg-emerald-50 p-2 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-emerald-100">
                    <DollarSign className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Revenue</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">$1.98M</p>
                </div>
                <div className="h-6 w-12 shrink-0">
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
                className="p-3 rounded-2xl flex items-center gap-3 w-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer hover:shadow-md group"
            >
                 <div className="bg-blue-50 p-2 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-blue-100">
                    <Briefcase className="w-5 h-5 text-blue-600 group-hover:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">My Pipeline</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">$245k</p>
                </div>
            </div>
         ) : (
            <div className="p-3 rounded-2xl flex items-center gap-3 w-full transition-all duration-300 hover:-translate-y-0.5 cursor-pointer hover:shadow-md group">
                 <div className="bg-slate-50 p-2 rounded-xl group-hover:bg-slate-200 transition-colors duration-300 shrink-0 border border-slate-100">
                    <Eye className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Assigned Tasks</p>
                    <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">8</p>
                </div>
            </div>
         )}

         <div 
            onClick={() => handleNav('clients')}
            className="p-3 rounded-2xl flex items-center gap-3 w-full hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-purple-50 p-2 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-purple-100">
                <Users className="w-5 h-5 text-purple-600 group-hover:text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">New Customers</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">+89</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">+12%</span>
         </div>

         <div 
            onClick={() => handleNav('tasks')}
            className="p-3 rounded-2xl flex items-center gap-3 w-full hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 cursor-pointer"
        >
            <div className="bg-amber-50 p-2 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shrink-0 border border-amber-100">
                <Calendar className="w-5 h-5 text-amber-600 group-hover:text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Pending Tasks</p>
                <p className="text-lg font-bold text-slate-900 tracking-tight leading-none">12</p>
            </div>
         </div>
          
         <div className="p-3 rounded-2xl flex items-center gap-3 w-full">
             <div className="bg-slate-50 p-2 rounded-xl shrink-0 border border-slate-100">
                <Target className="w-5 h-5 text-slate-400" />
             </div>
             <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Q4 Goal</p>
                 <div className="flex items-center gap-2">
                     <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-slate-900 rounded-full" style={{ width: '75%' }}></div>
                     </div>
                     <span className="text-[11px] font-bold text-slate-900">75%</span>
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
