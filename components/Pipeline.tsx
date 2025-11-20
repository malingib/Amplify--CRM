
import React, { useState } from 'react';
import { DealStage, Lead } from '../types';
import { MoreHorizontal, Phone, Plus, ArrowRight, Filter, X, Mail, MessageSquare, MapPin, Clock, CheckCircle2, Briefcase, DollarSign, Edit2, Trash2, Sparkles, FilePlus, FileEdit, FileText, Target, BrainCircuit, Loader2, Rocket } from 'lucide-react';
import { qualifyLead, generateLeads } from '../services/geminiService';

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
    qualificationSummary: 'Strong budget indicators and clear timeline, but needs verified authority.'
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
    proposalStatus: 'Sent'
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
    proposalStatus: 'None'
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
    proposalStatus: 'Sent'
  },
];

interface PipelineProps {
    onCreateProposal: (lead: Lead, mode: 'create' | 'edit') => void;
}

const Pipeline: React.FC<PipelineProps> = ({ onCreateProposal }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Lead Gen State
  const [showLeadGen, setShowLeadGen] = useState(false);
  const [genIndustry, setGenIndustry] = useState('');
  const [genLocation, setGenLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<any[]>([]);

  const stages = Object.values(DealStage);

  const moveLead = async (id: string, currentStage: DealStage) => {
      const stageIndex = stages.indexOf(currentStage);
      if (stageIndex < stages.length - 1) {
          const nextStage = stages[stageIndex + 1];
          
          // Optimistic Update
          const leadToUpdate = leads.find(l => l.id === id);
          if (!leadToUpdate) return;

          setLeads(leads.map(l => l.id === id ? {...l, stage: nextStage} : l));
          if (selectedLead && selectedLead.id === id) {
             setSelectedLead(prev => prev ? {...prev, stage: nextStage} : null);
          }

          // Trigger AI Qualification if moving to Qualified stage
          if (nextStage === DealStage.QUALIFIED) {
            // Indicate processing in UI if needed, or just update asynchronously
            const analysis = await qualifyLead(leadToUpdate.name, leadToUpdate.company, leadToUpdate.notes || '', leadToUpdate.value);
            
            // Update state with analysis results
            setLeads(prevLeads => prevLeads.map(l => 
                l.id === id 
                ? { ...l, qualificationScore: analysis.score, qualificationSummary: analysis.summary } 
                : l
            ));

            // Update selected lead if it's still open
            if (selectedLead && selectedLead.id === id) {
                setSelectedLead(prev => prev ? { ...prev, qualificationScore: analysis.score, qualificationSummary: analysis.summary } : null);
            }
          }
      }
  };

  const handleGenerateLeads = async () => {
      if(!genIndustry || !genLocation) return;
      setIsGenerating(true);
      const results = await generateLeads(genIndustry, genLocation);
      setGeneratedLeads(results);
      setIsGenerating(false);
  };

  const acceptGeneratedLead = (leadData: any) => {
      const newLead: Lead = {
          id: Date.now().toString(),
          name: leadData.name,
          company: leadData.company,
          value: leadData.value,
          email: leadData.email,
          stage: DealStage.INTAKE,
          lastContact: new Date().toISOString().split('T')[0],
          probability: 10,
          avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
          notes: leadData.notes,
          proposalStatus: 'None'
      };
      setLeads([...leads, newLead]);
      setGeneratedLeads(generatedLeads.filter(l => l !== leadData));
  };

  // Helper to determine if a proposal exists based on stage or explicit status
  const hasExistingProposal = (lead: Lead) => {
      return lead.proposalStatus === 'Sent' || 
             lead.proposalStatus === 'Draft' || 
             lead.stage === DealStage.PROPOSAL || 
             lead.stage === DealStage.NEGOTIATION;
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6 lg:p-8 overflow-hidden flex flex-col max-w-[1920px] mx-auto relative">
      <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deals Pipeline</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">Manage your ongoing opportunities and track progress.</p>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={() => setShowLeadGen(true)}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 border border-blue-200 transition shadow-sm flex items-center gap-2 hover:shadow-md"
              >
                  <Target className="w-4 h-4" /> Lead Acquisition
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
                        <div 
                            key={lead.id} 
                            onClick={() => setSelectedLead(lead)}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-lg hover:shadow-slate-200/40 hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 group relative"
                        >
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

                            {/* Qualification Badge */}
                            {lead.qualificationScore !== undefined && (
                                <div className={`mb-4 px-3 py-2 rounded-lg border flex items-center gap-2 ${lead.qualificationScore > 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wide">AI Score: {lead.qualificationScore}/100</span>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition hover:text-blue-600 border border-transparent hover:border-slate-200">
                                        <Phone className="w-3.5 h-3.5" />
                                    </button>
                                    {hasExistingProposal(lead) && (
                                        <button className="p-2 text-blue-500 bg-blue-50 rounded-lg transition border border-blue-100" title="Proposal Sent">
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                    )}
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

      {/* Lead Acquisition Engine Modal */}
      {showLeadGen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-4xl h-[600px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                  <div className="bg-slate-900 p-8 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                              <Rocket className="w-6 h-6 text-white" />
                          </div>
                          <div>
                              <h3 className="text-xl font-bold text-white">Lead Acquisition Engine</h3>
                              <p className="text-slate-400 text-sm">AI-powered prospecting for Kenyan markets.</p>
                          </div>
                      </div>
                      <button onClick={() => setShowLeadGen(false)} className="text-slate-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-2 rounded-full"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <div className="flex flex-1 overflow-hidden">
                      {/* Filters Side */}
                      <div className="w-1/3 bg-slate-50 p-8 border-r border-slate-100 flex flex-col gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Target Industry</label>
                              <input 
                                type="text" 
                                value={genIndustry}
                                onChange={e => setGenIndustry(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-800" 
                                placeholder="e.g. Logistics, Retail"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Region / Location</label>
                              <input 
                                type="text" 
                                value={genLocation}
                                onChange={e => setGenLocation(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-800" 
                                placeholder="e.g. Nairobi Westlands"
                              />
                          </div>
                          <div className="mt-auto">
                              <button 
                                onClick={handleGenerateLeads}
                                disabled={isGenerating || !genIndustry || !genLocation}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                  Launch Engine
                              </button>
                          </div>
                      </div>

                      {/* Results Side */}
                      <div className="flex-1 p-8 overflow-y-auto bg-white">
                          {generatedLeads.length > 0 ? (
                              <div className="space-y-4">
                                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Discovered Leads</h4>
                                  {generatedLeads.map((lead, idx) => (
                                      <div key={idx} className="p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition group bg-white">
                                          <div className="flex justify-between items-start mb-3">
                                              <div>
                                                  <h5 className="font-bold text-slate-900">{lead.name}</h5>
                                                  <p className="text-xs text-slate-500 font-bold">{lead.company}</p>
                                              </div>
                                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">KES {lead.value.toLocaleString()}</span>
                                          </div>
                                          <p className="text-xs text-slate-500 mb-4 leading-relaxed">{lead.notes}</p>
                                          <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                               <span className="text-[10px] font-bold text-slate-400 uppercase">{lead.email}</span>
                                               <button 
                                                onClick={() => acceptGeneratedLead(lead)}
                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-2"
                                               >
                                                   <Plus className="w-3 h-3" /> Add to Pipeline
                                               </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                  <Target className="w-16 h-16 mb-4 opacity-20" />
                                  <p className="font-bold">Ready to scout.</p>
                                  <p className="text-xs mt-1">Enter criteria to find potential clients.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Lead Detail Slide-over */}
      {selectedLead && (
        <>
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={() => setSelectedLead(null)}
            />
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-8 border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex gap-4">
                        <img src={selectedLead.avatar} className="w-16 h-16 rounded-2xl object-cover border-4 border-slate-50 shadow-md" alt={selectedLead.name} />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedLead.name}</h2>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" /> {selectedLead.company}
                            </p>
                            <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                selectedLead.stage === DealStage.CLOSED 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                                <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                                {selectedLead.stage}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* AI Qualification Section (Visible if Qualified or manually triggered later) */}
                {selectedLead.qualificationScore !== undefined && (
                    <div className="mb-8 animate-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg shadow-slate-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/10">
                                    <BrainCircuit className="w-5 h-5 text-purple-300" />
                                </div>
                                <h3 className="font-bold text-sm tracking-wide">AI Qualification Analysis</h3>
                            </div>
                            
                            <div className="flex items-end gap-3 mb-4 relative z-10">
                                <span className="text-4xl font-bold">{selectedLead.qualificationScore}</span>
                                <span className="text-sm font-medium text-slate-400 mb-1">/ 100 Score</span>
                            </div>
                            
                            <div className="w-full bg-white/10 h-1.5 rounded-full mb-4 relative z-10">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        (selectedLead.qualificationScore || 0) > 70 ? 'bg-emerald-400' : 
                                        (selectedLead.qualificationScore || 0) > 40 ? 'bg-amber-400' : 'bg-red-400'
                                    }`} 
                                    style={{width: `${selectedLead.qualificationScore}%`}}
                                ></div>
                            </div>
                            
                            <p className="text-xs text-slate-300 leading-relaxed font-medium relative z-10 border-t border-white/10 pt-3">
                                "{selectedLead.qualificationSummary}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Phone className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Call</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Email</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition group">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">WhatsApp</span>
                    </button>
                </div>

                {/* Deal Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><DollarSign className="w-3 h-3" /> Deal Value</p>
                        <p className="text-2xl font-bold tracking-tight text-slate-900">KES {selectedLead.value.toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Probability</p>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold text-slate-900 tracking-tight">{selectedLead.probability}%</p>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full mb-1.5">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${selectedLead.probability}%`}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Context-Aware Proposal Actions */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Proposal Actions</h3>
                    
                    {hasExistingProposal(selectedLead) ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs font-bold text-slate-600">Proposal Status: <span className="text-blue-600">{selectedLead.proposalStatus || 'Sent'}</span></span>
                            </div>
                            <button 
                                onClick={() => onCreateProposal(selectedLead, 'edit')}
                                className="w-full py-3 px-4 bg-white border border-blue-200 text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group shadow-sm"
                            >
                                <FileEdit className="w-4 h-4" />
                                Edit Current Proposal
                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                            
                            <button 
                                onClick={() => onCreateProposal(selectedLead, 'create')}
                                className="w-full py-3 px-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 group border border-slate-700"
                            >
                                <FilePlus className="w-4 h-4" />
                                New Service / Upsell
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={() => onCreateProposal(selectedLead, 'create')}
                                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group border border-blue-500/50"
                            >
                                <Sparkles className="w-4 h-4 group-hover:animate-spin" />
                                Generate First Proposal
                                <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                            <p className="text-center text-[10px] text-slate-400 font-medium mt-3">Ready to pitch? Generate a proposal in seconds.</p>
                        </>
                    )}
                </div>

                {/* Contact Info */}
                <div className="space-y-6 mb-8">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2">Contact Information</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Mail className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</p>
                                <p className="text-sm font-semibold text-slate-900">{selectedLead.email || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number</p>
                                <p className="text-sm font-semibold text-slate-900">{selectedLead.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Location</p>
                                <p className="text-sm font-semibold text-slate-900">Nairobi, Kenya</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Contacted</p>
                                <p className="text-sm font-semibold text-slate-900">{selectedLead.lastContact}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Activity */}
                <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Notes & Activity</h3>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-1 overflow-y-auto max-h-48">
                         <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {selectedLead.notes || 'No notes available for this deal.'}
                         </p>
                         <div className="mt-4 pt-4 border-t border-slate-200/60">
                             <div className="flex items-start gap-3">
                                 <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">JD</div>
                                 <div>
                                     <p className="text-xs font-bold text-slate-900">Meeting Scheduled</p>
                                     <p className="text-[11px] text-slate-500">Tomorrow at 10:00 AM</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-xs flex items-center justify-center gap-2">
                        <Edit2 className="w-3.5 h-3.5" /> Edit Deal
                    </button>
                    <button className="py-3 px-4 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition text-xs flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </>
      )}
    </div>
  );
};

export default Pipeline;