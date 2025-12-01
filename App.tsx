

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import ProposalBuilder from './components/ProposalBuilder';
import BulkSMS from './components/BulkSMS';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Tasks from './components/Tasks';
import Clients from './components/Clients';
import Catalogue from './components/Catalogue';
import Financials from './components/Financials';
import AICommandCenter from './components/AICommandCenter';
import SystemDashboard from './components/SystemDashboard';
import LeadAcquisition from './components/LeadAcquisition';
import { ViewState, Lead, UserRole, DealStage } from './types';
import { Bell, Search, Menu, User, Shield, Check, X, Clock, LogIn } from 'lucide-react';

const initialLeads: Lead[] = [
  { 
    id: '1', 
    name: 'Wanjiku Trading', 
    company: 'Wanjiku Ltd', 
    value: 450000, 
    stage: DealStage.QUALIFIED, 
    lastContact: '2023-10-25', 
    probability: 60, 
    avatar: 'https://picsum.photos/100/100?random=1',
    email: 'info@wanjiku.co.ke',
    phone: '+254 711 222 333',
    notes: 'Interested in bulk import of textiles. Requires logistics support from Mombasa to Nairobi.',
    proposalStatus: 'None',
    qualificationScore: 78,
    qualificationSummary: 'Strong budget indicators and clear timeline, but needs verified authority.',
    source: 'Manual',
    order: 0
  },
  { 
    id: '2', 
    name: 'TechSahara', 
    company: 'Sahara Systems', 
    value: 1200000, 
    stage: DealStage.PROPOSAL, 
    lastContact: '2023-10-26', 
    probability: 80, 
    avatar: 'https://picsum.photos/100/100?random=2',
    email: 'procurement@techsahara.com',
    phone: '+254 722 444 555',
    notes: 'Looking for a custom CRM solution with M-Pesa integration. Budget is flexible but timeline is tight.',
    proposalStatus: 'Sent',
    source: 'Referral',
    order: 1
  },
  { 
    id: '3', 
    name: 'GreenGrocers', 
    company: 'GG Exporters', 
    value: 85000, 
    stage: DealStage.INTAKE, 
    lastContact: '2023-10-27', 
    probability: 20, 
    avatar: 'https://picsum.photos/100/100?random=3',
    email: 'orders@greengrocers.ke',
    phone: '+254 733 666 777',
    notes: 'Initial inquiry about cold chain logistics software.',
    proposalStatus: 'None',
    source: 'Manual',
    order: 2
  },
  { 
    id: '4', 
    name: 'Nairobi Logistics', 
    company: 'NL Group', 
    value: 3400000, 
    stage: DealStage.NEGOTIATION, 
    lastContact: '2023-10-24', 
    probability: 90, 
    avatar: 'https://picsum.photos/100/100?random=4',
    email: 'director@nlogistics.com',
    phone: '+254 744 888 999',
    notes: 'Finalizing contract terms. Legal team is reviewing the SLA.',
    proposalStatus: 'Sent',
    source: 'Manual',
    order: 3
  },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  
  // Global Data State
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  // Helper to add leads from LeadAcquisition or Pipeline
  const addLead = (lead: Lead) => {
    // Assign order to new lead (append to end)
    const maxOrder = leads.length > 0 ? Math.max(...leads.map(l => l.order || 0)) : 0;
    setLeads(prev => [...prev, { ...lead, order: maxOrder + 1 }]);
  };

  const updateLeadList = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
  };

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Lead Assigned', desc: 'Wanjiku Trading was assigned to you.', time: '2 min ago', type: 'lead', read: false },
    { id: 2, title: 'Task Due Soon', desc: 'Prepare Q3 Report is due in 2 hours.', time: '1 hour ago', type: 'task', read: false },
    { id: 3, title: 'System Update', desc: 'Maintenance scheduled for tonight.', time: '5 hours ago', type: 'system', read: false }
  ]);

  const markAsRead = (id: number) => {
      setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllRead = () => {
      setNotifications([]);
  };
  
  // State to hold the lead data when navigating from Pipeline -> Proposal
  const [proposalLead, setProposalLead] = useState<Lead | null>(null);
  const [proposalMode, setProposalMode] = useState<'create' | 'edit'>('create');

  const handleCreateProposal = (lead: Lead, mode: 'create' | 'edit' = 'create') => {
    setProposalLead(lead);
    setProposalMode(mode);
    setCurrentView('proposals');
  };

  const handleRoleChange = (role: UserRole) => {
      setUserRole(role);
      // Redirect SystemOwner to their dashboard overview, and others to regular dashboard
      if (role === 'SystemOwner') {
          setCurrentView('system-overview');
      } else {
          setCurrentView('dashboard');
      }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
  };

  const handleLogin = () => {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
      return (
          <div className="h-screen w-full bg-[#f3f5f8] flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md text-center border border-slate-200">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-slate-900/20">
                      <LogIn className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
                  <p className="text-slate-500 font-medium mt-2 text-sm">Sign in to access your CRM workspace.</p>
                  
                  <div className="space-y-4 mt-8">
                      <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition text-sm" />
                      <input type="password" placeholder="Password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-100 transition text-sm" />
                      <button onClick={handleLogin} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 active:scale-95">
                          Sign In
                      </button>
                  </div>
                  <p className="mt-8 text-xs text-slate-400 font-bold">Amplify CRM v2.0 • Enterprise Edition</p>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard userRole={userRole} onNavigate={setCurrentView} />;
      
      // System Owner Routes
      case 'system-overview': return <SystemDashboard activeTab="overview" />;
      case 'system-tenants': return <SystemDashboard activeTab="tenants" />;
      case 'system-financials': return <SystemDashboard activeTab="tenants" />; // Fallback or implement specific view
      case 'system-approvals': return <SystemDashboard activeTab="approvals" />;

      case 'pipeline': return (
        <Pipeline 
            onCreateProposal={handleCreateProposal} 
            leads={leads}
            onUpdateLeads={updateLeadList}
            onNavigateToAcquisition={() => setCurrentView('lead-acquisition')}
        />
      );
      case 'tasks': return <Tasks />;
      case 'clients': return <Clients />;
      case 'catalogue': return <Catalogue />;
      case 'financials': return <Financials />;
      case 'proposals': return (
        <ProposalBuilder 
            initialData={proposalLead} 
            mode={proposalMode}
            onBack={() => {
                setProposalLead(null);
                setCurrentView('pipeline');
            }} 
        />
      );
      case 'bulksms': return <BulkSMS />;
      case 'profile': return <Profile userRole={userRole} onRoleChange={handleRoleChange} />;
      case 'settings': return <Settings />;
      case 'lead-acquisition': return <LeadAcquisition onAddLead={addLead} />;
      default: return <Dashboard userRole={userRole} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f5f8] font-sans overflow-hidden text-slate-900 relative selection:bg-slate-900 selection:text-white">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} userRole={userRole} />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
             <div className="h-full w-72 bg-white shadow-2xl flex flex-col p-6" onClick={e => e.stopPropagation()}>
                 <div className="font-bold mb-8 text-2xl text-slate-900 tracking-tight">Menu</div>
                 <div className="flex flex-col gap-2">
                    {userRole !== 'SystemOwner' && (
                       <button onClick={() => {setCurrentView('dashboard'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Dashboard</button>
                    )}
                    
                    {userRole === 'SystemOwner' && (
                        <>
                          <button onClick={() => {setCurrentView('system-overview'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Overview</button>
                          <button onClick={() => {setCurrentView('system-tenants'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Tenants</button>
                          <button onClick={() => {setCurrentView('system-financials'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Financials</button>
                          <button onClick={() => {setCurrentView('system-approvals'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Approvals</button>
                        </>
                    )}

                    {['Admin', 'Manager', 'Sales'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('pipeline'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Pipeline</button>
                    )}
                    <button onClick={() => {setCurrentView('clients'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Clients</button>
                    {['Admin', 'Manager'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('financials'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Financials</button>
                    )}
                    {['Admin', 'Manager', 'Sales'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('catalogue'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Catalogue</button>
                    )}
                    <button onClick={() => {setCurrentView('tasks'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Tasks</button>
                    {['Admin', 'Manager', 'Sales'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('bulksms'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Bulk SMS</button>
                    )}
                    <button onClick={() => {setCurrentView('profile'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Profile</button>
                    {userRole === 'Admin' && (
                      <button onClick={() => {setCurrentView('settings'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Settings</button>
                    )}
                 </div>
             </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:ml-24 transition-all duration-300 h-screen relative z-0">
        {/* Header */}
        <header className="h-24 flex items-center justify-between px-8 lg:px-12 shrink-0 pt-4 pb-2">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 p-2 hover:bg-white hover:shadow-sm rounded-xl transition">
                    <Menu className="w-6 h-6" />
                </button>
                
                <div className="hidden md:flex items-center bg-white rounded-2xl px-5 py-3 shadow-sm border border-slate-200 w-[400px] focus-within:ring-4 focus-within:ring-slate-100 transition-all duration-300 hover:shadow-md group">
                    <Search className="w-4 h-4 text-slate-400 mr-3 group-focus-within:text-slate-900 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search everything..." 
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-900 placeholder:text-slate-400 font-semibold" 
                    />
                </div>
            </div>

            <div className="flex items-center gap-8 relative">
                 <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border ${
                     userRole === 'SystemOwner' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-600'
                 }`}>
                    <Shield className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{userRole === 'SystemOwner' ? 'System Owner' : userRole + ' View'}</span>
                 </div>
                 
                <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={`relative p-3 rounded-xl transition border hover:shadow-md ${isNotificationsOpen ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 hover:bg-white hover:text-slate-700 border-transparent hover:border-slate-100'}`}
                >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>}
                </button>
                
                {isNotificationsOpen && (
                    <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h4 className="font-bold text-slate-900">Notifications</h4>
                            <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((notif) => (
                                <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer flex gap-3 group relative">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        notif.type === 'lead' ? 'bg-blue-50 text-blue-600' : 
                                        notif.type === 'task' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                                    }`}>
                                        {notif.type === 'lead' ? <User className="w-5 h-5" /> : 
                                         notif.type === 'task' ? <Clock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{notif.time}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-600 transition shadow-sm"
                                        title="Mark as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-bold">No new notifications</p>
                                </div>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                                <button onClick={markAllRead} className="text-xs font-bold text-blue-600 hover:underline">Mark all as read</button>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="relative group">
                    <button 
                        onClick={() => setCurrentView('profile')}
                        className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg ${currentView === 'profile' ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-white text-slate-900 border border-slate-100 hover:border-slate-200'}`}
                    >
                        <User className="w-5 h-5" />
                    </button>
                    {/* Tooltip Logout for Desktop quick access */}
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                        <button 
                            onClick={handleLogout}
                            className="bg-white text-slate-700 px-4 py-2 rounded-xl shadow-xl border border-slate-100 text-xs font-bold whitespace-nowrap hover:bg-red-50 hover:text-red-600 transition"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
            {renderContent()}
        </div>

        {/* Floating AI Command Center */}
        <AICommandCenter />

      </main>
    </div>
  );
};

export default App;