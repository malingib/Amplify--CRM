
import React, { useState } from 'react';
import { DealStage, Lead } from '../types';
import { MoreHorizontal, Phone, Calendar, Plus, ArrowRight, Filter } from 'lucide-react';

const initialLeads: Lead[] = [
  { id: '1', name: 'Wanjiku Trading', company: 'Wanjiku Ltd', value: 450000, stage: DealStage.QUALIFIED, lastContact: '2023-10-25', probability: 60, avatar: 'https://picsum.photos/100/100?random=1' },
  { id: '2', name: 'TechSahara', company: 'Sahara Systems', value: 1200000, stage: DealStage.PROPOSAL, lastContact: '2023-10-26', probability: 80, avatar: 'https://picsum.photos/100/100?random=2' },
  { id: '3', name: 'GreenGrocers', company: 'GG Exporters', value: 85000, stage: DealStage.INTAKE, lastContact: '2023-10-27', probability: 20, avatar: 'https://picsum.photos/100/100?random=3' },
  { id: '4', name: 'Nairobi Logistics', company: 'NL Group', value: 3400000, stage: DealStage.NEGOTIATION, lastContact: '2023-10-24', probability: 90, avatar: 'https://picsum.photos/100/100?random=4' },
];

const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const stages = Object.values(DealStage);

  const moveLead = (id: string, currentStage: DealStage) => {
      const stageIndex = stages.indexOf(currentStage);
      if (stageIndex < stages.length - 1) {
          const nextStage = stages[stageIndex + 1];
          setLeads(leads.map(l => l.id === id ? {...l, stage: nextStage} : l));
      }
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6 lg:p-8 overflow-hidden flex flex-col max-w-[1920px] mx-auto">
      <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deals Pipeline</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">Manage your ongoing opportunities and track progress.</p>
          </div>
          <div className="flex gap-3">
              <button className="bg-white text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 border border-slate-200 transition shadow-sm flex items-center gap-2 hover:shadow-md">
                  <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100">
                  <Plus className="w-4 h-4" /> New Deal
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-[1400px] h-full">
            {stages.map((stage) => (
            <div key={stage} className="flex-1 min-w-[300px] flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-sm text-slate-900 tracking-wide uppercase">{stage}</h3>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded-md min-w-[24px] text-center">
                        {leads.filter(l => l.stage === stage).length}
                    </span>
                </div>
                
                <div className="flex-1 bg-slate-100/50 rounded-[32px] p-4 space-y-4 border border-slate-200/60 overflow-y-auto custom-scrollbar">
                    {leads.filter(l => l.stage === stage).map(lead => (
                        <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:shadow-slate-200/40 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={lead.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-[2px] border-slate-50 shadow-sm" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lead.company}</span>
                                    </div>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-50">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Projected Value</p>
                                <p className="text-slate-900 font-bold text-lg tracking-tight">KES {lead.value.toLocaleString()}</p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition hover:text-blue-600 border border-transparent hover:border-slate-200">
                                        <Phone className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition hover:text-blue-600 border border-transparent hover:border-slate-200">
                                        <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                {stage !== DealStage.CLOSED && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); moveLead(lead.id, stage); }}
                                        className="bg-slate-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:bg-slate-700 transform translate-x-2 group-hover:translate-x-0 hover:scale-110"
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold hover:border-slate-300 hover:text-slate-600 hover:bg-white transition flex items-center justify-center gap-2 group text-xs">
                        <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add Deal
                    </button>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Pipeline;
