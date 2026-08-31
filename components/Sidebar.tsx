
import React from 'react';
import { LayoutDashboard, Kanban, Settings, LogOut, Sparkles, Command, Users, CheckSquare, ShoppingBag, Banknote, ShieldCheck, Building2, FileText, PieChart, FileCheck, MessageCircle } from 'lucide-react';
import { ViewState, UserRole, SystemConfig } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: UserRole;
  systemConfig: SystemConfig;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, systemConfig }) => {
  
  const allMenuItems = [
    // Regular User Items
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    
    // Conditionally rendered modules
    { id: 'channels', label: 'Channels', icon: MessageCircle, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'financials', label: 'Financials', icon: Banknote, roles: ['Admin', 'Manager'] },
    { id: 'compliance', label: 'Compliance', icon: FileCheck, roles: ['Admin', 'Manager'], module: 'compliance' },
    { id: 'catalogue', label: 'Catalogue', icon: ShoppingBag, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    
    // System Owner Specific Items
    { id: 'system-overview', label: 'Overview', icon: PieChart, roles: ['SystemOwner'] },
    { id: 'system-tenants', label: 'Tenants', icon: Building2, roles: ['SystemOwner'] },
    { id: 'system-financials', label: 'Global Finance', icon: Banknote, roles: ['SystemOwner'] },
    { id: 'system-approvals', label: 'Approvals', icon: FileText, roles: ['SystemOwner'] },

    // Shared / Settings
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'SystemOwner'] },
  ];

  const visibleItems = allMenuItems.filter(item => {
    // Role check
    if (!item.roles.includes(userRole)) return false;
    
    // Module configuration check
    if (item.module) {
        // @ts-ignore - Dynamic key access
        if (!systemConfig.modules[item.module]) return false;
    }
    
    return true;
  });

  return (
    <div className="hidden md:flex flex-col fixed left-6 top-6 bottom-6 w-20 bg-slate-900 rounded-3xl items-center py-5 z-50">
      {/* Logo */}
      <div 
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-6 hover:scale-110 transition-transform cursor-pointer shrink-0 ${userRole === 'SystemOwner' ? 'bg-purple-600' : 'bg-white'}`} 
        onClick={() => onChangeView(userRole === 'SystemOwner' ? 'system-overview' : 'dashboard')}
      >
         <Command className={`w-5 h-5 ${userRole === 'SystemOwner' ? 'text-white' : 'text-slate-900'}`} />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col space-y-2.5 w-full px-3 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`group relative w-full aspect-square flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-lg' 
                  : 'text-slate-500 hover:bg-white/10 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              
              {/* Tooltip dot for inactive */}
              {!isActive && (
                <span className={`absolute right-2 top-2 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${userRole === 'SystemOwner' ? 'bg-purple-400' : 'bg-emerald-400'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-3 px-3 w-full pt-2">
        {['Admin', 'Manager', 'Sales'].includes(userRole) && systemConfig.modules.leadAcquisition && (
          <button 
            onClick={() => onChangeView('lead-acquisition')}
            className={`w-full aspect-square flex items-center justify-center rounded-full transition-all duration-300 ${
                currentView === 'lead-acquisition' 
                ? 'bg-white text-slate-900 shadow-lg' 
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
            }`}
            title="AI Lead Acquisition"
          >
              <Sparkles className="w-5 h-5" />
          </button>
        )}
        <button 
            onClick={() => window.location.reload()} // Simulate Logout/Reset
            className="w-full aspect-square flex items-center justify-center rounded-full text-slate-500 hover:text-red-400 hover:bg-white/10 transition-colors"
            title="Log Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
