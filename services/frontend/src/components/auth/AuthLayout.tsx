import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Elementy dekoracyjne */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 mb-4">
            <UtensilsCrossed className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white font-display tracking-tight">{title}</h1>
          <p className="text-slate-400">{subtitle}</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
