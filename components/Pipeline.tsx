






import React, { useState, useMemo, useEffect } from 'react';
import { DealStage, Lead, ActivityLog } from '../types';
import { MoreHorizontal, Phone, Plus, ArrowRight, Search, X, Mail, MessageSquare, MapPin, Sparkles, BrainCircuit, LayoutGrid, List as ListIcon, Save, GripVertical, Trash2, Edit2, Archive, DollarSign, UserCircle, Calendar, Filter, Ban, CheckCircle2, Briefcase, Linkedin, Facebook, Instagram, Globe, Twitter, AlertTriangle, TrendingUp, Copy, Loader2 } from 'lucide-react';
import { qualifyLead, generateFollowUpStrategy } from '../services/geminiService';

interface PipelineProps {
    leads: Lead[];
    onUpdateLeads: (leads: Lead[]) => void;
    onCreateProposal: (lead: Lead, mode: 'create' | 'edit') => void;
    onNavigateToAcquisition: () => void;
}

const Pipeline: React.FC<PipelineProps> = ({ leads, onUpdateLeads, onCreateProposal, onNavigateToAcquisition }) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'timeline' | 'ai'>('details');
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [minProbability, setMinProbability] = useState<number>(0);
  const [minValue, setMinValue] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<'All' | 'Me'>('All');
  const [showLost, setShowLost] = useState(false);
  
  // DND State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [dragOverLeadId, setDragOverLeadId] = useState<string | null>(null);

  // UI State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState<Partial<Lead>>({
      name: '', company: '', value: 0, stage: DealStage.INTAKE, notes: '', email: '', phone: ''
  });
  
  // Activity Logging State
  const [newActivityNote, setNewActivityNote] = useState('');

  // AI Follow Up State
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpStrategy, setFollowUpStrategy] = useState<any>(null);

  // Define Kanban Columns
  const kanbanStages = [DealStage.INTAKE, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION, DealStage.CLOSED];
  if (showLost) kanbanStages.push(DealStage.LOST);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // --- Filtering Logic ---
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              lead.company.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProb = lead.probability >= minProbability;
        const matchesValue = minValue ? lead.value >= parseInt(minValue) : true;
        
        // Owner logic (Mock ID '1' as current user)
        const matchesOwner = ownerFilter === 'All' || (ownerFilter === 'Me' && lead.ownerId === '1'); // Assuming '1' is current user
        
        // Stage logic (Hide lost in board unless toggled, List always shows unless filtered)
        const isLost = lead.stage === DealStage.LOST;
        const matchesStage = viewMode === 'list' ? true : (showLost ? true : !isLost);
        
        return matchesSearch && matchesProb && matchesValue && matchesOwner && matchesStage;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [leads, searchQuery, minProbability, minValue, viewMode, ownerFilter, showLost]);

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
    const totalValue = filteredLeads.reduce((sum, lead) => sum + lead.value, 0);
    const weightedValue = filteredLeads.reduce((sum, lead) => sum + (lead.value * (lead.probability / 100)), 0);
    const count = filteredLeads.length;
    return { totalValue, weightedValue, count };
  }, [filteredLeads]);

  // Calculate totals per stage
  const stageTotals = useMemo(() => {
      const totals: Record<string, number> = {};
      kanbanStages.forEach(stage => {
          totals[stage] = filteredLeads.filter(l => l.stage === stage).reduce((sum, l) => sum + l.value, 0);
      });
      return totals;
  }, [filteredLeads, kanbanStages]);

  // --- Actions ---

  const handleGenerateFollowUp = async () => {
      if (!selectedLead) return;
      setIsGeneratingFollowUp(true);
      const strategy = await generateFollowUpStrategy(
          selectedLead.name, 
          selectedLead.company, 
          selectedLead.stage, 
          selectedLead.lastContact, 
          selectedLead.notes || ''
      );
      setFollowUpStrategy(strategy);
      setIsGeneratingFollowUp(false);
  };

  const moveLead = async (id: string, targetStage: DealStage) => {
      if (targetStage === DealStage.LOST && !confirm("Mark this deal as Lost?")) return;

      const updatedLeads = leads.map(l => {
          if (l.id === id) {
              return { 
                  ...l, 
                  stage: targetStage,
                  probability: targetStage === DealStage.CLOSED ? 100 : targetStage === DealStage.LOST ? 0 : l.probability 
              };
          }
          return l;
      });
      onUpdateLeads(updatedLeads);

      // AI Qualification Trigger if moving to Qualified
      const leadToUpdate = leads.find(l => l.id === id);
      if (leadToUpdate && targetStage === DealStage.QUALIFIED && !leadToUpdate.qualificationScore) {
          const analysis = await qualifyLead(leadToUpdate.name, leadToUpdate.company, leadToUpdate.notes || '', leadToUpdate.value);
          const enrichedLeads = updatedLeads.map(l => 
              l.id === id 
              ? { ...l, qualificationScore: analysis.score, qualificationSummary: analysis.summary } 
              : l
          );
          onUpdateLeads(enrichedLeads);
      }
  };

  const handleDelete = (id: string) => {
      if (!confirm("Are you sure you want to delete this deal permanently?")) return;
      const updatedLeads = leads.filter(l => l.id !== id);
      onUpdateLeads(updatedLeads);
      if (selectedLead?.id === id) setSelectedLead(null);
  };

  const addActivity = (type: ActivityLog['type'], content: string) => {
      if (!selectedLead) return;
      const newLog: ActivityLog = {
          id: Date.now().toString(),
          type,
          content,
          date: new Date().toISOString(),
          performedBy: 'You'
      };

      const updatedLeads = leads.map(l => {
          if (l.id === selectedLead.id) {
              return { ...l, activityLogs: [newLog, ...(l.activityLogs || [])] };
          }
          return l;
      });
      onUpdateLeads(updatedLeads);
      setSelectedLead(prev => prev ? { ...prev, activityLogs: [newLog, ...(prev.activityLogs || [])] } : null);
      setNewActivityNote('');
  };

  const handleSaveDeal = () => {
      if (!newDeal.name || !newDeal.company) return;

      if (editingId) {
          const updated = leads.map(l => l.id === editingId ? { ...l, ...newDeal } as Lead : l);
          onUpdateLeads(updated);
          if (selectedLead && selectedLead.id === editingId) {
              setSelectedLead(prev => prev ? { ...prev, ...newDeal } : null);
          }
      } else {
          // Determine order (append to end)
          const maxOrder = leads.length > 0 ? Math.max(...leads.map(l => l.order || 0)) : 0;
          
          const leadToAdd: Lead = {
              id: Date.now().toString(),
              name: newDeal.name!,
              company: newDeal.company!,
              value: newDeal.value || 0,
              stage: newDeal.stage || DealStage.INTAKE,
              lastContact: new Date().toISOString().split('T')[0],
              probability: 20,
              avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
              email: newDeal.email,
              phone: newDeal.phone,
              notes: newDeal.notes,
              proposalStatus: 'None',
              source: 'Manual',
              ownerId: '1', // Default to current user
              activityLogs: [],
              order: maxOrder + 1
          };
          onUpdateLeads([...leads, leadToAdd]);
      }
      closeModal();
  };

  const openAddModal = (stage?: DealStage) => {
      setEditingId(null);
      setNewDeal({ 
          name: '', company: '', value: 0, stage: stage || DealStage.INTAKE, notes: '', email: '', phone: '' 
      });
      setIsAddModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
      setEditingId(lead.id);
      setNewDeal({ ...lead });
      setIsAddModalOpen(true);
  };

  const closeModal = () => {
      setIsAddModalOpen(false);
      setEditingId(null);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedLeadId(id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOverColumn = (e: React.DragEvent, stage: DealStage) => {
      e.preventDefault();
      if (dragOverStage !== stage) setDragOverStage(stage);
      if (dragOverLeadId !== null) setDragOverLeadId(null); // Clear item hover if over empty column space
  };

  const handleDragOverLead = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation(); // Stop bubbling to column
      if (dragOverLeadId !== id) setDragOverLeadId(id);
      
      const lead = leads.find(l => l.id === id);
      if (lead && dragOverStage !== lead.stage) {
          setDragOverStage(lead.stage);
      }
  };

  const handleDrop = (e: React.DragEvent, stage: DealStage) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!draggedLeadId) return;

      const sourceLead = leads.find(l => l.id === draggedLeadId);
      if (!sourceLead) return;

      // 1. Get all leads in the target stage, sorted by order
      // Exclude the dragged lead if it was already there (to avoid duplication during splice)
      const targetStageLeads = leads
          .filter(l => l.stage === stage && l.id !== draggedLeadId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

      let insertIndex = targetStageLeads.length; // Default to end

      // 2. Determine insertion index
      if (dragOverLeadId) {
          const index = targetStageLeads.findIndex(l => l.id === dragOverLeadId);
          if (index !== -1) insertIndex = index;
      }

      // 3. Create updated lead object with new stage
      const updatedLead = {
          ...sourceLead,
          stage: stage,
          probability: stage === DealStage.CLOSED ? 100 : stage === DealStage.LOST ? 0 : sourceLead.probability
      };

      // 4. Insert lead at position
      targetStageLeads.splice(insertIndex, 0, updatedLead);

      // 5. Update orders for all leads in this stage
      targetStageLeads.forEach((l, idx) => {
          l.order = idx;
      });

      // 6. Construct final leads array
      // Filter out leads that are NOT in the target stage (excluding dragged lead if it was moved FROM another stage)
      const otherLeads = leads.filter(l => l.stage !== stage && l.id !== draggedLeadId);

      // Merge
      const finalLeads = [...otherLeads, ...targetStageLeads];

      onUpdateLeads(finalLeads);
      
      setDraggedLeadId(null);
      setDragOverStage(null);
      setDragOverLeadId(null);
  };

  const getStageColor = (stage: string) => {
      switch(stage) {
          case DealStage.QUALIFIED: return 'bg-blue-500';
          case DealStage.PROPOSAL: return 'bg-purple-500';
          case DealStage.NEGOTIATION: return 'bg-amber-500';
          case DealStage.CLOSED: return 'bg-emerald-500';
          case DealStage.LOST: return 'bg-red-500';
          default: return 'bg-slate-400';
      }
  };

  return (
    <div className="h-[calc(100vh-7rem)] p-6 lg:p-8 flex flex-col max-w-[1920px] mx-auto relative">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-6 mb-6 shrink-0">
          {/* ... existing header code ... */}
          <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deals Pipeline</h2>
                <p className="text-slate-500 font-medium mt-1 text-sm">Manage opportunities and forecast revenue.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onNavigateToAcquisition}
                    className="bg-white text-emerald-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-50 border border-emerald-200 transition shadow-sm flex items-center gap-2 hover:shadow-md"
                >
                    <Sparkles className="w-4 h-4" /> Lead Acquisition
                </button>
                <button 
                    onClick={() => openAddModal()}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100"
                >
                    <Plus className="w-4 h-4" /> New Deal
                </button>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Value</p>
                      <p className="text-2xl font-bold text-slate-900">KES {metrics.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                  </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weighted Value</p>
                      <p className="text-2xl font-bold text-slate-900">KES {Math.round(metrics.weightedValue).toLocaleString()}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <BrainCircuit className="w-5 h-5" />
                  </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Deals</p>
                      <p className="text-2xl font-bold text-slate-900">{metrics.count}</p>
                  </div>
                   <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5" />
                  </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="flex-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Rate</p>
                       <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '65%'}}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900">65%</span>
                       </div>
                  </div>
              </div>
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 flex-1 overflow-x-auto hide-scrollbar">
                  <div className="relative group min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Search deals..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-lg text-sm font-semibold focus:bg-white focus:border-slate-200 focus:outline-none transition-all"
                      />
                  </div>
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  
                  <button 
                      onClick={() => setOwnerFilter(ownerFilter === 'All' ? 'Me' : 'All')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${
                          ownerFilter === 'Me' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                      <UserCircle className="w-4 h-4" /> {ownerFilter === 'Me' ? 'My Deals' : 'All Owners'}
                  </button>

                  <select 
                    value={minProbability}
                    onChange={(e) => setMinProbability(Number(e.target.value))}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 outline-none focus:ring-2 focus:ring-slate-100"
                  >
                      <option value="0">All Probabilities</option>
                      <option value="50">50%+ Probability</option>
                      <option value="80">80%+ Probability</option>
                  </select>
                  
                  <button 
                      onClick={() => setShowLost(!showLost)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition ${
                          showLost ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                      <Archive className="w-4 h-4" /> {showLost ? 'Hide Lost' : 'Show Lost'}
                  </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                  <button 
                    onClick={() => setViewMode('board')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                      <ListIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        
        {/* BOARD VIEW */}
        {viewMode === 'board' && (
             <div className="overflow-x-auto h-full pb-4">
                <div className="flex gap-4 min-w-max h-full px-1">
                    {kanbanStages.map((stage) => {
                        const stageLeads = filteredLeads.filter(l => l.stage === stage);
                        const isOver = dragOverStage === stage;
                        const total = stageTotals[stage] || 0;

                        return (
                            <div 
                                key={stage} 
                                className={`w-[340px] flex flex-col h-full rounded-[24px] transition-colors duration-300 ${isOver ? 'bg-slate-100 ring-2 ring-blue-400' : 'bg-slate-50/50'}`}
                                onDragOver={(e) => handleDragOverColumn(e, stage)}
                                onDrop={(e) => handleDrop(e, stage)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex-shrink-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}></div>
                                            <h3 className="font-bold text-sm text-slate-900 tracking-tight uppercase">{stage}</h3>
                                            <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                                                {stageLeads.length}
                                            </span>
                                        </div>
                                        {stage === DealStage.CLOSED && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                    </div>
                                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full ${getStageColor(stage)}`} style={{ width: '100%' }}></div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-500">Total: KES {total.toLocaleString()}</p>
                                </div>
                                
                                {/* Column Content */}
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                    {stageLeads.length === 0 ? (
                                        <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl m-2">
                                            <p className="text-xs font-bold">No deals here</p>
                                            <p className="text-[10px] mt-1">Drag items to move</p>
                                        </div>
                                    ) : (
                                        stageLeads.map(lead => (
                                            <div 
                                                key={lead.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                                onDragOver={(e) => handleDragOverLead(e, lead.id)}
                                                onClick={() => setSelectedLead(lead)}
                                                className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer hover:shadow-lg transition-all duration-300 group relative ${
                                                    draggedLeadId === lead.id ? 'opacity-50' : 'opacity-100'
                                                } ${
                                                    dragOverLeadId === lead.id ? 'border-t-4 border-t-blue-500 mt-2' : 'border-slate-200'
                                                }`}
                                            >
                                                {/* ... lead card content ... */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing" />
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 text-sm truncate w-[160px]">{lead.name}</h4>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{lead.company}</span>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdown(activeDropdown === lead.id ? null : lead.id);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                        
                                                        {activeDropdown === lead.id && (
                                                            <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(lead); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2">
                                                                    <Edit2 className="w-3.5 h-3.5" /> Edit Deal
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); moveLead(lead.id, DealStage.CLOSED); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Won
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); moveLead(lead.id, DealStage.LOST); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                                    <Ban className="w-3.5 h-3.5" /> Mark Lost
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1"></div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-red-600 hover:bg-slate-50 flex items-center gap-2">
                                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                        <p className="text-slate-900 font-bold text-xs">KES {lead.value.toLocaleString()}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                                        lead.probability > 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        lead.probability > 40 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                        {lead.probability}%
                                                    </div>
                                                </div>

                                                {/* AI/Source Badges */}
                                                <div className="flex gap-1 flex-wrap">
                                                    {lead.source && lead.source.startsWith('AI') && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-100 text-[9px] font-bold uppercase">
                                                            <Sparkles className="w-2.5 h-2.5" /> AI
                                                        </span>
                                                    )}
                                                    {lead.qualificationScore && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 text-[9px] font-bold uppercase">
                                                            <BrainCircuit className="w-2.5 h-2.5" /> {lead.qualificationScore}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Quick Move Action */}
                                                {stage !== DealStage.CLOSED && stage !== DealStage.LOST && (
                                                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                                                        <button 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                const nextStage = kanbanStages[kanbanStages.indexOf(stage) + 1];
                                                                if(nextStage) moveLead(lead.id, nextStage); 
                                                            }}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition"
                                                        >
                                                            Move Next <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                    
                                    <button 
                                        onClick={() => openAddModal(stage)}
                                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-semibold hover:border-slate-300 hover:text-slate-600 hover:bg-white transition flex items-center justify-center gap-2 group text-xs mt-2"
                                    >
                                        <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Add Deal
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
             </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
            <div className="h-full bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        {/* ... existing table code ... */}
                        <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 sticky top-0 backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-6 py-4">Deal Name</th>
                                <th className="px-6 py-4">Stage</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4">Probability</th>
                                <th className="px-6 py-4">Last Contact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-slate-50/60 cursor-pointer transition group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {lead.company.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">{lead.company}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                            lead.stage === DealStage.CLOSED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            lead.stage === DealStage.LOST ? 'bg-red-50 text-red-700 border-red-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                            {lead.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">KES {lead.value.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${lead.probability > 70 ? 'bg-emerald-500' : lead.probability > 30 ? 'bg-amber-500' : 'bg-red-400'}`} style={{width: `${lead.probability}%`}}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{lead.probability}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{lead.lastContact}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(lead); }} className="text-slate-400 hover:text-slate-900 p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

      {/* --- ADD DEAL MODAL --- */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
              {/* ... existing modal code ... */}
              <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative">
                  <button onClick={closeModal} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                  <div className="mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{editingId ? 'Edit Deal' : 'New Opportunity'}</h3>
                      <p className="text-slate-500 font-medium mt-1 text-sm">Enter deal details to track in pipeline.</p>
                  </div>
                  <div className="space-y-4">
                      {/* ... form fields ... */}
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Deal Name</label>
                          <input type="text" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm focus:ring-2 focus:ring-blue-100" placeholder="e.g. Annual Service Contract" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Client Company</label>
                              <input type="text" value={newDeal.company} onChange={e => setNewDeal({...newDeal, company: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm" placeholder="Acme Corp" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Value (KES)</label>
                              <input type="number" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm" />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                               <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Email</label>
                               <input type="email" value={newDeal.email || ''} onChange={e => setNewDeal({...newDeal, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm" placeholder="client@email.com" />
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Stage</label>
                              <select value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value as DealStage})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm">
                                  {Object.values(DealStage).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Initial Notes</label>
                          <textarea value={newDeal.notes || ''} onChange={e => setNewDeal({...newDeal, notes: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-sm min-h-[80px] resize-none" placeholder="Requirements..." />
                      </div>
                  </div>
                  <div className="mt-8 flex gap-3">
                      <button onClick={closeModal} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 text-sm">Cancel</button>
                      <button onClick={handleSaveDeal} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg text-sm flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" /> Save Deal
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- LEAD DETAIL SLIDE-OVER --- */}
      {selectedLead && (
        <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setSelectedLead(null)} />
            <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex gap-4">
                        <img src={selectedLead.avatar} className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-sm" alt="" />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{selectedLead.name}</h2>
                            <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5" /> {selectedLead.company}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                                    selectedLead.stage === DealStage.CLOSED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    selectedLead.stage === DealStage.LOST ? 'bg-red-50 text-red-700 border-red-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                    {selectedLead.stage}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-900 transition border border-transparent hover:border-slate-200"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="px-8 border-b border-slate-100 flex gap-6">
                    {['details', 'timeline', 'ai'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveDetailTab(tab as any)}
                            className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition ${
                                activeDetailTab === tab 
                                ? 'border-slate-900 text-slate-900' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab === 'ai' ? 'AI Insights' : tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    
                    {/* DETAILS TAB */}
                    {activeDetailTab === 'details' && (
                        <div className="space-y-8">
                             {/* Actions Row */}
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => addActivity('Call', 'Logged outbound call')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition group">
                                    <Phone className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                                    <span className="text-[10px] font-bold uppercase">Call</span>
                                </button>
                                <button onClick={() => addActivity('Email', 'Sent email')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-purple-50 hover:border-purple-100 hover:text-purple-600 transition group">
                                    <Mail className="w-5 h-5 text-slate-400 group-hover:text-purple-600" />
                                    <span className="text-[10px] font-bold uppercase">Email</span>
                                </button>
                                <button onClick={() => addActivity('Meeting', 'Scheduled meeting')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-600 transition group">
                                    <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
                                    <span className="text-[10px] font-bold uppercase">SMS</span>
                                </button>
                                <button onClick={() => moveLead(selectedLead.id, DealStage.LOST)} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition group">
                                    <Ban className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                                    <span className="text-[10px] font-bold uppercase">Lost</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deal Value</p>
                                    <p className="text-xl font-bold text-slate-900">KES {selectedLead.value.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Probability</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${selectedLead.probability > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${selectedLead.probability}%`}}></div>
                                        </div>
                                        <span className="text-sm font-bold">{selectedLead.probability}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* ... contact details ... */}
                             <div className="space-y-4">
                                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Contact Info</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-700">{selectedLead.email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-700">{selectedLead.phone || 'No phone'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium text-slate-700">{selectedLead.address || 'Nairobi, Kenya'}</span>
                                    </div>
                                    {selectedLead.socials && Object.keys(selectedLead.socials).length > 0 && (
                                        <div className="flex gap-2 pt-2">
                                            {selectedLead.socials.linkedin && selectedLead.socials.linkedin !== 'N/A' && (
                                                <a href={selectedLead.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-100"><Linkedin className="w-4 h-4" /></a>
                                            )}
                                            {selectedLead.socials.twitter && selectedLead.socials.twitter !== 'N/A' && (
                                                <a href={selectedLead.socials.twitter} target="_blank" rel="noreferrer" className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition border border-slate-200"><Twitter className="w-4 h-4" /></a>
                                            )}
                                            {selectedLead.socials.facebook && selectedLead.socials.facebook !== 'N/A' && (
                                                <a href={selectedLead.socials.facebook} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-100"><Facebook className="w-4 h-4" /></a>
                                            )}
                                            {selectedLead.socials.instagram && selectedLead.socials.instagram !== 'N/A' && (
                                                <a href={selectedLead.socials.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition border border-pink-100"><Instagram className="w-4 h-4" /></a>
                                            )}
                                            {selectedLead.socials.website && selectedLead.socials.website !== 'N/A' && (
                                                <a href={selectedLead.socials.website} target="_blank" rel="noreferrer" className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition border border-slate-200"><Globe className="w-4 h-4" /></a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                             {/* Proposal Section */}
                             <div className="pt-4 border-t border-slate-100">
                                 <div className="flex justify-between items-center mb-4">
                                     <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Proposal</h3>
                                     <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">{selectedLead.proposalStatus || 'None'}</span>
                                 </div>
                                 <button 
                                    onClick={() => onCreateProposal(selectedLead, 'create')}
                                    className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50/50 text-blue-600 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-300 transition text-sm flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" /> 
                                    {selectedLead.proposalStatus === 'None' ? 'Generate Proposal' : 'Create New Version'}
                                </button>
                             </div>
                        </div>
                    )}

                    {/* TIMELINE TAB */}
                    {activeDetailTab === 'timeline' && (
                        <div className="space-y-6">
                            {/* ... existing timeline code ... */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <textarea 
                                    value={newActivityNote}
                                    onChange={(e) => setNewActivityNote(e.target.value)}
                                    placeholder="Log a call, note, or meeting..."
                                    className="w-full bg-white p-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-slate-200 outline-none resize-none min-h-[80px]"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex gap-2">
                                        <button onClick={() => addActivity('Call', newActivityNote || 'Call logged')} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition"><Phone className="w-4 h-4" /></button>
                                        <button onClick={() => addActivity('Meeting', newActivityNote || 'Meeting booked')} className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-purple-600 transition"><Calendar className="w-4 h-4" /></button>
                                    </div>
                                    <button 
                                        onClick={() => addActivity('Note', newActivityNote)}
                                        disabled={!newActivityNote.trim()}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition flex items-center gap-2"
                                    >
                                        Log Activity
                                    </button>
                                </div>
                            </div>

                            {/* Feed */}
                            <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-4">
                                {selectedLead.activityLogs && selectedLead.activityLogs.length > 0 ? selectedLead.activityLogs.map(log => (
                                    <div key={log.id} className="pl-6 relative">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                            log.type === 'Call' ? 'bg-blue-500' :
                                            log.type === 'Meeting' ? 'bg-purple-500' :
                                            log.type === 'System' ? 'bg-slate-400' : 'bg-emerald-500'
                                        }`}></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-900">{log.type}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{new Date(log.date).toLocaleString()}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-sm text-slate-600 leading-relaxed">
                                                {log.content}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="pl-6 pt-2">
                                        <p className="text-xs text-slate-400 font-medium">No activity recorded yet.</p>
                                    </div>
                                )}
                                
                                {selectedLead.notes && (
                                     <div className="pl-6 relative">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-900">Initial Note</span>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-500 leading-relaxed italic">
                                                {selectedLead.notes}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI TAB */}
                    {activeDetailTab === 'ai' && (
                         <div className="space-y-6">
                            {/* Qualification Card */}
                            {selectedLead.qualificationScore !== undefined ? (
                                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles className="w-5 h-5 text-purple-300" />
                                            <h3 className="font-bold text-lg">Lead Qualification</h3>
                                        </div>
                                        <div className="flex items-end gap-2 mb-4">
                                            <span className="text-5xl font-bold tracking-tighter">{selectedLead.qualificationScore}</span>
                                            <span className="text-sm font-medium text-slate-400 mb-1.5">/ 100</span>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-4">
                                            {selectedLead.qualificationSummary}
                                        </p>
                                    </div>
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <BrainCircuit className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No Analysis Yet</p>
                                    <p className="text-xs text-slate-400 mt-1 mb-4">Run AI qualification to score this lead.</p>
                                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50">Run Analysis</button>
                                </div>
                            )}

                            {/* Automated Follow-Up Generator */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                                        Smart Follow-Up
                                    </h4>
                                    {!followUpStrategy && (
                                        <button 
                                            onClick={handleGenerateFollowUp}
                                            disabled={isGeneratingFollowUp}
                                            className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {isGeneratingFollowUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generate
                                        </button>
                                    )}
                                </div>

                                {followUpStrategy ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Recommended Action</p>
                                            <p className="font-bold text-slate-900 text-sm">{followUpStrategy.suggested_action}</p>
                                            <p className="text-xs text-slate-600 mt-1">{followUpStrategy.rationale}</p>
                                        </div>
                                        
                                        {followUpStrategy.email_draft && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email Draft</p>
                                                    <button className="text-slate-400 hover:text-slate-600"><Copy className="w-3 h-3" /></button>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                                                    {followUpStrategy.email_draft}
                                                </div>
                                            </div>
                                        )}

                                        {followUpStrategy.sms_draft && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp / SMS</p>
                                                    <button className="text-slate-400 hover:text-slate-600"><Copy className="w-3 h-3" /></button>
                                                </div>
                                                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                                                    {followUpStrategy.sms_draft}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <button onClick={() => setFollowUpStrategy(null)} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Reset Strategy</button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        Generate a personalized engagement strategy based on deal stage and history.
                                    </p>
                                )}
                            </div>

                            {/* Insights */}
                            {(selectedLead.growthPotential || selectedLead.riskAssessment) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedLead.growthPotential && (
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                                <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">Growth</h4>
                                            </div>
                                            <p className="text-sm font-medium text-blue-800 leading-relaxed">{selectedLead.growthPotential}</p>
                                        </div>
                                    )}
                                    {selectedLead.riskAssessment && (
                                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                                <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">Risk</h4>
                                            </div>
                                            <p className="text-sm font-medium text-amber-800 leading-relaxed">{selectedLead.riskAssessment}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                         </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                    <button onClick={() => openEditModal(selectedLead)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition text-xs font-bold">
                        <Edit2 className="w-4 h-4" /> Edit Details
                    </button>
                    <button onClick={() => handleDelete(selectedLead.id)} className="flex items-center gap-2 text-red-400 hover:text-red-600 transition text-xs font-bold">
                         <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </div>
        </>
      )}

    </div>
  );
};

export default Pipeline;