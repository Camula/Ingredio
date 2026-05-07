import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Eye, EyeOff, Save, CheckCircle2, AlertCircle, KeyRound, Bell, Link as LinkIcon, UserX } from 'lucide-react';
import { authService } from '../services/auth.service';

type Tab = 'Bezpieczeństwo' | 'Prywatność' | 'Powiadomienia' | 'Połączone Konta';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('Bezpieczeństwo');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [settings, setSettings] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await authService.getMe();
        setSettings(data.settings);
      } catch (err) {
        console.error('Failed to fetch settings');
      }
    };
    fetchSettings();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setStatus({ type: 'error', message: 'Nowe hasła nie są identyczne.' });
      return;
    }
    
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      await authService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setStatus({ type: 'success', message: 'Hasło zostało pomyślnie zmienione!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Błąd podczas zmiany hasła.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (category: string, key: string) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key]
      }
    };
    
    try {
      setSettings(newSettings);
      await authService.updateMe({ settings: newSettings });
    } catch (err) {
      setStatus({ type: 'error', message: 'Nie udało się zapisać ustawienia.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <header className="space-y-2">
        <h1 className="text-5xl font-black text-white font-display tracking-tight flex items-center gap-4">
          Ustawienia <Shield className="text-emerald-500 w-10 h-10" />
        </h1>
        <p className="text-slate-400 text-lg font-medium">Zarządzaj bezpieczeństwem swojego konta i prywatnością.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Nawigacja boczna ustawień */}
        <div className="lg:col-span-4 space-y-4">
           <div className="glass-panel p-4 rounded-3xl space-y-2 border-white/5">
              {(['Bezpieczeństwo', 'Prywatność', 'Powiadomienia', 'Połączone Konta'] as Tab[]).map((item) => (
                <button 
                  key={item}
                  onClick={() => { setActiveTab(item); setStatus({ type: null, message: '' }); }}
                  className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${
                    activeTab === item ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                  }`}
                >
                  {item}
                </button>
              ))}
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'Bezpieczeństwo' && (
              <motion.section 
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       <KeyRound size={24} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-white tracking-tight">Zmiana Hasła</h2>
                       <p className="text-sm text-slate-400">Zalecamy używanie unikalnego hasła dla Ingredio.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {status.type && (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-5 rounded-2xl flex items-center gap-4 ${
                          status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }`}
                      >
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold text-sm">{status.message}</span>
                      </motion.div>
                    )}

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Aktualne Hasło</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={passwords.current}
                            onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                            placeholder="••••••••"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-500 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-white/5 my-4" />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nowe Hasło</label>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                            placeholder="Minimum 8 znaków"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Potwierdź Nowe Hasło</label>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-emerald-500 outline-none transition-all shadow-inner"
                            placeholder="Powtórz nowe hasło"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row gap-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 glass-button-primary py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
                      >
                        {isLoading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Save size={20} /></motion.div> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                        Aktualizuj Hasło
                      </button>
                    </div>
                  </form>
                </div>
              </motion.section>
            )}

            {(activeTab === 'Prywatność' || activeTab === 'Powiadomienia') && (
               <motion.section 
                 key={activeTab}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-8"
               >
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       {activeTab === 'Prywatność' ? <Shield size={24} /> : <Bell size={24} />}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-white tracking-tight">{activeTab}</h2>
                       <p className="text-sm text-slate-400">Konfiguracja Twojej obecności i powiadomień.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {activeTab === 'Prywatność' ? (
                      <>
                        <ToggleItem 
                          title="Profil Publiczny" 
                          desc="Pozwól innym widzieć Twoje statystyki i wyzwania." 
                          active={settings?.privacy?.profilePublic} 
                          onToggle={() => handleToggleSetting('privacy', 'profilePublic')}
                        />
                        <ToggleItem 
                          title="Udostępniaj Anonimowe Statystyki" 
                          desc="Pomóż nam ulepszać AI poprzez analizę trendów gotowania." 
                          active={settings?.privacy?.shareStats} 
                          onToggle={() => handleToggleSetting('privacy', 'shareStats')}
                        />
                      </>
                    ) : (
                      <>
                        <ToggleItem 
                          title="Powiadomienia Push" 
                          desc="Otrzymuj przypomnienia o kończących się produktach." 
                          active={settings?.notifications?.enabled} 
                          onToggle={() => handleToggleSetting('notifications', 'enabled')}
                        />
                        <ToggleItem 
                          title="Raporty Email" 
                          desc="Cotygodniowe podsumowania Twoich postępów Zero-Waste." 
                          active={settings?.notifications?.email} 
                          onToggle={() => handleToggleSetting('notifications', 'email')}
                        />
                      </>
                    )}
                  </div>
               </motion.section>
            )}

            {activeTab === 'Połączone Konta' && (
              <motion.section 
                key="accounts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-panel p-10 rounded-[2.5rem] border-white/10 space-y-8"
              >
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <LinkIcon size={24} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-white tracking-tight">Połączone Konta</h2>
                     <p className="text-sm text-slate-400">Połącz Ingredio z innymi usługami.</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black text-xl">G</div>
                         <div>
                            <p className="text-white font-bold">Google</p>
                            <p className="text-xs text-slate-500">Niepołączone</p>
                         </div>
                      </div>
                      <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest">Połącz</button>
                   </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="glass-panel p-8 rounded-[2rem] border-red-500/10 bg-red-500/[0.02]">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                   <UserX size={24} />
                </div>
                <div className="flex-1 space-y-4">
                   <div>
                      <h3 className="text-xl font-bold text-white">Strefa Zagrożenia</h3>
                      <p className="text-sm text-slate-500">Trwałe usunięcie konta i wszystkich Twoich danych (lodówka, ulubione przepisy).</p>
                   </div>
                   <button className="px-6 py-3 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      Usuń konto Ingredio
                   </button>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const ToggleItem = ({ title, desc, active, onToggle }: any) => (
  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
    <div className="flex-1 pr-10">
      <p className="text-white font-bold uppercase tracking-wide text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{desc}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`w-14 h-7 rounded-full relative transition-all duration-300 ${active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10'}`}
    >
       <motion.div 
         animate={{ x: active ? 28 : 4 }}
         className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
       />
    </button>
  </div>
);
