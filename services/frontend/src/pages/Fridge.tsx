/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fridgeService } from '../services/fridge.service';
import type { FridgeItem } from '../services/fridge.service';
import { recipeService } from '../services/recipe.service';
import { Trash2, Plus, Search, Edit2, Check, X, Mic, Loader2, Refrigerator, Info, Package } from 'lucide-react';

const UNITS = ['szt.', 'g', 'kg', 'ml', 'l', 'opak.', 'ząbek', 'pęczek'];

export default function Fridge() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [amountValue, setAmountValue] = useState<string>('');
  const [unitValue, setUnitValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Głos i Nagrywanie
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Edycja produktu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editUnit, setEditUnit] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const data = await fridgeService.getFridgeItems();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd pobierania lodówki');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Autouzupełnianie i podpowiedzi składników
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await fridgeService.searchIngredients(inputValue);
        setSuggestions(results);
      } catch (err) {
        console.error('Błąd podpowiedzi', err);
      }
    }, 300);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [inputValue]);

  const handleAdd = async (name: string) => {
    if (!name.trim()) return;
    try {
      setIsAdding(true);
      const amount = amountValue ? parseFloat(amountValue) : undefined;
      await fridgeService.addFridgeItem(name, amount, unitValue || undefined);
      setInputValue('');
      setAmountValue('');
      setUnitValue('');
      setSuggestions([]);
      setError(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd dodawania składnika');
    } finally {
      setIsAdding(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Nie udało się uzyskać dostępu do mikrofonu.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceUpload = async (blob: Blob) => {
    try {
      setIsProcessingVoice(true);
      setError(null);
      const { ingredients, transcription } = await recipeService.parseVoice(blob);
      if (ingredients.length === 0) {
        setError(`Nie rozpoznano składników w mowie: "${transcription}"`);
        return;
      }
      await fridgeService.addFridgeItemsBatch(ingredients);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd przetwarzania mowy');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fridgeService.removeFridgeItem(id);
      setItems(items.filter((item) => item._id !== id));
      setError(null);
    } catch (err: any) {
      setError('Błąd usuwania składnika');
    }
  };

  const startEditing = (item: FridgeItem) => {
    setEditingId(item._id);
    setEditName(item.name);
    setEditAmount(item.amount?.toString() || '');
    setEditUnit(item.unit || '');
  };

  const handleUpdate = async (id: string) => {
    try {
      const amount = editAmount ? parseFloat(editAmount) : null;
      await fridgeService.updateFridgeItem(id, {
        name: editName,
        amount: amount as any,
        unit: editUnit || null as any
      });
      setEditingId(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd edycji składnika');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header: Status Lodówki i sterowanie głosem */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white font-display tracking-tight">Twoja Lodówka</h1>
          <p className="text-slate-300 text-lg">Zarządzaj składnikami i pozwól AI wyczarować obiad.</p>
        </div>
        <div className="flex items-center gap-4">
           <motion.div 
             animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
             transition={{ repeat: Infinity, duration: 1.5 }}
             className={`p-4 rounded-2xl glass-panel transition-all ${isRecording ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'text-emerald-500 border-emerald-500/20'}`}
           >
              <Mic className="w-6 h-6" />
           </motion.div>
           <button 
             onClick={isRecording ? stopRecording : startRecording}
             className={`px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl ${isRecording ? 'bg-red-500 text-white shadow-red-500/20' : 'glass-button-primary'}`}
           >
             {isRecording ? 'Zatrzymaj' : 'Dodaj głosowo'}
           </button>
        </div>
      </header>

      {/* Panel dodawania produktów */}
      <section className="glass-panel p-8 rounded-3xl relative overflow-visible border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-6 relative">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Nazwa produktu</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Np. Soczysty Pomidor..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all shadow-inner"
              />
            </div>
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.ul 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 w-full mt-2 glass-panel rounded-2xl overflow-hidden shadow-2xl border-white/10"
                >
                  {suggestions.map((suggestion: any, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleAdd(suggestion)}
                      className="px-6 py-4 hover:bg-emerald-500/20 cursor-pointer text-white border-b border-white/5 last:border-0 transition-colors font-medium"
                    >
                      {suggestion}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Ilość</label>
            <input
              type="number"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white/10 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-2 ml-1">Jedn.</label>
            <div className="relative">
              <select
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer"
              >
                <option value="" className="bg-background">---</option>
                {UNITS.map(u => <option key={u} value={u} className="bg-background">{u}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <Plus size={16} className="rotate-45" />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => handleAdd(inputValue)}
              disabled={isAdding || !inputValue.trim()}
              className="w-full py-4 glass-button-primary rounded-2xl flex items-center justify-center disabled:opacity-50 shadow-xl"
            >
              {isAdding ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 flex justify-between items-center shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Info size={20} />
            </div>
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:bg-red-500/20 p-2 rounded-lg transition-colors"><X size={20} /></button>
        </motion.div>
      )}

      {/* Lista produktów w lodówce */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-3xl font-bold text-white font-display">Twoje zapasy</h2>
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            {items.length} Składników
          </span>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 glass-panel rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-20 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 border-dashed border-white/5"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500/20 border border-emerald-500/10">
              <Refrigerator size={56} />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-white">Lodówka świeci pustkami</p>
              <p className="text-slate-300 max-w-sm">Twoja kuchnia czeka na pierwsze składniki. Dodaj je ręcznie lub użyj głosu!</p>
            </div>
            <button 
              onClick={() => (document.querySelector('input') as HTMLInputElement)?.focus()}
              className="glass-button text-sm px-6 py-3"
            >
              Dodaj pierwszy produkt
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode='popLayout'>
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  whileHover={{ y: -5 }}
                  className="glass-panel p-6 rounded-3xl group transition-all hover:border-emerald-500/40 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                  
                  {editingId === item._id ? (
                    <div className="space-y-4">
                       <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                        />
                        <button onClick={() => handleUpdate(item._id)} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                          <Check size={20} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-3 bg-white/10 text-slate-400 rounded-xl hover:bg-white/20">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between gap-6">
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                          <Package size={28} />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditing(item)}
                            className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-bold text-white capitalize group-hover:text-emerald-400 transition-colors">{item.name}</h4>
                        <p className="text-slate-300 font-medium mt-1">
                          Ilość: <span className="text-white">{item.amount || '0'}</span> <span className="text-emerald-400 font-bold">{item.unit || 'szt.'}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

const AlertCircle = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
