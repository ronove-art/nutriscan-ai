import { Activity, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-16"
      >
        <div className="w-20 h-20 bg-zinc-900 rounded-[28px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-zinc-900/20">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-zinc-900 rounded-full" />
          </div>
        </div>
        <h1 className="text-5xl font-light tracking-tighter text-zinc-900 mb-4">Lumina <span className="font-semibold">Scan.</span></h1>
        <p className="text-zinc-400 text-lg max-w-[260px] mx-auto font-medium leading-relaxed tracking-tight">
          Precision nutrition powered by minimalist intelligence.
        </p>
      </motion.div>

      <div className="w-full max-w-xs space-y-4">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="w-full bg-zinc-900 text-white font-bold py-5 rounded-[20px] flex items-center justify-center gap-4 shadow-xl shadow-zinc-900/20"
        >
          <span className="text-sm tracking-tight capitalize">Mulai Sekarang</span>
        </motion.button>
        
        <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-[0.2em]">100% Offline • Private Data</p>
      </div>

      <div className="mt-24 flex items-center gap-6 opacity-20">
        <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
        <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
        <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
      </div>
    </div>
  );
}

