import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/dashboard/StatCard';
import { ActionCard } from '../components/dashboard/ActionCard';
import { Refrigerator, UtensilsCrossed, Star, Plus, Sparkles, Trophy, Flame, Zap, Heart, Crown, ChevronRight, Clock } from 'lucide-react';
import { fridgeService } from '../services/fridge.service';
import { recipeService, type Recipe } from '../services/recipe.service';
import { PremiumBadge } from '../components/ui/PremiumBadge';
import { Link } from 'react-router-dom';

const TiltCard = ({ children }: { children: React.ReactNode }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    fridgeItems: 0,
    favoritesCount: 0,
    generatedEstimate: 0,
  });
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [suggestedRecipe, setSuggestedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [fridgeItems, favs] = await Promise.all([
          fridgeService.getFridgeItems(),
          recipeService.getFavorites()
        ]);

        setStats({
          fridgeItems: fridgeItems.length,
          favoritesCount: favs.length,
          generatedEstimate: favs.length > 0 ? favs.length + 2 : 0
        });

        setFavorites(favs.slice(0, 3)); // Pokaż 3 ostatnie

        if (favs.length > 0) {
          setSuggestedRecipe(favs[favs.length - 1]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Nagłówek powitalny i status użytkownika */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white font-display">
              Cześć, <span className="text-emerald-500">{user?.email.split('@')[0]}</span>! 👋
            </h1>
            <PremiumBadge />
          </div>
          <p className="text-slate-300 text-lg">
            {isLoading ? 'Pobieranie danych Twojej kuchni...' : (
              <>
                Dzisiaj w Twojej kuchni czeka <span className="text-emerald-400 font-bold">{stats.fridgeItems} produktów</span>. Co pysznego ugotujemy?
              </>
            )}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3 border-white/5">
             <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                <Flame size={20} />
             </div>
             <div>
                <p className="text-[10px] uppercase text-slate-500 font-extrabold leading-none tracking-widest">Streak</p>
                <p className="text-white font-black text-lg">3 dni</p>
             </div>
          </div>
          <div className="glass-panel px-5 py-3 rounded-2xl flex items-center gap-3 border-white/5">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                <Zap size={20} />
             </div>
             <div>
                <p className="text-[10px] uppercase text-slate-500 font-extrabold leading-none tracking-widest">Poziom</p>
                <p className="text-white font-black text-lg">12</p>
             </div>
          </div>
        </div>
      </motion.header>

      {/* Siatka statystyk */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item}>
          <TiltCard>
            <StatCard 
              icon={Refrigerator} 
              label="Produkty w lodówce" 
              value={stats.fridgeItems} 
              trend={stats.fridgeItems > 0 ? "Gotowa do gotowania" : "Wymaga zakupów"} 
            />
          </TiltCard>
        </motion.div>
        <motion.div variants={item}>
          <TiltCard>
            <StatCard 
              icon={UtensilsCrossed} 
              label="Odkryte smaki" 
              value={stats.generatedEstimate} 
              trend="AI Master" 
            />
          </TiltCard>
        </motion.div>
        <motion.div variants={item}>
          <TiltCard>
            <StatCard 
              icon={Heart} 
              label="Ulubione potrawy" 
              value={stats.favoritesCount} 
            />
          </TiltCard>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {/* Szybkie Akcje */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
              <Plus className="text-emerald-500" /> Szybkie akcje
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                icon={Plus}
                title="Zatowaruj lodówkę"
                description="Dodaj nowe składniki, które właśnie kupiłeś."
                to="/fridge"
              />
              <ActionCard 
                icon={Sparkles}
                title="Wyczaruj przepis"
                description="Pozwól AI zaproponować danie z Twoich zapasów."
                to="/recipes"
                color="emerald"
              />
            </div>
          </div>

          {/* MOJE POLUBIONE POTRAWY */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
                <Heart className="text-red-500" /> Moje polubione potrawy
              </h2>
              <Link to="/favorites" className="text-emerald-400 text-xs font-black uppercase tracking-widest hover:text-emerald-300 transition-colors flex items-center gap-1">
                 Zobacz wszystkie <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <AnimatePresence>
                  {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 glass-panel rounded-3xl animate-pulse" />)
                  ) : favorites.length > 0 ? (
                    favorites.map((recipe, idx) => (
                      <motion.div
                        key={recipe._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-panel p-5 rounded-3xl hover:border-emerald-500/30 transition-all group cursor-pointer"
                        onClick={() => window.location.href = '/favorites'}
                      >
                         <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                            <UtensilsCrossed size={20} />
                         </div>
                         <h4 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-emerald-400 transition-colors">{recipe.title}</h4>
                         <div className="flex items-center gap-3 text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                            <span className="flex items-center gap-1"><Clock size={10} /> {recipe.prepTimeMinutes}m</span>
                            <span className="flex items-center gap-1"><Star size={10} /> {recipe.difficulty}</span>
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full glass-panel p-10 rounded-[2rem] border-dashed border-white/10 text-center">
                       <p className="text-slate-500 text-sm font-medium">Brak polubionych potraw. Zacznij gotować z AI!</p>
                    </div>
                  )}
               </AnimatePresence>
            </div>
          </div>

          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group border-white/10"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -mr-64 -mt-64 group-hover:bg-emerald-500/10 transition-all duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">
                   Sugerowane przez AI
                </div>
                {suggestedRecipe ? (
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-white font-display leading-tight">{suggestedRecipe.title}</h3>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Twoje ulubione danie! Masz większość składników, aby przygotować je ponownie w <span className="text-emerald-400 font-bold">{suggestedRecipe.prepTimeMinutes} minut</span>.
                    </p>
                    <Link to="/recipes" className="inline-block">
                      <button className="glass-button-primary px-10 py-4 rounded-2xl font-black uppercase tracking-wider text-sm">
                        Gotuj teraz
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black text-white font-display leading-tight">Czas na coś nowego?</h3>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Twoja lodówka kryje niesamowite możliwości. Wybierz składniki, a wejdź w świat smaków.
                    </p>
                    <Link to="/recipes" className="inline-block">
                      <button className="glass-button-primary px-10 py-4 rounded-2xl font-black uppercase tracking-wider text-sm">
                        Odkryj smaki
                      </button>
                    </Link>
                  </div>
                )}
              </div>
              <div className="w-64 h-64 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
                 <UtensilsCrossed className="w-24 h-24 text-emerald-500/40 relative z-10" />
              </div>
            </div>
          </motion.section>
        </div>

        <div className="space-y-8">
           <h2 className="text-2xl font-bold text-white font-display flex items-center gap-3">
              <Trophy className="text-amber-500" /> Twoje postępy
           </h2>
           <div className="glass-panel p-8 rounded-[2rem] space-y-8 border-white/5">
              {[
                { icon: Star, title: 'Mistrz Kuchni', progress: stats.favoritesCount * 10 > 100 ? 100 : stats.favoritesCount * 10, color: 'emerald', label: 'LVL 12' },
                { icon: Flame, title: 'Zero Waste', progress: 65, color: 'orange', label: 'PRO' },
                { icon: Trophy, title: 'Odkrywca', progress: 40, color: 'blue', label: 'TOP 5%' }
              ].map(challenge => (
                <div key={challenge.title} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${challenge.color}-500/10 text-${challenge.color}-500`}>
                        <challenge.icon size={16} />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-wider">{challenge.title}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{challenge.label}</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${challenge.progress}%` }}
                      style={{ backgroundColor: `var(--color-${challenge.color}-500)` }}
                      className="h-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                </div>
              ))}
              <Link to="/profile" className="block w-full">
                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                   Szczegóły profilu
                </button>
              </Link>
           </div>
           
           <div className="glass-card-premium p-8 rounded-[2.5rem] space-y-5 border-amber-500/20">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Crown size={20} />
                 </div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter">Plan <span className="premium-text">Premium</span></h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Odblokuj inteligentne listy zakupów i zaawansowane skanowanie produktów.</p>
              <Link to="/pricing" className="block">
                <button className="w-full py-4 glass-button-primary bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white text-sm font-black uppercase tracking-widest">
                   Ulepsz konto
                </button>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
