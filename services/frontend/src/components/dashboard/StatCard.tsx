import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />
      
      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
        <Icon className="w-6 h-6" />
      </div>

      <div>
        <p className="text-slate-300 text-sm font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-4xl font-bold text-white mt-1 tracking-tight">{value}</h3>
      </div>

      {trend && (
        <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full w-fit">
          {trend}
        </div>
      )}
    </motion.div>
  );
};
