import { motion } from 'framer-motion';
import { Check, Crown, Zap, ShieldCheck } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0 zł',
    description: 'Dla początkujących kucharzy.',
    features: ['Limit 20 produktów', 'Podstawowe przepisy AI', 'Wsparcie społeczności'],
    button: 'Zacznij teraz',
    premium: false
  },
  {
    name: 'Pro',
    price: '19 zł',
    period: '/ mies.',
    description: 'Najlepszy wybór dla rodzin.',
    features: [
      'Nielimitowane produkty',
      'Zaawansowane filtry dietetyczne',
      'Eksport list zakupów',
      'Priorytetowe generowanie AI'
    ],
    button: 'Wybierz Pro',
    premium: true,
    popular: true
  },
  {
    name: 'Master',
    price: '199 zł',
    period: '/ rok',
    description: 'Dla prawdziwych pasjonatów.',
    features: [
      'Wszystko w planie Pro',
      'Wczesny dostęp do nowych funkcji',
      'Analiza wartości odżywczych',
      'Brak reklam na zawsze'
    ],
    button: 'Zostań Mistrzem',
    premium: true
  }
];

export default function Pricing() {
  return (
    <div className="space-y-12 py-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-5xl font-bold text-white font-display tracking-tight">
          Wybierz swój plan <span className="premium-text">Ingredio</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Oszczędzaj czas i jedzenie z jeszcze większą mocą sztucznej inteligencji.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex flex-col p-8 rounded-3xl transition-all duration-500 relative ${
              plan.popular 
                ? 'glass-panel border-emerald-500/50 scale-105 z-10 shadow-[0_0_40px_rgba(16,185,129,0.1)]' 
                : 'glass-panel border-white/5 hover:border-white/10'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                Najpopularniejszy
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-2xl font-bold mb-2 ${plan.premium ? 'premium-text' : 'text-white'}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
              <p className="text-slate-400 mt-2 text-sm">{plan.description}</p>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                  <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                    <Check size={14} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
              plan.popular 
                ? 'glass-button-primary' 
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}>
              {plan.button}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Plakietki zaufania */}
      <div className="pt-12 flex flex-wrap justify-center gap-12 border-t border-glass-border">
        <div className="flex items-center gap-3 text-slate-500">
          <ShieldCheck className="w-8 h-8" />
          <span className="text-sm font-medium">Bezpieczne płatności SSL</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <Zap className="w-8 h-8" />
          <span className="text-sm font-medium">Natychmiastowa aktywacja</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <Crown className="w-8 h-8" />
          <span className="text-sm font-medium">Gwarancja jakości AI</span>
        </div>
      </div>
    </div>
  );
}
