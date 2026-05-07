/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fridgeService } from '../services/fridge.service';
import type { FridgeItem } from '../services/fridge.service';
import { recipeService } from '../services/recipe.service';
import type { Recipe } from '../services/recipe.service';
import { ChefHat, Clock, Heart, CheckCircle2, XCircle, Loader2, Sparkles, Filter, ChevronDown, BookOpen, Utensils, Info, Refrigerator } from 'lucide-react';

export default function Recipes() {
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [smartSupplement, setSmartSupplement] = useState(false);
  const [useAllFridgeItems, setUseAllFridgeItems] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    time: 'Dowolny',
    difficulty: 'Dowolna',
    diet: 'Dowolna',
    cuisine: 'Dowolna',
    mealType: 'Dowolny'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchFridge = async () => {
      try {
        const data = await fridgeService.getFridgeItems();
        setFridgeItems(data);
      } catch (err) {
        setError('Nie udało się pobrać lodówki');
      }
    };
    fetchFridge();
  }, []);

  const toggleItem = (name: string) => {
    setSelectedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  // Główna funkcja generowania przepisu AI
  const handleGenerate = async () => {
    if (!useAllFridgeItems && selectedItems.length === 0) {
      setError('Wybierz co najmniej jeden składnik lub aktywuj "Pełną lodówkę"');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedRecipe(null);
      setSaveSuccess(false);

      const itemsToUse = useAllFridgeItems ? fridgeItems.map(i => i.name) : selectedItems;
      const unselectedItems = useAllFridgeItems ? [] : fridgeItems.map(i => i.name).filter(n => !selectedItems.includes(n));

      const recipe = await recipeService.generateRecipe(itemsToUse, unselectedItems, smartSupplement, filters);
      setGeneratedRecipe(recipe);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Błąd generowania przepisu. Spróbuj ponownie.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Zapisywanie do ulubionych z obsługą wizualną
  const handleSaveToFavorites = async () => {
    if (!generatedRecipe) return;
    try {
      await recipeService.addFavorite(generatedRecipe);
      setSaveSuccess(true);
    } catch (err: any) {
      setError('Nie udało się zapisać przepisu.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <h1 className="text-5xl font-bold text-white font-display tracking-tight">Magia Przepisów</h1>
             <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-6 h-6" />
             </div>
          </div>
          <p className="text-slate-300 text-lg">Twoja lodówka kryje setki możliwości. Pozwól AI je odkryć.</p>
        </div>
      </header>

      {/* Konfigurator składników i trybów pracy AI */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 <Utensils className="text-emerald-500 w-6 h-6" /> Składniki
              </h2>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 {useAllFridgeItems ? 'Tryb: Pełna Lodówka' : `Wybrano: ${selectedItems.length}`}
              </div>
            </div>

            <div className={`flex flex-wrap gap-2 transition-all duration-500 ${useAllFridgeItems ? 'opacity-30 blur-[2px] grayscale pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
              {fridgeItems.map(item => (
                <motion.button
                  key={item._id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleItem(item.name)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                    selectedItems.includes(item.name)
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:border-emerald-500/30'
                  }`}
                >
                  {item.name}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Przełącznik Pełnej Lodówki */}
                  <div 
                    onClick={() => setUseAllFridgeItems(!useAllFridgeItems)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer group ${useAllFridgeItems ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${useAllFridgeItems ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                          <Refrigerator size={24} />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">Pełna Lodówka</p>
                          <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">Użyj wszystkiego co masz bez wybierania.</p>
                       </div>
                       <div className={`w-10 h-6 rounded-full relative transition-colors ${useAllFridgeItems ? 'bg-emerald-500' : 'bg-white/10'}`}>
                          <motion.div animate={{ x: useAllFridgeItems ? 18 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                       </div>
                    </div>
                  </div>

                  {/* Przełącznik Smart Supplement */}
                  <div 
                    onClick={() => setSmartSupplement(!smartSupplement)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer group ${smartSupplement ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${smartSupplement ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                          <Sparkles size={24} />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">Smart Supplement</p>
                          <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">Dodaj brakujące składniki ze sklepu.</p>
                       </div>
                       <div className={`w-10 h-6 rounded-full relative transition-colors ${smartSupplement ? 'bg-blue-500' : 'bg-white/10'}`}>
                          <motion.div animate={{ x: smartSupplement ? 18 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                       </div>
                    </div>
                  </div>
               </div>

               <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!useAllFridgeItems && selectedItems.length === 0)}
                  className="w-full glass-button-primary py-6 rounded-[2rem] flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale transition-all overflow-hidden relative"
               >
                  <ChefHat size={32} className="group-hover:rotate-12 transition-transform relative z-10" />
                  <span className="text-2xl font-black uppercase tracking-[0.1em] relative z-10">Wyczaruj Przepis</span>
                  {isGenerating && <Loader2 className="animate-spin absolute right-8" />}
               </button>
            </div>
          </div>
        </div>

        {/* Panel boczny: Preferencje i Wyzwania */}
        <aside className="space-y-6">
           <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-8">
                 <Filter size={20} className="text-emerald-500" /> Preferencje
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Czas przygotowania', key: 'time', options: ['Dowolny', 'Szybko (< 20 min)', 'Standardowo', 'Mam czas'] },
                  { label: 'Poziom trudności', key: 'difficulty', options: ['Dowolna', 'Łatwa', 'Średnia', 'Wymagająca'] },
                  { label: 'Preferencja diety', key: 'diet', options: ['Dowolna', 'Wegetariańska', 'Wegańska', 'Keto', 'Bez glutenu'] },
                ].map(f => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{f.label}</label>
                    <select 
                      value={(filters as any)[f.key]}
                      onChange={(e) => setFilters({...filters, [f.key]: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none"
                    >
                      {f.options.map(opt => <option key={opt} value={opt} className="bg-[#050807]">{opt}</option>)}
                    </select>
                  </div>
                ))}
              </div>
           </div>
        </aside>
      </section>

      {/* Wyświetlanie wyniku - Przepis AI */}
      <AnimatePresence mode="wait">
        {generatedRecipe && (
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[3.5rem] overflow-hidden relative shadow-[0_20px_80px_rgba(0,0,0,0.5)] border-white/10"
          >
            <div className="p-10 md:p-16 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
                <div className="space-y-6">
                  <h2 className="text-5xl md:text-7xl font-black text-white font-display leading-[0.9] tracking-tighter">{generatedRecipe.title}</h2>
                </div>
                <button
                  onClick={handleSaveToFavorites}
                  disabled={saveSuccess}
                  className={`p-6 rounded-3xl transition-all shadow-2xl ${saveSuccess ? 'bg-red-500 text-white shadow-red-500/30 scale-110' : 'glass-panel text-slate-500 hover:text-red-400'}`}
                >
                  <Heart size={36} className={saveSuccess ? 'fill-current' : ''} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-4 space-y-10">
                  <div className="glass-panel p-10 rounded-[3rem] bg-white/[0.01] border-white/5">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">Składniki</h3>
                    <ul className="space-y-6">
                      {generatedRecipe.ingredients.filter(ing => !ing.isStaple).map((ing, idx) => (
                        <li key={idx} className="flex items-start gap-4">
                          <div className={`mt-1.5 rounded-xl p-1 ${ing.isOwned ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                             {ing.isOwned ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                          </div>
                          <div>
                            <span className="text-white text-lg font-bold block capitalize">{ing.name}</span>
                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1 block">{ing.amount} {ing.unit}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-12">
                   <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4">Przygotowanie</h3>
                   <div className="space-y-8">
                      {generatedRecipe.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-8 p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 group">
                          <span className="flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-emerald-500 text-white font-black text-2xl shadow-lg shrink-0">{idx + 1}</span>
                          <p className="text-slate-200 text-xl leading-relaxed pt-2 font-medium">{step}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
