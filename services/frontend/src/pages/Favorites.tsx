import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recipeService } from '../services/recipe.service';
import type { Recipe } from '../services/recipe.service';
import { Trash2, Clock, ChefHat, CheckCircle2, XCircle, ChevronDown, BookOpen, Utensils, Heart, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function Favorites() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const data = await recipeService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await recipeService.removeFavorite(id);
      setFavorites(favorites.filter(f => f._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      console.error('Failed to delete favorite', error);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <h1 className="text-5xl font-bold text-white font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">Ulubione Smaki</h1>
             <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <Heart size={28} className="fill-current" />
             </div>
          </div>
          <p className="text-slate-300 text-lg">Twoja prywatna księga kulinarnych arcydzieł AI.</p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 glass-panel rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-24 rounded-[3.5rem] flex flex-col items-center text-center space-y-8 border-dashed border-white/10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-[60px] rounded-full" />
            <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-500 border border-white/10 relative z-10 shadow-2xl">
               <Heart size={64} strokeWidth={1.5} className="text-red-500/30" />
            </div>
          </div>
          <div className="space-y-4">
             <h3 className="text-3xl font-black text-white tracking-tight">Twoje serce jeszcze nie bije w kuchni...</h3>
             <p className="text-slate-400 text-xl max-w-lg mx-auto font-medium">Wygeneruj przepis i kliknij <span className="text-red-400 font-bold">ikonę serca</span>, aby zapisać najlepsze dania na później.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="glass-button-primary px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black uppercase tracking-widest text-sm"
            onClick={() => window.location.href = '/recipes'}
          >
            Odkryj przepisy
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {favorites.map((recipe, idx) => (
            <motion.div 
              key={recipe._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-panel rounded-[2.5rem] overflow-hidden border-white/5 hover:border-white/10 transition-all ${expandedId === recipe._id ? 'ring-2 ring-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : ''}`}
            >
              {/* Nagłówek wiersza */}
              <div 
                className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group"
                onClick={() => recipe._id && toggleExpand(recipe._id)}
              >
                <div className="flex items-center gap-6 flex-1 w-full">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Utensils size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{recipe.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="flex items-center gap-1.5 text-slate-400 text-xs font-black uppercase tracking-widest"><Clock size={14} className="text-emerald-500" /> {recipe.prepTimeMinutes} min</span>
                      <span className="flex items-center gap-1.5 text-slate-400 text-xs font-black uppercase tracking-widest"><ChefHat size={14} className="text-emerald-500" /> {recipe.difficulty}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                   <button 
                    onClick={(e) => recipe._id && handleDelete(e, recipe._id)}
                    className="p-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-lg shadow-red-500/5 group/del"
                   >
                     <Trash2 size={20} className="group-hover/del:rotate-12 transition-transform" />
                   </button>
                   <div className={`p-2 transition-transform duration-500 ${expandedId === recipe._id ? 'rotate-180' : ''}`}>
                      <ChevronDown size={24} className="text-slate-600" />
                   </div>
                </div>
              </div>

              {/* Rozwijana zawartość */}
              <AnimatePresence>
                {expandedId === recipe._id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                  >
                    <div className="p-10 border-t border-white/5 bg-white/[0.01]">
                       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                          <div className="lg:col-span-4 space-y-6">
                             <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                   <BookOpen size={16} /> Składniki
                                </h4>
                                <ul className="space-y-4">
                                  {recipe.ingredients.filter(ing => !ing.isStaple).map((ing, iIdx) => (
                                    <li key={iIdx} className="flex items-start gap-3">
                                      <div className={`mt-1 rounded-lg p-0.5 ${ing.isOwned ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                                         {ing.isOwned ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                      </div>
                                      <div>
                                        <span className="text-white text-sm font-bold block leading-tight">{ing.name}</span>
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{ing.amount} {ing.unit}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                             </div>
                          </div>

                          <div className="lg:col-span-8 space-y-8">
                             <div className="space-y-6">
                                {recipe.instructions.map((step, sIdx) => (
                                  <div key={sIdx} className="flex gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 group/step">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-lg shadow-lg group-hover/step:scale-110 transition-transform shrink-0">
                                      {sIdx + 1}
                                    </span>
                                    <p className="text-slate-200 text-lg leading-relaxed pt-1">{step}</p>
                                  </div>
                                ))}
                             </div>
                             <button className="w-full py-6 glass-button-primary rounded-3xl flex items-center justify-center gap-4 group">
                                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                                <span className="font-black uppercase tracking-widest">Gotuj To Danie</span>
                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                             </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
