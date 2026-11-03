
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import ProposalBuilder from './components/ProposalBuilder';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Tasks from './components/Tasks';
import Clients from './components/Clients';
import Catalogue from './components/Catalogue';
import Financials from './components/Financials';
import AICommandCenter from './components/AICommandCenter';
import SystemDashboard from './components/SystemDashboard';
import LeadAcquisition from './components/LeadAcquisition';
import EtimsCompliance from './components/EtimsCompliance';
import Channels from './components/Channels';
import { AuthProvider, useAuth } from './components/AuthProvider';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: { theme: string; size: string; text?: string; width?: string }) => void;
          cancel: () => void;
        };
      };
    };
  }
}
import { ViewState, Lead, UserRole, DealStage, SystemConfig, Client, CatalogueItem } from './types';
import { Bell, Search, Menu, User as UserIcon, Shield, Check, X, Clock, LogIn, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useToast } from './components/Toast';
import { leadsApi, clientsApi, catalogueApi } from './src/api/client';
import { useWebSocket } from './src/hooks/useWebSocket';

const defaultSystemConfig: SystemConfig = {
  modules: { leadAcquisition: true, compliance: true, bulkSms: true, telegram: true, whatsapp: true, googleChat: true },
  crm: { autoConvert: false, stagnationAlertDays: 7, defaultView: 'board' },
  finance: { vatRate: 16, invoiceDueDays: 14, currency: 'KES' },
  security: { require2FA: true, sessionTimeout: 30 },
  notifications: {
    leadAssigned: { email: true, sms: false, inApp: true },
    invoicePaid: { email: true, sms: true, inApp: true },
    taskDue: { email: true, sms: false, inApp: true },
    systemUpdate: { email: false, sms: false, inApp: true },
  },
  workspace: {
    companyName: 'Amplify CRM',
    timezone: 'Africa/Nairobi',
    dateFormat: 'DD/MM/YYYY',
    primaryColor: '#0f172a',
    kraPin: '',
  },
  dashboardWidgets: { overview: true, performance: true, activity: true, revenue: true },
  telegramConfig: { botToken: '', chatId: '' },
  mpesaConfig: { consumerKey: '', consumerSecret: '', shortcode: '', passkey: '' },
  paystackConfig: { publicKey: '', secretKey: '' },
  mobiwaveConfig: { apiKey: '', senderId: '' },
  googleWorkspace: { clientId: '', allowedDomain: '', chatEnabled: true }
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, login, logout, googleLogin } = useAuth();
  const { addToast } = useToast();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // WebSocket for real-time updates
  useWebSocket({
    onLeadUpdate: (data) => {
      const normalized = data.lead ? normalizeLead(data.lead) : data.lead;
      if (data.action === 'deleted') {
        setLeads(prev => prev.filter(l => l.id !== data.lead.id));
      } else {
        setLeads(prev => prev.map(l => l.id === normalized.id ? { ...l, ...normalized } : l));
      }
    },
    onTaskUpdate: (data) => {
      // Tasks are managed in their own component, but we can refresh if needed
    },
    onInvoiceUpdate: (data) => {
      // Invoices are managed in Financials component
    },
    onNotification: (data) => {
      addToast(data.message || 'New notification', data.type === 'workflow' ? 'info' : 'info');
    },
  });

  // Sync user role from auth
  useEffect(() => {
    if (user) {
      setUserRole(user.role as UserRole);
    }
  }, [user]);

  // Normalize DealStage from API format to frontend format
  const normalizeStage = (stage: string): string => {
    const map: Record<string, string> = {
      'INTAKE': 'Intake',
      'QUALIFIED': 'Qualified',
      'PROPOSAL': 'Proposal',
      'NEGOTIATION': 'Negotiation',
      'CLOSED': 'Closed',
      'LOST': 'Lost',
    };
    return map[stage] || stage;
  };

  const normalizeLead = (lead: any): Lead => ({
    ...lead,
    stage: normalizeStage(lead.stage) as any,
    lastContact: lead.lastContact ? new Date(lead.lastContact).toISOString().split('T')[0] : '',
    socials: {
      linkedin: lead.linkedin || '',
      twitter: lead.twitter || '',
      website: lead.website || '',
      facebook: lead.facebook || '',
      instagram: lead.instagram || '',
    },
    painPoints: lead.painPoints ? (() => { try { return JSON.parse(lead.painPoints); } catch { return typeof lead.painPoints === 'string' ? [lead.painPoints] : []; } })() : [],
    nextSteps: lead.nextSteps ? (() => { try { return JSON.parse(lead.nextSteps); } catch { return typeof lead.nextSteps === 'string' ? [lead.nextSteps] : []; } })() : [],
  });

  // Load data from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        const [leadsRes, clientsRes, catalogueRes] = await Promise.all([
          leadsApi.list(),
          clientsApi.list(),
          catalogueApi.list(),
        ]);
        setLeads((leadsRes.leads || []).map(normalizeLead));
        setClients(clientsRes.clients || []);
        setCatalogueItems(catalogueRes.items || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        addToast('Failed to load data from server', 'error');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, addToast]);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ leads: Lead[], clients: Client[], catalogue: CatalogueItem[] }>({ leads: [], clients: [], catalogue: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(globalSearch), 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults({ leads: [], clients: [], catalogue: [] });
      setShowSearchResults(false);
      return;
    }
    const term = debouncedSearch.toLowerCase();
    setSearchResults({
      leads: leads.filter(l => l.name.toLowerCase().includes(term) || l.company.toLowerCase().includes(term)),
      clients: clients.filter(c => c.name.toLowerCase().includes(term) || c.company.toLowerCase().includes(term)),
      catalogue: catalogueItems.filter(i => i.name.toLowerCase().includes(term) || i.description.toLowerCase().includes(term)),
    });
    setShowSearchResults(true);
  }, [debouncedSearch, leads, clients, catalogueItems]);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig);

  const addLead = async (lead: Lead) => {
    try {
      const res = await leadsApi.create(lead);
      setLeads(prev => [...prev, res.lead]);
      addToast('Lead successfully added to pipeline.', 'success');
    } catch (error) {
      addToast('Failed to add lead', 'error');
    }
  };

  const updateLeadList = async (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
  };

  const updateClientList = (updatedClients: Client[]) => setClients(updatedClients);
  const updateCatalogueList = (updatedItems: CatalogueItem[]) => setCatalogueItems(updatedItems);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Lead Assigned', desc: 'Wanjiku Trading was assigned to you.', time: '2 min ago', type: 'lead', read: false },
    { id: 2, title: 'Task Due Soon', desc: 'Prepare Q3 Report is due in 2 hours.', time: '1 hour ago', type: 'task', read: false },
    { id: 3, title: 'System Update', desc: 'Backend API connected successfully.', time: '5 hours ago', type: 'system', read: false }
  ]);

  const markAsRead = (id: number) => setNotifications(notifications.filter(n => n.id !== id));
  const markAllRead = () => setNotifications([]);

  const [proposalLead, setProposalLead] = useState<Lead | null>(null);
  const [proposalMode, setProposalMode] = useState<'create' | 'edit'>('create');

  const handleCreateProposal = (lead: Lead, mode: 'create' | 'edit' = 'create') => {
    setProposalLead(lead);
    setProposalMode(mode);
    setCurrentView('proposals');
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    if (role === 'SystemOwner') setCurrentView('system-overview');
    else setCurrentView('dashboard');
    addToast(`Role switched to ${role}`, 'info');
  };

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully.', 'success');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      addToast('Welcome back!', 'success');
    } catch (error: any) {
      addToast(error.message || 'Login failed', 'error');
    }
  };

  const handleSearchResultClick = (type: 'lead' | 'client' | 'catalogue', id: string) => {
    setGlobalSearch('');
    setShowSearchResults(false);
    if (type === 'lead') setCurrentView('pipeline');
    else if (type === 'catalogue') setCurrentView('catalogue');
    else setCurrentView('clients');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#f3f5f8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500">Loading Amplify CRM...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onGoogleLogin={googleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard userRole={userRole} onNavigate={setCurrentView} systemConfig={systemConfig} />;
      case 'system-overview': return <SystemDashboard activeTab="overview" />;
      case 'system-tenants': return <SystemDashboard activeTab="tenants" />;
      case 'system-financials': return <SystemDashboard activeTab="financials" />;
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
      case 'clients': return <Clients clients={clients} onUpdateClients={updateClientList} />;
      case 'catalogue': return <Catalogue items={catalogueItems} onUpdateItems={updateCatalogueList} />;
      case 'financials': return <Financials />;
      case 'compliance': return <EtimsCompliance />;
      case 'proposals': return (
        <ProposalBuilder
          initialData={proposalLead}
          mode={proposalMode}
          onBack={() => { setProposalLead(null); setCurrentView('pipeline'); }}
        />
      );
      case 'channels': return (
        <Channels leads={leads} onUpdateLeads={updateLeadList} userRole={userRole} />
      );
      case 'profile': return <Profile userRole={userRole} onRoleChange={handleRoleChange} />;
      case 'settings': return <Settings systemConfig={systemConfig} onUpdateConfig={setSystemConfig} />;
      case 'lead-acquisition': return <LeadAcquisition onAddLead={addLead} />;
      default: return <Dashboard userRole={userRole} onNavigate={setCurrentView} systemConfig={systemConfig} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f7fb] font-sans overflow-hidden text-slate-900 relative selection:bg-slate-900 selection:text-white">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} userRole={userRole} systemConfig={systemConfig} />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="h-full w-72 bg-white shadow-2xl flex flex-col p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-xl text-slate-900 tracking-tight">Menu</div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-1">
              {['dashboard', 'pipeline', 'clients', 'channels', 'financials', 'compliance', 'catalogue', 'tasks', 'settings'].map(item => (
                <button
                  key={item}
                  onClick={() => { setCurrentView(item as ViewState); setIsMobileMenuOpen(false); }}
                  className={`py-3 px-3 text-left font-bold rounded-xl transition text-sm ${currentView === item ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col md:ml-[280px] transition-all duration-300 h-screen relative z-0 overflow-hidden">
        {/* Header */}
        <header className="h-auto md:h-24 flex items-center justify-between px-4 md:px-8 lg:px-12 shrink-0 pt-3 pb-3 md:pt-4 md:pb-2 relative z-30">
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 p-2 hover:bg-white hover:shadow-sm rounded-xl transition shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative flex-1 min-w-0 md:flex-none">
              <div className={`flex items-center bg-white rounded-2xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm border ${showSearchResults ? 'border-blue-300 ring-4 ring-blue-100' : 'border-slate-200'} w-full md:w-[400px] transition-all duration-300 hover:shadow-md group`}>
                <Search className="w-4 h-4 text-slate-400 mr-2 md:mr-3 group-focus-within:text-slate-900 transition-colors shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  onFocus={() => { if (debouncedSearch) setShowSearchResults(true); }}
                  className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-900 placeholder:text-slate-400 font-semibold min-w-0"
                />
                {globalSearch && (
                  <button onClick={() => { setGlobalSearch(''); setShowSearchResults(false); }} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {showSearchResults && (
                <div className="absolute top-full left-0 w-[calc(100vw-2rem)] md:w-[400px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 max-h-[60vh]">
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {searchResults.leads.length === 0 && searchResults.clients.length === 0 && searchResults.catalogue.length === 0 ? (
                      <div className="p-8 text-center text-slate-400"><p className="text-xs font-bold">No results found.</p></div>
                    ) : (
                      <>
                        {searchResults.leads.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Leads</div>
                            {searchResults.leads.map(lead => (
                              <div key={lead.id} onClick={() => handleSearchResultClick('lead', lead.id)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition group flex items-center justify-between">
                                <div><p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">{lead.name}</p><p className="text-xs text-slate-500">{lead.company}</p></div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.clients.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clients</div>
                            {searchResults.clients.map(client => (
                              <div key={client.id} onClick={() => handleSearchResultClick('client', client.id)} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 transition group flex items-center justify-between">
                                <div><p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">{client.name}</p><p className="text-xs text-slate-500">{client.company}</p></div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            ))}
                          </div>
                        )}
                        {searchResults.catalogue.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catalogue</div>
                            {searchResults.catalogue.map(item => (
                              <div key={item.id} onClick={() => handleSearchResultClick('catalogue', item.id)} className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-slate-50 transition group flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600"><ShoppingBag className="w-4 h-4" /></div>
                                  <div><p className="text-sm font-bold text-slate-900 group-hover:text-purple-700">{item.name}</p><p className="text-xs text-slate-500 font-bold">KES {item.price.toLocaleString()}</p></div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 lg:gap-8 relative shrink-0">
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border ${userRole === 'SystemOwner' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <Shield className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{userRole === 'SystemOwner' ? 'System Owner' : userRole + ' View'}</span>
            </div>

            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`relative p-3 rounded-xl transition border hover:shadow-md ${isNotificationsOpen ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 hover:bg-white hover:text-slate-700 border-transparent hover:border-slate-100'}`}>
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>}
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-4 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200 max-h-[70vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="font-bold text-slate-900">Notifications</h4>
                  <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer flex gap-3 group relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'lead' ? 'bg-blue-50 text-blue-600' : notif.type === 'task' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                        {notif.type === 'lead' ? <UserIcon className="w-5 h-5" /> : notif.type === 'task' ? <Clock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{notif.time}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-full text-slate-400 hover:text-blue-600 transition shadow-sm" title="Mark as read">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-400"><Bell className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-xs font-bold">No new notifications</p></div>
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
              <button onClick={() => setCurrentView('profile')} className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg ${currentView === 'profile' ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-white text-slate-900 border border-slate-100 hover:border-slate-200'}`}>
                {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" alt={user.name} /> : <UserIcon className="w-5 h-5" />}
              </button>
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                <button onClick={handleLogout} className="bg-white text-slate-700 px-4 py-2 rounded-xl shadow-xl border border-slate-100 text-xs font-bold whitespace-nowrap hover:bg-red-50 hover:text-red-600 transition">
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
          {dataLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : renderContent()}
        </div>

        {/* Floating AI Command Center */}
        {isAuthenticated && (
          <AICommandCenter leads={leads} onUpdateLeads={updateLeadList} userRole={userRole} />
        )}
      </main>
    </div>
  );
};

// ─── Login Screen ──────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginScreen: React.FC<{ onLogin: (email: string, password: string) => Promise<void>; onGoogleLogin: (credential: string) => Promise<void> }> = ({ onLogin, onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await onLogin(email.trim(), password); }
    catch (err: any) { setError(err.message || 'Unable to sign in. Check your details and try again.'); }
    finally { setLoading(false); }
  };
  const handleGoogleCredential = async (response: { credential: string }) => {
    setLoading(true); setError('');
    try { await onGoogleLogin(response.credential); }
    catch (err: any) { setError(err.message || 'Google sign-in failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (GOOGLE_CLIENT_ID && googleBtnRef.current && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
      window.google.accounts.id.renderButton(googleBtnRef.current, { theme: 'outline', size: 'large', text: 'signin_with', width: '340' });
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f5f7fb] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1120px] min-h-[650px] grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] bg-white rounded-[28px] overflow-hidden border border-slate-200 shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#111c36] p-12 text-white">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 20%, #7da6ff 0, transparent 34%), radial-gradient(circle at 90% 80%, #5475d9 0, transparent 35%)'}} />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-[#17264a]"><Command className="w-5 h-5" /></div>
            <span className="text-lg font-bold tracking-tight">Amplify<span className="text-blue-300">CRM</span></span>
          </div>
          <div className="relative z-10 max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-100"><Shield className="h-3.5 w-3.5" /> Your business, in sync</div>
            <h1 className="text-[42px] leading-[1.12] font-semibold tracking-[-0.04em]">A clearer view of every customer relationship.</h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Bring your leads, conversations, sales pipeline and customer operations together in one workspace.</p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><Activity className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-semibold">One connected workspace</p><p className="mt-1 text-xs text-slate-400">Keep teams aligned</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><Shield className="h-5 w-5 text-blue-300" /><p className="mt-3 text-sm font-semibold">Secure access</p><p className="mt-1 text-xs text-slate-400">Role-aware permissions</p></div>
            </div>
          </div>
          <p className="relative z-10 text-xs text-slate-400">© {new Date().getFullYear()} Amplify CRM. All rights reserved.</p>
        </section>
        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-14">
          <div className="w-full max-w-[380px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="h-10 w-10 rounded-xl bg-[#17264a] flex items-center justify-center text-white"><Command className="w-5 h-5" /></div>
              <span className="text-lg font-bold text-slate-900">Amplify<span className="text-blue-600">CRM</span></span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Welcome back</p>
            <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-slate-900">Sign in to Amplify</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Enter your account details to continue to your workspace.</p>
            {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div><label htmlFor="amplify-email" className="mb-2 block text-xs font-semibold text-slate-700">Email address</label><input id="amplify-email" type="email" autoComplete="username" required placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
              <div><label htmlFor="amplify-password" className="mb-2 block text-xs font-semibold text-slate-700">Password</label><input id="amplify-password" type="password" autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17264a] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#22365f] disabled:cursor-not-allowed disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Signing in…' : 'Sign in' }<ArrowRight className="h-4 w-4" /></button>
            </form>
            {GOOGLE_CLIENT_ID && <><div className="my-7 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Or continue with</span><div className="h-px flex-1 bg-slate-200"/></div><div ref={googleBtnRef} className="flex min-h-11 justify-center" /></>}
            <div className="mt-9 border-t border-slate-100 pt-5 text-center"><p className="text-xs text-slate-400">Protected workspace access · Amplify CRM</p></div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── Main App Wrapper ──────────────────────────────────────

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
