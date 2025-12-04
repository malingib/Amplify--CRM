
import React, { useState } from 'react';
import { CatalogueItem } from '../types';
import { Search, Plus, Filter, MoreHorizontal, Globe, Sparkles, Tag, Package, CheckCircle2, X, Loader2, Image as ImageIcon, Save, Building2 } from 'lucide-react';
import { analyzeBusinessForCatalogue } from '../services/geminiService';

interface CatalogueProps {
    items: CatalogueItem[];
    onUpdateItems: (items: CatalogueItem[]) => void;
}

const Catalogue: React.FC<CatalogueProps> = ({ items, onUpdateItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'All' | 'Product' | 'Service'>('All');
  
  // AI Discovery State
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryName, setDiscoveryName] = useState('');
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [discoveryContext, setDiscoveryContext] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [detectedItems, setDetectedItems] = useState<Partial<CatalogueItem>[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  // Add Item Manual State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<CatalogueItem>>({
      name: '', description: '', price: 0, category: 'Product', status: 'Active'
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  const handleScan = async () => {
    if (!discoveryName && !discoveryUrl) return;
    setIsScanning(true);
    
    // Call Gemini to analyze the URL/Context with Search Grounding
    const results = await analyzeBusinessForCatalogue(discoveryName, discoveryUrl, discoveryContext);
    
    const formattedResults = results.map((res: any) => ({
        ...res,
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        status: 'Draft',
        sku: `AUTO-${Math.floor(Math.random() * 10000)}`
    }));
    
    setDetectedItems(formattedResults);
    setIsScanning(false);
    setStep('review');
  };

  const importItems = () => {
    const newItems = detectedItems.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random(),
        status: 'Active'
    })) as CatalogueItem[];

    onUpdateItems([...items, ...newItems]);
    setShowDiscoveryModal(false);
    setStep('input');
    setDiscoveryName('');
    setDiscoveryUrl('');
    setDiscoveryContext('');
    setDetectedItems([]);
  };

  const handleAddItem = () => {
      if (!newItem.name) return;
      const itemToAdd: CatalogueItem = {
          id: Date.now().toString(),
          name: newItem.name!,
          description: newItem.description || '',
          price: newItem.price || 0,
          category: newItem.category as any || 'Product',
          status: newItem.status as any || 'Active',
          sku: `MAN-${Math.floor(Math.random() * 10000)}`
      };
      onUpdateItems([...items, itemToAdd]);
      setIsAddModalOpen(false);
      setNewItem({ name: '', description: '', price: 0, category: 'Product', status: 'Active' });
  };

  const removeDetectedItem = (id: string) => {
      setDetectedItems(detectedItems.filter(i => i.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-end mb-8 shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Catalogue & Services</h2>
                <p className="text-slate-500 font-medium mt-1 text-sm">Manage your product lines and service offerings.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowDiscoveryModal(true)}
                    className="px-5 py-2.5 bg-white border border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition flex items-center gap-2 shadow-sm text-sm"
                >
                    <Sparkles className="w-4 h-4" /> AI Auto-Discovery
                </button>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center gap-2 active:scale-95 ring-2 ring-slate-100 text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4 shrink-0">
             <div className="relative flex-1 min-w-[300px] group">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search catalogue..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 outline-none text-sm font-semibold transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                {(['All', 'Product', 'Service'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            filter === f 
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1">
                        <div className="h-32 bg-slate-50 relative border-b border-slate-100">
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    {item.category === 'Product' ? <Package className="w-8 h-8" /> : <Tag className="w-8 h-8" />}
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white shadow-sm border border-slate-100 transition">
                                    <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            <div className="absolute bottom-3 left-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                    item.category === 'Product' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                                }`}>
                                    {item.category}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-900 text-base leading-tight">{item.name}</h3>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                                {item.description}
                            </p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Price</p>
                                    <p className="text-lg font-bold text-slate-900">KES {item.price.toLocaleString()}</p>
                                </div>
                                <button className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white transition border border-slate-100">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State for Add */}
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition min-h-[280px] gap-4 group"
                >
                    <div className="w-16 h-16 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm">Add New Item</span>
                </button>
            </div>
        </div>

        {/* Add Item Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-300 relative">
                     <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
                    
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Add Catalogue Item</h3>
                        <p className="text-slate-500 font-medium mt-1 text-sm">Create a new product or service listing.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Item Name</label>
                            <input 
                                type="text" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                placeholder="e.g. Web Hosting"
                                value={newItem.name}
                                onChange={e => setNewItem({...newItem, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Category</label>
                                <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    value={newItem.category}
                                    onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                                >
                                    <option value="Product">Product</option>
                                    <option value="Service">Service</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Price (KES)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                    value={newItem.price}
                                    onChange={e => setNewItem({...newItem, price: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Description</label>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm min-h-[100px] resize-none"
                                placeholder="Item details..."
                                value={newItem.description}
                                onChange={e => setNewItem({...newItem, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300 text-sm">Cancel</button>
                        <button onClick={handleAddItem} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
                            <Save className="w-4 h-4" /> Save Item
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* AI Discovery Modal */}
        {showDiscoveryModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[90vh]">
                    <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                <Globe className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">AI Catalogue Scanner</h3>
                                <p className="text-slate-400 text-xs font-medium">Scan websites or profiles to auto-populate your catalogue.</p>
                            </div>
                        </div>
                        <button onClick={() => setShowDiscoveryModal(false)} className="text-slate-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-2 rounded-full"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto">
                        {step === 'input' ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                                    <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-blue-800">How this works</p>
                                        <p className="text-xs text-blue-600 leading-relaxed">
                                            Enter a business name and URL (website or social profile). 
                                            Our AI agent will search for real product listings. If exact data is missing, it will estimate based on the business type.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Business Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Jumia Kenya" 
                                            value={discoveryName}
                                            onChange={(e) => setDiscoveryName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-blue-300 outline-none transition text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Website URL or Social Profile</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="https://..." 
                                            value={discoveryUrl}
                                            onChange={(e) => setDiscoveryUrl(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-blue-300 outline-none transition text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Additional Context (Optional)</label>
                                    <textarea 
                                        placeholder="e.g., We specialize in electronics and home appliances..."
                                        value={discoveryContext}
                                        onChange={(e) => setDiscoveryContext(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-slate-100 focus:border-blue-300 outline-none transition text-sm min-h-[100px] resize-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-slate-900">Detected Items ({detectedItems.length})</h4>
                                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-bold border border-emerald-100">Review Mode</span>
                                </div>

                                <div className="space-y-3">
                                    {detectedItems.length > 0 ? detectedItems.map((item, idx) => (
                                        <div key={item.id || idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 group">
                                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                                                {item.category === 'Product' ? <Package className="w-5 h-5 text-slate-400" /> : <Tag className="w-5 h-5 text-slate-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                    <p className="text-xs font-bold text-emerald-600">KES {item.price?.toLocaleString()}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                                            </div>
                                            <button 
                                                onClick={() => removeDetectedItem(item.id!)}
                                                className="text-slate-300 hover:text-red-500 p-2"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-slate-400 font-medium text-sm">
                                            No items detected. Try refining your search or context.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        {step === 'input' ? (
                            <>
                                <button 
                                    onClick={() => setShowDiscoveryModal(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleScan}
                                    disabled={isScanning || (!discoveryUrl && !discoveryName)}
                                    className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                                    {isScanning ? 'Scanning...' : 'Start Scan'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setStep('input')}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition text-sm"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={importItems}
                                    disabled={detectedItems.length === 0}
                                    className="px-8 py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Import {detectedItems.length} Items
                                </button>
                            </>
                        )}
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default Catalogue;
