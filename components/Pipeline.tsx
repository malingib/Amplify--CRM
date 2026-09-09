import React, { useMemo, useState } from 'react';
import { ActivityLog, DealStage, Lead } from '../types';
import { ArrowRight, CheckCircle2, ChevronDown, DollarSign, Edit2, Loader2, Plus, RefreshCw, Search, Trash2, UserPlus, X } from 'lucide-react';
import { leadsApi } from '../src/api/client';
import { qualifyLead } from '../services/geminiService';

interface PipelineProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onCreateProposal: (lead: Lead, mode: 'create' | 'edit') => void;
  onNavigateToAcquisition: () => void;
}

const STAGES = [
  DealStage.INTAKE,
  DealStage.QUALIFIED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED,
  DealStage.LOST,
];

const stageToApi = (stage: DealStage) => stage.toUpperCase();

const persistableLead = (lead: Lead) => ({
  name: lead.name,
  company: lead.company,
  value: Number(lead.value || 0),
  stage: stageToApi(lead.stage),
  probability: Number(lead.probability || 0),
  qualificationScore: lead.qualificationScore ?? null,
  qualificationSummary: lead.qualificationSummary ?? null,
  email: lead.email || null,
  phone: lead.phone || null,
  notes: lead.notes || null,
  source: lead.source || 'Manual',
  avatar: lead.avatar || null,
  proposalStatus: lead.proposalStatus || null,
  linkedin: lead.socials?.linkedin || null,
  twitter: lead.socials?.twitter || null,
  website: lead.socials?.website || null,
  facebook: lead.socials?.facebook || null,
  instagram: lead.socials?.instagram || null,
  address: lead.address || null,
  order: lead.order ?? 0,
});

const normalizeApiLead = (lead: any): Lead => ({
  ...lead,
  stage: (lead.stage ? String(lead.stage).replace(/^./, c => c + '').toLowerCase() : 'intake') as Lead['stage'],
  lastContact: lead.lastContact ? new Date(lead.lastContact).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  socials: {
    linkedin: lead.linkedin || '', twitter: lead.twitter || '', website: lead.website || '',
    facebook: lead.facebook || '', instagram: lead.instagram || '',
  },
  activityLogs: lead.activityLogs || [],
});

