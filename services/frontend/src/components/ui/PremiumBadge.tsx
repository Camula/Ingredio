import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export const PremiumBadge = () => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider"
    >
      <Crown className="w-3 h-3" />
      Premium
    </motion.div>
  );
};
