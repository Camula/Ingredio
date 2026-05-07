import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { fridgeService } from '../services/fridge.service';
import { recipeService } from '../services/recipe.service';
import { User, Mail, Shield, Bell, Heart, AlertCircle, Trophy, Zap, Flame, Star, ChevronRight, Award, Edit3, Save, X, LogOut } from 'lucide-react';
import { PremiumBadge } from '../components/ui/PremiumBadge';

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    fridgeItems: 0,
    favoritesCount: 0,
    xp: 1250,
    level: 12,
    streak: 3
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditName] = useState(user?.email.split('@')[0] || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const [fridgeItems, favorites] = await Promise.all([
          fridgeService.getFridgeItems(),
          recipeService.getFavorites()
        ]);
        setStats(prev => ({
          ...prev,
          fridgeItems: fridgeItems.length,
          favoritesCount: favorites.length
        }));
      } catch (err) {
        console.error('Failed to fetch profile stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveProfile = async () => {
    try {
      const response = await authService.updateMe({ name: editedName });
      if (response.token) {
        login(response.token);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { x: -20, opacity: 0 },
    show: { x: 0, opacity: 1 }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Profile Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel p-10 rounded-[3rem] relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border-white/10"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="w-40 h-40 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative z-10">
            <User className="w-20 h-20 text-white" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute inset-[-10px] rounded-[3rem] border-2 border-dashed border-emerald-500/30 opacity-50" 
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            {isEditing ? (
               <input 
                 value={editedName}
                 onChange={(e) => setEditName(e.target.value)}
                 className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-3xl font-black text-white outline-none focus:border-emerald-500"
               />
            ) : (
              <h1 className="text-5xl font-black text-white font-display tracking-tight">
                {editedName}
              </h1>
            )}
            <PremiumBadge />
          </div>
          <p className="text-slate-400 text-xl flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-6 h-6 text-emerald-500" /> {user?.email}
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
             <div className="flex items-center gap-2">
                <Zap className="text-blue-400" size={20} />
                <span className="text-white font-bold">{stats.xp} XP</span>
             </div>
             <div className="flex items-center gap-2">
                <Flame className="text-orange-500" size={20} />
                <span className="text-white font-bold">{stats.streak} Dni Streaku</span>
             </div>
             <div className="flex items-center gap-2">
                <Award className="text-amber-500" size={20} />
                <span className="text-white font-bold">Poziom {stats.level}</span>
             </div>
          </div>
        </div>

        <div className="md:border-l border-white/10 md:pl-10 space-y-4 w-full md:w-auto relative z-10">
           {isEditing ? (
             <>
                <button onClick={handleSaveProfile} className="w-full glass-button-primary bg-emerald-500 px-8 py-4 uppercase tracking-widest text-xs font-black flex items-center justify-center gap-2">
                   <Save size={16} /> Zapisz
                </button>
                <button onClick={() => setIsEditing(false)} className="w-full glass-button text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2">
                   <X size={16} /> Anuluj
                </button>
             </>
           ) : (
             <>
                <button onClick={() => setIsEditing(true)} className="w-full glass-button-primary px-8 py-4 uppercase tracking-widest text-xs font-black flex items-center justify-center gap-2 group">
                   <Edit3 size={16} className="group-hover:rotate-12 transition-transform" /> Edytuj Profil
                </button>
                <button onClick={handleLogout} className="w-full glass-button text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 group">
                   <LogOut size={16} className="group-hover:translate-x-1 transition-transform text-red-400" /> Wyloguj się
                </button>
             </>
           )}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-3xl font-black text-white font-display flex items-center gap-3 px-2">
               <Trophy className="text-amber-500" /> Twoje Postępy
            </h2>
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
               {[
                 { title: 'Mistrz Kuchni AI', value: stats.favoritesCount, target: 50, icon: Star, color: 'emerald', desc: 'Zapisane przepisy' },
                 { title: 'Strażnik Lodówki', value: stats.fridgeItems, target: 100, icon: PackageIcon, color: 'blue', desc: 'Zarządzane produkty' },
                 { title: 'Odkrywca Smaków', value: stats.level, target: 20, icon: Flame, color: 'orange', desc: 'Poziom doświadczenia' },
                 { title: 'Zero Waste Hero', value: 85, target: 100, icon: Shield, color: 'purple', desc: 'Oszczędność jedzenia (%)' }
               ].map((achievement) => (
                 <motion.div 
                   key={achievement.title}
                   variants={item}
                   className="glass-panel p-8 rounded-[2.5rem] space-y-5 border-white/5 hover:border-white/10 transition-all group"
                 >
                    <div className="flex justify-between items-start">
                       <div className={`p-4 rounded-2xl bg-${achievement.color}-500/10 text-${achievement.color}-500 group-hover:scale-110 transition-transform`}>
                          <achievement.icon size={28} />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                          <p className={`text-${achievement.color}-400 font-bold`}>{Math.round((achievement.value / achievement.target) * 100)}%</p>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-bold text-white tracking-tight">{achievement.title}</h3>
                       <p className="text-slate-400 text-sm font-medium">{achievement.desc}</p>
                    </div>
                    <div className="space-y-2">
                       <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(achievement.value / achievement.target) * 100}%` }}
                            style={{ backgroundColor: `var(--color-${achievement.color}-500)` }}
                            className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                          />
                       </div>
                       <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          <span>{achievement.value}</span>
                          <span>Cel: {achievement.target}</span>
                       </div>
                    </div>
                 </motion.div>
               ))}
            </motion.div>
          </section>
        </div>

        {/* Preferencje i ustawienia */}
        <aside className="space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-white font-display flex items-center gap-3 px-2">
               <Shield className="text-emerald-500" /> Preferencje
            </h2>
            <div className="glass-panel p-6 rounded-[2.5rem] space-y-4 border-white/5">
              {[
                { icon: Bell, label: 'Powiadomienia', value: 'Aktywne' },
                { icon: Heart, label: 'Dieta', value: 'Wegetariańska' },
                { icon: Shield, label: 'Prywatność', value: 'Wysoka' },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-emerald-500 transition-colors">
                       <pref.icon size={18} />
                    </div>
                    <span className="text-slate-200 font-bold text-sm uppercase tracking-wide">{pref.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs font-black uppercase">{pref.value}</span>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card-premium p-8 rounded-[2.5rem] space-y-6 border-amber-500/20 relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                   <Award size={24} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Twoje Odznaki</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Masz 4 nieodebrane nagrody za wyzwania tygodniowe!</p>
                <button className="w-full py-4 glass-button-primary bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest shadow-amber-500/20">
                   Odbierz Nagrody
                </button>
             </div>
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
          </section>

          <section className="pt-8 border-t border-white/5 text-center">
            <button className="text-red-500/40 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
               Usuń konto i wszystkie dane
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

const PackageIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);
