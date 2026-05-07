import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  color?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({ icon: Icon, title, description, to, color = 'emerald' }) => {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ x: 4 }}
        className="glass-panel p-6 rounded-xl flex items-center gap-6 group cursor-pointer"
      >
        <div className={`w-14 h-14 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-extrabold text-xl text-white tracking-tight">{title}</h4>
          <p className="text-slate-300 text-sm mt-1">{description}</p>
        </div>

        <div className="w-10 h-10 rounded-full bg-glass flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
          <ArrowRight className="w-5 h-5" />
        </div>
      </motion.div>
    </Link>
  );
};