const Pipeline: React.FC<PipelineProps> = ({ leads, onUpdateLeads, onCreateProposal, onNavigateToAcquisition }) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'All' | DealStage>('All');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLost, setShowLost] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', company: '', value: 0, stage: DealStage.INTAKE, probability: 20, email: '', phone: '', notes: '' });
  const [activity, setActivity] = useState('');

  const visibleLeads = useMemo(() => leads.filter(lead => {
    if (!showLost && lead.stage === DealStage.LOST) return false;
    if (stageFilter !== 'All' && lead.stage !== stageFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return lead.name.toLowerCase().includes(q) || lead.company.toLowerCase().includes(q) || (lead.email || '').toLowerCase().includes(q);
  }), [leads, search, stageFilter, showLost]);

  const metrics = useMemo(() => {
    const open = leads.filter(l => ![DealStage.CLOSED, DealStage.LOST].includes(l.stage));
    const pipelineValue = open.reduce((sum, l) => sum + Number(l.value || 0), 0);
    const weighted = open.reduce((sum, l) => sum + Number(l.value || 0) * Number(l.probability || 0) / 100, 0);
    const won = leads.filter(l => l.stage === DealStage.CLOSED).reduce((sum, l) => sum + Number(l.value || 0), 0);
    return { open: open.length, pipelineValue, weighted, won };
  }, [leads]);

  const commitLocal = (next: Lead[]) => onUpdateLeads(next);

  const updateLead = async (lead: Lead, patch: Partial<Lead>) => {
    setBusyId(lead.id);
    try {
      const merged = { ...lead, ...patch } as Lead;
      const res = await leadsApi.update(lead.id, persistableLead(merged));
      const serverLead = normalizeApiLead(res.lead);
      commitLocal(leads.map(l => l.id === lead.id ? serverLead : l));
      if (selectedLead?.id === lead.id) setSelectedLead(serverLead);
      return serverLead;
    } finally {
      setBusyId(null);
    }
  };

  const moveLead = async (lead: Lead, stage: DealStage) => {
    const probability = stage === DealStage.CLOSED ? 100 : stage === DealStage.LOST ? 0 : lead.probability;
    try {
      const updated = await updateLead(lead, { stage, probability });
      if (stage === DealStage.QUALIFIED && !updated.qualificationScore) {
        setBusyId(lead.id);
        try {
          const analysis = await qualifyLead(lead.name, lead.company, lead.notes || '', lead.value);
          const enriched = await leadsApi.update(lead.id, { qualificationScore: analysis.score, qualificationSummary: analysis.summary });
          const serverLead = normalizeApiLead(enriched.lead);
          commitLocal(leads.map(l => l.id === lead.id ? serverLead : l));
          if (selectedLead?.id === lead.id) setSelectedLead(serverLead);
        } finally { setBusyId(null); }
      }
    } catch (error) {
      console.error('Lead stage update failed:', error);
    }
  };

  const deleteLead = async (lead: Lead) => {
    if (!window.confirm(`Delete ${lead.name}? This cannot be undone.`)) return;
    setBusyId(lead.id);
    try {
      await leadsApi.delete(lead.id);
      commitLocal(leads.filter(l => l.id !== lead.id));
      if (selectedLead?.id === lead.id) setSelectedLead(null);
    } catch (error) {
      console.error('Lead deletion failed:', error);
    } finally { setBusyId(null); }
  };

  const convertLead = async (lead: Lead) => {
    setBusyId(lead.id);
    try {
      await leadsApi.convertToClient(lead.id);
      const closed = { ...lead, stage: DealStage.CLOSED, probability: 100 } as Lead;
      commitLocal(leads.map(l => l.id === lead.id ? closed : l));
      if (selectedLead?.id === lead.id) setSelectedLead(closed);
    } catch (error) {
      console.error('Lead conversion failed:', error);
    } finally { setBusyId(null); }
  };

  const saveForm = async () => {
    if (!form.name.trim() || !form.company.trim()) return;
    setBusyId('form');
    try {
      if (editingId) {
        const existing = leads.find(l => l.id === editingId);
        if (!existing) return;
        await updateLead(existing, {
          name: form.name.trim(), company: form.company.trim(), value: Number(form.value || 0), stage: form.stage,
          probability: Number(form.probability || 0), email: form.email || undefined, phone: form.phone || undefined, notes: form.notes || undefined,
        });
      } else {
        const res = await leadsApi.create({
          name: form.name.trim(), company: form.company.trim(), value: Number(form.value || 0), stage: stageToApi(form.stage),
          probability: Number(form.probability || 0), email: form.email || null, phone: form.phone || null, notes: form.notes || null, source: 'Manual',
        });
        commitLocal([...leads, normalizeApiLead(res.lead)]);
      }
      setIsAddOpen(false); setEditingId(null);
    } catch (error) {
      console.error('Lead save failed:', error);
    } finally { setBusyId(null); }
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({ name: lead.name, company: lead.company, value: lead.value, stage: lead.stage, probability: lead.probability, email: lead.email || '', phone: lead.phone || '', notes: lead.notes || '' });
    setIsAddOpen(true);
  };

  const addActivity = async () => {
    if (!selectedLead || !activity.trim()) return;
    setBusyId(selectedLead.id);
    try {
      const res = await leadsApi.addActivity(selectedLead.id, { type: 'Note', content: activity.trim() });
      const log: ActivityLog = res.log;
      const next = leads.map(l => l.id === selectedLead.id ? { ...l, activityLogs: [log, ...(l.activityLogs || [])] } : l);
      commitLocal(next);
      setSelectedLead(next.find(l => l.id === selectedLead.id) || selectedLead);
      setActivity('');
    } catch (error) { console.error('Activity logging failed:', error); }
    finally { setBusyId(null); }
  };

  const reorder = async (lead: Lead, direction: 'up' | 'down') => {
    const stageLeads = leads.filter(l => l.stage === lead.stage).sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = stageLeads.findIndex(l => l.id === lead.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= stageLeads.length) return;
    [stageLeads[index], stageLeads[target]] = [stageLeads[target], stageLeads[index]];
    const updates = stageLeads.map((l, i) => ({ id: l.id, order: i }));
    const next = leads.map(l => { const item = updates.find(u => u.id === l.id); return item ? { ...l, order: item.order } : l; });
    commitLocal(next);
    try { await leadsApi.reorder(updates); } catch (error) { console.error('Lead reorder failed:', error); }
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: '', company: '', value: 0, stage: DealStage.INTAKE, probability: 20, email: '', phone: '', notes: '' });
    setIsAddOpen(true);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600"><DollarSign className="w-4 h-4" /> Sales Command Center</div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Pipeline & Revenue</h1>
          <p className="text-sm text-slate-500 mt-1">Every stage change, edit, activity and conversion is persisted through the CRM API.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onNavigateToAcquisition} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold hover:bg-slate-50"><UserPlus className="w-4 h-4 inline mr-2" />Acquire leads</button>
          <button onClick={openNew} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"><Plus className="w-4 h-4 inline mr-2" />New deal</button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['Open deals', metrics.open.toString()],
          ['Pipeline', `KES ${Math.round(metrics.pipelineValue).toLocaleString()}`],
          ['Weighted', `KES ${Math.round(metrics.weighted).toLocaleString()}`],
          ['Won', `KES ${Math.round(metrics.won).toLocaleString()}`],
        ].map(([label, value]) => <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4"><p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{label}</p><p className="text-xl font-black text-slate-900 mt-1">{value}</p></div>)}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company or email" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100" /></div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)} className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"><option value="All">All stages</option>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <label className="flex items-center gap-2 px-3 text-sm font-bold text-slate-600"><input type="checkbox" checked={showLost} onChange={e => setShowLost(e.target.checked)} /> Show lost</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {STAGES.map(stage => {
          const stageLeads = visibleLeads.filter(l => l.stage === stage).sort((a, b) => (a.order || 0) - (b.order || 0));
          const total = stageLeads.reduce((sum, l) => sum + Number(l.value || 0), 0);
          return <section key={stage} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 min-h-[320px]">
            <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-black text-slate-800">{stage}</h2><p className="text-[10px] text-slate-400 font-bold">{stageLeads.length} deals · KES {total.toLocaleString()}</p></div><span className="w-2 h-2 rounded-full bg-slate-400" /></div>
            <div className="space-y-2">
              {stageLeads.map(lead => <article key={lead.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between gap-2"><button onClick={() => setSelectedLead(lead)} className="text-left min-w-0"><p className="text-sm font-black text-slate-900 truncate">{lead.name}</p><p className="text-xs text-slate-500 truncate">{lead.company}</p></button>{busyId === lead.id ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <button onClick={() => openEdit(lead)} className="text-slate-400 hover:text-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>}</div>
                <div className="flex items-center justify-between mt-3"><span className="text-xs font-black text-slate-700">KES {Number(lead.value || 0).toLocaleString()}</span><span className="text-[10px] font-bold text-slate-400">{lead.probability}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, lead.probability || 0))}%` }} /></div>
                <div className="grid grid-cols-3 gap-1 mt-3">
                  <select value={lead.stage} onChange={e => moveLead(lead, e.target.value as DealStage)} className="col-span-2 text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-white"><option disabled>Move stage</option>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <button onClick={() => deleteLead(lead)} className="flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </article>)}
              {stageLeads.length === 0 && <button onClick={() => { setForm(f => ({ ...f, stage })); setIsAddOpen(true); }} className="w-full py-10 text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-xl hover:bg-white">Drop or add deal</button>}
            </div>
          </section>;
        })}
      </div>

      {selectedLead && <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={() => setSelectedLead(null)}>
        <aside className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start"><div><p className="text-xs uppercase tracking-widest font-bold text-blue-600">Deal detail</p><h2 className="text-2xl font-black text-slate-900 mt-1">{selectedLead.name}</h2><p className="text-sm text-slate-500">{selectedLead.company}</p></div><button onClick={() => setSelectedLead(null)}><X className="w-5 h-5 text-slate-400" /></button></div>
          <div className="grid grid-cols-2 gap-3 mt-6"><div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Value</p><p className="font-black">KES {Number(selectedLead.value || 0).toLocaleString()}</p></div><div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] font-bold uppercase text-slate-400">Probability</p><p className="font-black">{selectedLead.probability}%</p></div></div>
          <div className="flex flex-wrap gap-2 mt-4"><button onClick={() => onCreateProposal(selectedLead, 'create')} className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold">Create proposal</button>{selectedLead.stage !== DealStage.CLOSED && <button onClick={() => convertLead(selectedLead)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"><CheckCircle2 className="w-3 h-3 inline mr-1" />Convert to client</button>}<button onClick={() => openEdit(selectedLead)} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold">Edit</button></div>
          <div className="mt-6"><h3 className="font-black text-slate-900">Activity</h3><div className="flex gap-2 mt-2"><input value={activity} onChange={e => setActivity(e.target.value)} placeholder="Log a note or customer update" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /><button onClick={addActivity} disabled={busyId === selectedLead.id} className="px-3 rounded-lg bg-slate-900 text-white"><ArrowRight className="w-4 h-4" /></button></div><div className="mt-4 space-y-3">{(selectedLead.activityLogs || []).map(log => <div key={log.id} className="border-l-2 border-slate-200 pl-3"><p className="text-xs font-bold text-slate-700">{log.content}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(log.date).toLocaleString()} · {log.performedBy}</p></div>)}</div></div>
          <div className="mt-6"><h3 className="font-black text-slate-900">Stage actions</h3><div className="grid grid-cols-2 gap-2 mt-2">{STAGES.filter(s => s !== selectedLead.stage).map(s => <button key={s} onClick={() => moveLead(selectedLead, s)} className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold">Move to {s}</button>)}</div></div>
          <div className="mt-6 flex gap-2"><button onClick={() => reorder(selectedLead, 'up')} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold">Move up</button><button onClick={() => reorder(selectedLead, 'down')} className="flex-1 py-2 border border-slate-200 rounded-lg text-xs font-bold">Move down</button></div>
        </aside>
      </div>}

      {isAddOpen && <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"><div className="flex justify-between"><h2 className="text-xl font-black">{editingId ? 'Edit deal' : 'New deal'}</h2><button onClick={() => setIsAddOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div><div className="grid grid-cols-2 gap-3 mt-5"><input placeholder="Contact name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm" /><input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="col-span-2 border border-slate-200 rounded-xl p-3 text-sm" /><input type="number" placeholder="Value" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="border border-slate-200 rounded-xl p-3 text-sm" /><input type="number" min="0" max="100" placeholder="Probability" value={form.probability} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} className="border border-slate-200 rounded-xl p-3 text-sm" /><input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border border-slate-200 rounded-xl p-3 text-sm" /><input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="border border-slate-200 rounded-xl p-3 text-sm" /><select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value as DealStage })} className="border border-slate-200 rounded-xl p-3 text-sm font-bold"><option value={DealStage.INTAKE}>Intake</option><option value={DealStage.QUALIFIED}>Qualified</option><option value={DealStage.PROPOSAL}>Proposal</option><option value={DealStage.NEGOTIATION}>Negotiation</option></select><input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="border border-slate-200 rounded-xl p-3 text-sm" /></div><button onClick={saveForm} disabled={busyId === 'form'} className="w-full mt-5 py-3 rounded-xl bg-slate-900 text-white font-bold">{busyId === 'form' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingId ? 'Save changes' : 'Create deal'}</button></div></div>}
    </div>
  );
};

export default Pipeline;
