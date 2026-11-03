import React from 'react';
import { LayoutDashboard, Kanban, Settings, LogOut, Sparkles, Command, Users, CheckSquare, ShoppingBag, Banknote, Building2, FileText, PieChart, FileCheck, MessageCircle } from 'lucide-react';
import { ViewState, UserRole, SystemConfig } from '../types';

interface SidebarProps { currentView: ViewState; onChangeView: (view: ViewState) => void; userRole: UserRole; systemConfig: SystemConfig; }

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, systemConfig }) => {
  const groups = [
    { title: 'WORKSPACE', items: [
      { id:'dashboard',label:'Dashboard',icon:LayoutDashboard,roles:['Admin','Manager','Sales','Viewer'] },
      { id:'pipeline',label:'Sales pipeline',icon:Kanban,roles:['Admin','Manager','Sales'] },
      { id:'clients',label:'Customers',icon:Users,roles:['Admin','Manager','Sales','Viewer'] },
      { id:'channels',label:'Conversations',icon:MessageCircle,roles:['Admin','Manager','Sales'] },
      { id:'tasks',label:'Tasks & follow-ups',icon:CheckSquare,roles:['Admin','Manager','Sales','Viewer'] },
    ]},
    { title: 'MANAGEMENT', items: [
      { id:'financials',label:'Financials',icon:Banknote,roles:['Admin','Manager'] },
      { id:'compliance',label:'Compliance',icon:FileCheck,roles:['Admin','Manager'],module:'compliance' },
      { id:'catalogue',label:'Catalogue',icon:ShoppingBag,roles:['Admin','Manager','Sales'] },
    ]},
    { title: 'PLATFORM', items: [
      { id:'system-overview',label:'Overview',icon:PieChart,roles:['SystemOwner'] },
      { id:'system-tenants',label:'Tenants',icon:Building2,roles:['SystemOwner'] },
      { id:'system-financials',label:'Global finance',icon:Banknote,roles:['SystemOwner'] },
      { id:'system-approvals',label:'Approvals',icon:FileText,roles:['SystemOwner'] },
    ]}
  ];
  return <aside className="hidden md:flex fixed left-5 top-5 bottom-5 z-50 w-[248px] flex-col rounded-[22px] border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_35px_rgba(15,23,42,0.05)]">
    <button onClick={()=>onChangeView(userRole==='SystemOwner'?'system-overview':'dashboard')} className="mb-9 flex items-center gap-3 px-2 text-left">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17264a] text-white"><Command className="h-5 w-5"/></span>
      <span><span className="block text-[16px] font-bold tracking-tight text-slate-900">Amplify<span className="text-blue-600">CRM</span></span><span className="mt-0.5 block text-[10px] font-medium text-slate-400">CUSTOMER OPERATIONS</span></span>
    </button>
    <nav className="flex-1 space-y-7 overflow-y-auto">
      {groups.map(group=>{const items=group.items.filter(item=>item.roles.includes(userRole)&&(!item.module||systemConfig.modules[item.module as keyof typeof systemConfig.modules]));if(!items.length)return null;return <div key={group.title}><p className="mb-2 px-3 text-[9px] font-bold tracking-[0.16em] text-slate-400">{group.title}</p><div className="space-y-1">{items.map(item=>{const Icon=item.icon;const active=currentView===item.id;return <button key={item.id} onClick={()=>onChangeView(item.id as ViewState)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold transition ${active?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className={`h-[17px] w-[17px] ${active?'text-blue-600':'text-slate-400 group-hover:text-slate-600'}`}/>{item.label}{active&&<span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600"/>}</button>})}</div></div>})}
    </nav>
    {['Admin','Manager','Sales'].includes(userRole)&&systemConfig.modules.leadAcquisition&&<button onClick={()=>onChangeView('lead-acquisition')} className={`mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold ${currentView==='lead-acquisition'?'bg-blue-50 text-blue-700':'bg-slate-50 text-slate-700 hover:bg-blue-50'}`}><Sparkles className="h-4 w-4 text-blue-600"/>AI lead acquisition</button>}
    <div className="border-t border-slate-100 pt-3"><button onClick={()=>onChangeView('settings')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Settings className="h-4 w-4 text-slate-400"/>Settings</button><p className="px-3 pt-3 text-[10px] text-slate-400">{userRole==='SystemOwner'?'Platform owner':'Workspace'} access</p></div>
  </aside>;
};
export default Sidebar;
