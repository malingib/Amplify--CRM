
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Pipeline from './components/Pipeline';
import ProposalBuilder from './components/ProposalBuilder';
import WhatsAppChat from './components/WhatsAppChat';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Tasks from './components/Tasks';
import Clients from './components/Clients';
import AICommandCenter from './components/AICommandCenter';
import { ViewState, Lead, UserRole } from './types';
import { Bell, Search, Menu, User, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  
  // State to hold the lead data when navigating from Pipeline -> Proposal
  const [proposalLead, setProposalLead] = useState<Lead | null>(null);
  const [proposalMode, setProposalMode] = useState<'create' | 'edit'>('create');

  const handleCreateProposal = (lead: Lead, mode: 'create' | 'edit' = 'create') => {
    setProposalLead(lead);
    setProposalMode(mode);
    setCurrentView('proposals');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard userRole={userRole} />;
      case 'pipeline': return <Pipeline onCreateProposal={handleCreateProposal} />;
      case 'tasks': return <Tasks />;
      case 'clients': return <Clients />;
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
      case 'whatsapp': return <WhatsAppChat />;
      case 'profile': return <Profile userRole={userRole} onRoleChange={setUserRole} />;
      case 'settings': return <Settings />;
      default: return <Dashboard userRole={userRole} />;
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
                    <button onClick={() => {setCurrentView('dashboard'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Dashboard</button>
                    {['Admin', 'Manager', 'Sales'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('pipeline'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Pipeline</button>
                    )}
                    <button onClick={() => {setCurrentView('clients'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Clients</button>
                    <button onClick={() => {setCurrentView('tasks'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">Tasks</button>
                    {['Admin', 'Manager', 'Sales'].includes(userRole) && (
                      <button onClick={() => {setCurrentView('whatsapp'); setIsMobileMenuOpen(false)}} className="py-3 text-left font-bold text-slate-600 border-b border-slate-100 hover:text-slate-900 transition text-base">WhatsApp</button>
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
                    <input type="text" placeholder="Search everything..." className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-900 placeholder:text-slate-400 font-semibold" />
                </div>
            </div>

            <div className="flex items-center gap-8">
                 <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                    <Shield className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{userRole} View</span>
                 </div>
                 
                <button className="relative p-3 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-md rounded-xl transition border border-transparent hover:border-slate-100">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                </button>
                
                <button 
                    onClick={() => setCurrentView('profile')}
                    className={`w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg ${currentView === 'profile' ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-white text-slate-900 border border-slate-100 hover:border-slate-200'}`}
                >
                    <User className="w-5 h-5" />
                </button>
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