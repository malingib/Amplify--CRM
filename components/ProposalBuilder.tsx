
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Download, FileText, Loader2, Check, ChevronRight, ChevronLeft, User, Building2 } from 'lucide-react';
import { generateProposal } from '../services/geminiService';
import { Lead } from '../types';

interface ProposalBuilderProps {
    initialData?: Lead | null;
    mode?: 'create' | 'edit';
    onBack: () => void;
}

const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ initialData, mode = 'create', onBack }) => {
  const [clientName, setClientName] = useState('');
  const [value, setValue] = useState<string>('');
  const [services, setServices] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (initialData) {
        setClientName(initialData.name);
        setValue(initialData.value.toString());
        // If editing, pre-fill notes. If creating new, maybe leave empty or use notes as context?
        // Using notes as base context for both for now, user can edit.
        if (initialData.notes) {
            setServices(initialData.notes); 
        }
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!clientName || !value || !services) return;
    
    setIsGenerating(true);
    const content = await generateProposal(clientName, services, parseInt(value), tone);
    setGeneratedContent(content);
    setIsGenerating(false);
    setStep(2);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1800px] mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-8 shrink-0 flex items-center gap-4">
        <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:shadow-sm transition"
        >
            <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {initialData 
                    ? (mode === 'edit' ? `Edit Proposal for ${initialData.company}` : `New Proposal for ${initialData.company}`) 
                    : 'Create Proposal'}
            </h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">
                {mode === 'edit' ? 'Refine and update existing document terms.' : 'Draft a new service agreement or upsell proposal.'}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        {/* Input Section */}
        <div className="lg:col-span-5 h-full overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/40 border border-slate-200">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-900/20 border-4 border-slate-100">1</div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Deal Parameters</h3>
                    <p className="text-slate-500 text-xs font-medium mt-0.5">Enter details to generate content.</p>
                </div>
            </div>
            
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Client Contact</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className="w-full p-4 pl-12 bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition font-bold text-slate-900 placeholder:text-slate-400 text-sm shadow-sm"
                            placeholder="e.g. Safaricom PLC"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                        />
                        <User className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Total Value (KES)</label>
                    <input 
                        type="number" 
                        className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition font-bold text-slate-900 placeholder:text-slate-400 text-sm shadow-sm"
                        placeholder="e.g. 1,500,000"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Context & Deliverables</label>
                    <textarea 
                        className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-200 transition font-bold text-slate-900 min-h-[140px] resize-none placeholder:text-slate-400 leading-relaxed text-sm shadow-sm"
                        placeholder="List the products, services, and key deal points..."
                        value={services}
                        onChange={(e) => setServices(e.target.value)}
                    ></textarea>
                </div>

                 <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-500 ml-2 uppercase tracking-widest">Tone of Voice</label>
                    <div className="flex gap-3">
                        {['formal', 'friendly', 'urgent'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(t as any)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition border-2 ${
                                    tone === t 
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-800'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-10">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !clientName}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base tracking-tight"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            {mode === 'edit' ? 'Update Proposal' : 'Generate Proposal'}
                        </>
                    )}
                </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-7 h-full">
             <div className={`h-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200 flex flex-col overflow-hidden transition-all duration-500 ${step === 1 ? 'opacity-60 grayscale-[0.3]' : 'opacity-100 ring-4 ring-slate-50'}`}>
                <div className="bg-slate-50/80 p-6 flex justify-between items-center border-b border-slate-200 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-slate-200 shadow-sm">
                            <FileText className="w-6 h-6" />
                         </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-lg tracking-tight">Live Preview</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Last updated just now</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200 hover:shadow-sm"><Download className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <div className="flex-1 p-10 overflow-y-auto prose max-w-none custom-scrollbar bg-white">
                    {generatedContent ? (
                        <div className="whitespace-pre-wrap text-slate-800 leading-loose font-medium text-base">
                            {generatedContent}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center animate-pulse border-[6px] border-white shadow-inner">
                                <Sparkles className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="font-bold text-lg text-slate-400 tracking-tight">Waiting for input to generate magic...</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex justify-between items-center backdrop-blur-md">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Status: Draft</span>
                     <div className="flex gap-3">
                        <button className="px-6 py-3 text-slate-600 font-bold hover:bg-white hover:shadow-sm rounded-xl transition border border-transparent hover:border-slate-200 text-sm">Save Draft</button>
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-xl shadow-slate-900/20 active:scale-95 text-sm">
                            Approve & Send <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalBuilder;
