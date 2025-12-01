

import React, { useState } from 'react';
import { Target, Search, MapPin, Loader2, Sparkles, Building2, Globe, Phone, Mail, Plus, ExternalLink, RefreshCw, CheckCircle2, ArrowRight, Save, History, LayoutGrid, List as ListIcon, Map, Filter, Layers, CheckSquare, Square, Download, Trash2, FileText, Bookmark, Play, AlertTriangle, TrendingUp, X } from 'lucide-react';
import { generateLeads } from '../services/geminiService';
import { Lead, DealStage } from '../types';

interface LeadAcquisitionProps {
    onAddLead?: (lead: Lead) => void;
}

interface SavedSearch {
    id: string;
    name: string;
    industry: string;
    location: string;
    icp: string;
    leadCount: number;
    useMaps: boolean;
}

const LeadAcquisition: React.FC<LeadAcquisitionProps> = ({ onAddLead }) => {
    // Search State
    const [industry, setIndustry] = useState('');
    const [location, setLocation] = useState('');
    const [icp, setIcp] = useState(''); // Ideal Customer Profile context
    const [useMaps, setUseMaps] = useState(false);
    const [leadCount, setLeadCount] = useState(10);
    
    // Processing State
    const [isScanning, setIsScanning] = useState(false);
    const [scanStage, setScanStage] = useState(0); // 0: Idle, 1: Searching, 2: Filtering, 3: Completed
    
    // Results
    const [results, setResults] = useState<any[]>([]);
    const [sources, setSources] = useState<{title: string, uri: string}[]>([]);
    const [history, setHistory] = useState<{industry: string, location: string, date: string}[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
        { id: '1', name: 'Nairobi Tech Startups', industry: 'Fintech Startups', location: 'Nairobi, Kilimani', icp: 'Funded startups needing CRM', leadCount: 15, useMaps: false }
    ]);
    
    // Selection State
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());

    // View State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [saveSearchMode, setSaveSearchMode] = useState(false);
    const [newSearchName, setNewSearchName] = useState('');

    const handleSearch = async () => {
        if (!industry || !location) return;

        setIsScanning(true);
        setResults([]);
        setSources([]);
        setSelectedIndices(new Set());
        setAddedIndices(new Set());
        setScanStage(1);

        // Simulation of steps for UX
        setTimeout(() => setScanStage(2), 1500);

        try {
            // Include ICP in the prompt context essentially
            const fullContext = `${industry}. Ideal Customer Profile: ${icp || 'General B2B'}`;
            const { leads, sources: foundSources } = await generateLeads(fullContext, location, useMaps, leadCount);
            
            setScanStage(3);
            setResults(leads);
            setSources(foundSources);
            
            // Add to history
            setHistory(prev => [{
                industry, location, date: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 4)]); // Keep last 5

        } catch (error) {
            console.error("Lead gen failed", error);
            setScanStage(0);
        } finally {
            setIsScanning(false);
        }
    };

    const handleAddToPipeline = (lead: any, index: number) => {
        if (!onAddLead) return;
        
        const newLead: Lead = {
            id: Date.now().toString() + Math.random(),
            name: lead.company,
            company: lead.company,
            value: lead.value || 50000,
            stage: DealStage.INTAKE,
            lastContact: new Date().toISOString().split('T')[0],
            probability: 10,
            avatar: `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`,
            email: lead.email !== 'N/A' ? lead.email : '',
            phone: lead.phone !== 'N/A' ? lead.phone : '',
            notes: `Rationale: ${lead.rationale}\nAddress: ${lead.address || 'N/A'}\nRisk: ${lead.risk_assessment || 'N/A'}`,
            proposalStatus: 'None',
            source: useMaps ? 'AI Maps' : 'AI Search',
            socials: lead.socials,
            growthPotential: lead.growth_potential,
            riskAssessment: lead.risk_assessment,
            order: 0 // Default order, will be recalculated by parent if needed
        };
        
        onAddLead(newLead);
        setAddedIndices(prev => new Set(prev).add(index));
        // Deselect if selected
        if(selectedIndices.has(index)) {
             const newSet = new Set(selectedIndices);
             newSet.delete(index);
             setSelectedIndices(newSet);
        }
    };

    const handleBulkAdd = () => {
        selectedIndices.forEach(idx => {
            if (!addedIndices.has(idx)) {
                handleAddToPipeline(results[idx], idx);
            }
        });
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === results.length) {
            setSelectedIndices(new Set());
        } else {
            const allIndices = new Set(results.map((_, i) => i));
            setSelectedIndices(allIndices);
        }
    };

    const handleExportCSV = () => {
        const leadsToExport = selectedIndices.size > 0 
            ? results.filter((_, i) => selectedIndices.has(i))
            : results;
            
        if (leadsToExport.length === 0) return;

        const headers = ['Company,Contact,Email,Phone,Website,Address,Growth Potential,Risk Assessment'];
        const rows = leadsToExport.map(l => 
            `"${l.company}","${l.contact}","${l.email}","${l.phone}","${l.website}","${l.address}","${l.growth_potential || ''}","${l.risk_assessment || ''}"`
        );
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveSearch = () => {
        if (!newSearchName) return;
        const newSearch: SavedSearch = {
            id: Date.now().toString(),
            name: newSearchName,
            industry, location, icp, leadCount, useMaps
        };
        setSavedSearches([...savedSearches, newSearch]);
        setSaveSearchMode(false);
        setNewSearchName('');
    };

    const loadSearch = (search: SavedSearch) => {
        setIndustry(search.industry);
        setLocation(search.location);
        setIcp(search.icp);
        setLeadCount(search.leadCount);
        setUseMaps(search.useMaps);
    };

    const deleteSavedSearch = (id: string) => {
        setSavedSearches(savedSearches.filter(s => s.id !== id));
    };

    return (
        <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-end mb-8 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <span className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Target className="w-5 h-5" />
                        </span>
                        AI Lead Acquisition
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">Scout for new business opportunities using real-time internet scraping and map data.</p>
                </div>
                <div className="flex gap-3">
                    {/* Placeholder for future top-level actions */}
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 h-full min-h-0">
                {/* Left Panel: Search Command */}
                <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-6 overflow-y-auto hide-scrollbar pb-12">
                    
                    {/* Mission Control Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Mission Control</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">Define your target market parameters.</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setSaveSearchMode(!saveSearchMode)}
                                    className={`p-2 rounded-lg transition ${saveSearchMode ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                                    title="Save Search"
                                >
                                    <Bookmark className="w-4 h-4" />
                                </button>
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    <Filter className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {saveSearchMode && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                                <label className="block text-[10px] font-bold text-blue-600 mb-1.5 ml-1 uppercase tracking-widest">Search Name</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newSearchName}
                                        onChange={(e) => setNewSearchName(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                        placeholder="e.g. Mombasa Logistics"
                                    />
                                    <button onClick={saveSearch} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700">Save</button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Industry / Niche</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all"
                                        placeholder="e.g. Solar Energy Providers"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Target Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm transition-all"
                                        placeholder="e.g. Nairobi, Westlands"
                                    />
                                </div>
                            </div>

                             <div>
                                <div className="flex justify-between items-center mb-1.5 ml-1">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Batch Size</label>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{leadCount} Leads</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="50" 
                                        value={leadCount} 
                                        onChange={(e) => setLeadCount(parseInt(e.target.value))}
                                        className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2 uppercase">
                                        <span>1</span>
                                        <span>25</span>
                                        <span>50 Max</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <button 
                                    onClick={() => setUseMaps(!useMaps)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useMaps ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useMaps ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-xs font-bold text-slate-600">Use Google Maps Grounding</span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Ideal Customer Profile (ICP)</label>
                                <textarea 
                                    value={icp}
                                    onChange={(e) => setIcp(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm min-h-[100px] resize-none transition-all placeholder:text-slate-400"
                                    placeholder="Describe the perfect lead (e.g., companies with 50+ employees, high tech adoption, expanding operations...)"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                             <button 
                                onClick={handleSearch}
                                disabled={isScanning || !industry || !location}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Scanning...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-emerald-400 group-hover:animate-pulse" />
                                        <span>Launch Scout</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    {/* Saved Searches */}
                    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                        <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2 shrink-0">
                            <Bookmark className="w-4 h-4 text-slate-400" /> Saved Scouts
                        </h4>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {savedSearches.length > 0 ? savedSearches.map((search) => (
                                <div key={search.id} className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md hover:border-slate-100 border border-transparent cursor-pointer transition">
                                    <div onClick={() => loadSearch(search)} className="flex-1">
                                        <p className="text-xs font-bold text-slate-900">{search.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{search.industry} • {search.location}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => loadSearch(search)} className="p-1.5 hover:bg-slate-100 rounded-lg text-emerald-600" title="Load Search">
                                            <Play className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => deleteSavedSearch(search.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-red-400 hover:text-red-600" title="Delete">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center py-4">No saved searches yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Results & Visualization */}
                <div className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-amber-500 animate-pulse' : results.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                 {isScanning ? 'Scout Active' : results.length > 0 ? `${results.length} Verified Leads` : 'System Idle'}
                             </span>
                        </div>
                        
                        <div className="flex gap-2 items-center">
                            {results.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 mr-2">
                                        <button 
                                            onClick={toggleSelectAll}
                                            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                                        >
                                            {selectedIndices.size === results.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            {selectedIndices.size > 0 ? `${selectedIndices.size} Selected` : 'Select All'}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={handleExportCSV}
                                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition px-3 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50"
                                        title="Export Selected to CSV"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Export
                                    </button>
                                </>
                            )}
                            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative bg-slate-50/30">
                        {isScanning && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center">
                                <div className="w-24 h-24 relative mb-8">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                                    <Target className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {scanStage === 1 ? 'Triangulating Data Sources...' : 'Verifying Contact Information...'}
                                </h3>
                                <p className="text-slate-500 font-medium">AI Agent is scraping {useMaps ? 'Map Listings' : 'Web Profiles'}</p>
                                {leadCount > 10 && (
                                    <p className="text-xs text-amber-500 font-bold mt-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Large batch request in progress...</p>
                                )}
                            </div>
                        )}

                        {results.length > 0 ? (
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1'}`}>
                                {results.map((lead, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => toggleSelection(idx)}
                                        className={`bg-white rounded-3xl p-6 border transition-all duration-300 group flex cursor-pointer relative ${
                                            viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col'
                                        } ${selectedIndices.has(idx) ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-md bg-emerald-50/10' : 'border-slate-200 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1'}`}
                                    >
                                        {/* Selection Checkbox Overlay */}
                                        <div className="absolute top-4 right-4 z-10">
                                            {selectedIndices.has(idx) ? (
                                                <div className="bg-emerald-500 text-white rounded-lg p-1">
                                                    <CheckSquare className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="text-slate-300 p-1">
                                                    <Square className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        {addedIndices.has(idx) && (
                                            <div className="absolute top-4 left-4 z-10 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-200">
                                                Added to Pipeline
                                            </div>
                                        )}
                                        
                                        <div className={`flex justify-between items-start ${viewMode === 'list' ? 'w-1/4' : 'mb-4'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl border border-slate-100">
                                                    {lead.company.charAt(0)}
                                                </div>
                                                {viewMode === 'list' && (
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg mb-0.5">{lead.company}</h4>
                                                        <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 inline-block">
                                                            High Match
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {viewMode === 'grid' && (
                                            <>
                                                <h4 className="font-bold text-slate-900 text-lg mb-1 mt-2">{lead.company}</h4>
                                                <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs font-medium text-slate-500 mb-4">
                                                    {lead.contact !== 'N/A' && (
                                                        <span className="flex items-center gap-1"><Search className="w-3 h-3" /> {lead.contact}</span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">Est. KES {lead.value?.toLocaleString()}</span>
                                                </div>
                                            </>
                                        )}

                                        <div className={`flex-1 ${viewMode === 'list' ? 'mx-4' : 'mb-4'}`}>
                                            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                "{lead.rationale}"
                                            </p>
                                            
                                            {/* AI Insights: Growth & Risk */}
                                            {(lead.growth_potential || lead.risk_assessment) && (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {lead.growth_potential && (
                                                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Growth</p>
                                                            <p className="text-[10px] font-semibold text-blue-700 leading-tight">{lead.growth_potential}</p>
                                                        </div>
                                                    )}
                                                    {lead.risk_assessment && (
                                                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                            <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Risk</p>
                                                            <p className="text-[10px] font-semibold text-amber-700 leading-tight">{lead.risk_assessment}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`space-y-3 ${viewMode === 'list' ? 'w-1/4 flex flex-col justify-center' : 'mt-auto'}`}>
                                            <div className={`grid gap-2 ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                {lead.phone && lead.phone !== 'N/A' ? (
                                                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 truncate" title={lead.phone}>
                                                         <Phone className="w-3 h-3 text-emerald-500 shrink-0" /> {lead.phone}
                                                     </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100">
                                                         <Phone className="w-3 h-3" /> N/A
                                                     </div>
                                                )}
                                                {lead.website && lead.website !== 'N/A' ? (
                                                     <a href={lead.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition truncate">
                                                         <Globe className="w-3 h-3" /> Website
                                                     </a>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-slate-50/50 px-3 py-2 rounded-lg border border-slate-100">
                                                         <Globe className="w-3 h-3" /> N/A
                                                     </div>
                                                )}
                                            </div>

                                            {addedIndices.has(idx) ? (
                                                <button disabled className="w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 text-xs cursor-not-allowed">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Added
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleAddToPipeline(lead, idx); }}
                                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition flex items-center justify-center gap-2 text-xs shadow-lg shadow-slate-900/10 group-hover:shadow-xl"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add to Pipeline
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             !isScanning && (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                        <Target className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Hunt</h3>
                                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                                        Enter your target industry and location on the left to start the AI scout. The system will search verified business directories and live web data.
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2"><Globe className="w-5 h-5" /></div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Web Scraper</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2"><Map className="w-5 h-5" /></div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Maps Data</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2"><Sparkles className="w-5 h-5" /></div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">AI Agents</p>
                                        </div>
                                    </div>
                                </div>
                             )
                        )}
                    </div>

                    {/* Footer Sources */}
                    {sources.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-white text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Verified Sources</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {sources.map((s, i) => (
                                    <a 
                                        key={i} 
                                        href={s.uri} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                                    >
                                        {s.title.substring(0, 20)}... <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Floating Bulk Action Bar */}
                    {selectedIndices.size > 0 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl shadow-2xl p-2 px-6 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4 duration-300 ring-4 ring-white">
                            <div className="flex items-center gap-3 border-r border-slate-700 pr-6">
                                 <div className="bg-white/20 rounded-lg px-2 py-1 text-xs font-bold text-white">{selectedIndices.size}</div>
                                 <span className="text-sm font-bold">Selected</span>
                            </div>
                            <div className="flex gap-2">
                                 <button 
                                    onClick={handleBulkAdd}
                                    className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition text-sm font-bold text-emerald-400"
                                 >
                                    <Plus className="w-4 h-4" /> Add to Pipeline
                                 </button>
                                 <button 
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-xl transition text-sm font-bold"
                                 >
                                    <FileText className="w-4 h-4" /> Export CSV
                                 </button>
                                 <button 
                                    onClick={() => setSelectedIndices(new Set())}
                                    className="flex items-center gap-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-3 py-2 rounded-xl transition text-sm font-bold ml-2"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadAcquisition;

