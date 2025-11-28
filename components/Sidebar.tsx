

import React from 'react';
import { LayoutDashboard, Kanban, MessageSquare, Settings, LogOut, Sparkles, Command, Users, CheckSquare, ShoppingBag, Banknote } from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole: UserRole;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole }) => {
  
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    { id: 'pipeline', label: 'Pipeline', icon: Kanban, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'clients', label: 'Clients', icon: Users, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    { id: 'financials', label: 'Financials', icon: Banknote, roles: ['Admin', 'Manager'] },
    { id: 'catalogue', label: 'Catalogue', icon: ShoppingBag, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Admin', 'Manager', 'Sales', 'Viewer'] },
    { id: 'bulksms', label: 'Bulk SMS', icon: MessageSquare, roles: ['Admin', 'Manager', 'Sales'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
  ];

  const visibleItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="hidden md:flex flex-col fixed left-6 top-6 bottom-6 w-20 bg-[#1c1c1c] rounded-[40px] items-center py-8 z-50 shadow-2xl shadow-slate-900/20">
      {/* Logo */}
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-12 shadow-lg shadow-white/10 hover:scale-110 transition-transform cursor-pointer" onClick={() => onChangeView('dashboard')}>
         <Command className="w-5 h-5 text-black" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col space-y-4 w-full px-3">
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`group relative w-full aspect-square flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              
              {/* Tooltip dot for inactive */}
              {!isActive && (
                <span className="absolute right-2 top-2 w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 px-3 w-full">
        <button className="w-full aspect-square flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors">
            <Sparkles className="w-5 h-5" />
        </button>
        <button className="w-full aspect-square flex items-center justify-center rounded-full text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;