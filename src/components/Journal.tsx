import { useState, useEffect } from 'react';
import { db, collection, query, where, orderBy, getDocs, deleteDoc, doc } from '../lib/firebase';
import { UserProfile, MealLog } from '../types';
import { format } from 'date-fns';
import { Trash2, Utensils, Coffee, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Journal({ profile }: { profile: UserProfile }) {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const q = query(
      collection(db, 'mealLogs'),
      where('userId', '==', profile.uid),
      orderBy('consumedAt', 'desc')
    );
    const snap = await getDocs(q);
    setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as MealLog)));
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [profile.uid]);

  const deleteLog = async (id: string) => {
    await deleteDoc(doc(db, 'mealLogs', id));
    setLogs(logs.filter(l => l.id !== id));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return <Sun className="text-amber-500" />;
      case 'lunch': return <Utensils className="text-emerald-500" />;
      case 'dinner': return <Moon className="text-blue-500" />;
      default: return <Coffee className="text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1,2,3,4].map(n => (
          <div key={n} className="h-20 bg-slate-100 rounded-2xl w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-zinc-900">Meal <span className="font-semibold">Journal</span></h2>
          <p className="text-sm text-zinc-400 mt-1">Review your daily consumption.</p>
        </div>
        <span className="text-[10px] font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">
          {logs.length} Total
        </span>
      </header>

      <div className="space-y-4">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-100 flex items-center justify-between group hover:border-zinc-200 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-zinc-50 rounded-[18px] flex items-center justify-center border border-zinc-100">
                  {getIcon(log.mealType)}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900">{log.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-zinc-400 mt-1 uppercase">
                     <span className="text-zinc-900">{log.calories} kcal</span>
                     <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                     <span>{log.protein}g P</span>
                     <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                     <span>{log.carbs}g C</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 font-medium mt-1.5 grayscale">
                    {format(log.consumedAt?.toDate() || new Date(), 'EEEE, MMM d • p')}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => log.id && deleteLog(log.id)}
                className="p-3 text-zinc-300 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {logs.length === 0 && (
        <div className="text-center py-24 bg-zinc-50/50 rounded-[32px] border border-zinc-100 border-dashed flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Utensils className="w-6 h-6 text-zinc-200" />
          </div>
          <p className="text-zinc-400 font-medium text-sm tracking-tight">Your journal is empty.</p>
          <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold mt-2">Start by scanning a meal</p>
        </div>
      )}
    </div>
  );
}

