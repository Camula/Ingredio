import { motion } from 'framer-motion';
import { Home, Refrigerator, User, Settings, LogOut, UtensilsCrossed, Crown, Heart } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Refrigerator, label: 'Lodówka', path: '/fridge' },
  { icon: UtensilsCrossed, label: 'Przepisy', path: '/recipes' },
  { icon: User, label: 'Profil', path: '/profile' },
  { icon: Heart, label: 'Ulubione', path: '/favorites' },
  { icon: Crown, label: 'Premium', path: '/pricing', premium: true },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-4 bottom-4 w-64 glass-panel rounded-xl p-6 flex flex-col z-50"
    >
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <UtensilsCrossed className="text-white w-6 h-6" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">Ingredio</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : item.premium 
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-glass-border space-y-2">
        <Link to="/settings">
          <div className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
            location.pathname === '/settings' 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5'
          }`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Ustawienia</span>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Wyloguj</span>
        </button>
      </div>
    </motion.aside>
  );
};
