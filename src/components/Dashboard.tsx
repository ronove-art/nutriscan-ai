import { useState, useEffect } from 'react';
import { db, collection, query, where, getDocs, Timestamp } from '../lib/firebase';
import { UserProfile, MealLog } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Flame, Target, Utensils, Award } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard({ profile }: { profile: UserProfile }) {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [stats, setStats] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    const fetchTodayLogs = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'mealLogs'),
        where('userId', '==', profile.uid),
        where('consumedAt', '>=', Timestamp.fromDate(today))
      );
      
      const querySnapshot = await getDocs(q);
      const todayLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MealLog));
      setLogs(todayLogs);

      const totals = todayLogs.reduce((acc, log) => ({
        calories: acc.calories + (log.calories * log.quantity),
        protein: acc.protein + (log.protein * log.quantity),
        carbs: acc.carbs + (log.carbs * log.quantity),
        fat: acc.fat + (log.fat * log.quantity),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      
      setStats(totals);
    };

    fetchTodayLogs();
  }, [profile.uid]);

  const macroData = [
    { name: 'Protein', value: stats.protein, color: '#10b981' },
    { name: 'Carbs', value: stats.carbs, color: '#3b82f6' },
    { name: 'Fat', value: stats.fat, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const calPercentage = Math.min(Math.round((stats.calories / profile.dailyCalorieTarget) * 100), 100);

  return (
    <div className="space-y-8">
      {/* Calorie Card */}
      <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-zinc-400 text-[10px] uppercase tracking-widest font-bold mb-3">Calories Remaining</h3>
            <p className="text-6xl font-light text-zinc-900 tracking-tighter">
              {Math.max(0, profile.dailyCalorieTarget - Math.round(stats.calories))}
            </p>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl">
            <Flame className="w-5 h-5 text-zinc-900" />
          </div>
        </div>

        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-zinc-900 rounded-full transition-all duration-1000"
            style={{ width: `${calPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          <span>{Math.round(stats.calories)} Consumed</span>
          <span>Goal: {profile.dailyCalorieTarget}</span>
        </div>
      </section>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-4">
        <MacroStat label="Prot" value={Math.round(stats.protein)} unit="g" icon={<Utensils className="w-4 h-4" />} />
        <MacroStat label="Carb" value={Math.round(stats.carbs)} unit="g" icon={<Target className="w-4 h-4" />} />
        <MacroStat label="Fat" value={Math.round(stats.fat)} unit="g" icon={<Flame className="w-4 h-4" />} />
      </div>

      {/* Charts section */}
      <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
        <h3 className="text-zinc-900 font-semibold text-lg mb-6 tracking-tight">Today's Intake</h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            {macroData.length > 0 ? (
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  stroke="none"
                  paddingAngle={8}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : index === 1 ? '#a1a1aa' : '#e4e4e7'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                <Utensils className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-xs font-medium tracking-tight">No data tracked yet</p>
              </div>
            )}
          </ResponsiveContainer>
          {macroData.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="text-2xl font-light text-zinc-900 tracking-tighter">{Math.round(stats.calories)}<span className="text-xs font-medium ml-1 text-zinc-400">kcal</span></span>
            </div>
          )}
        </div>
      </section>

      {/* Recent Meal Summary */}
      {logs.length > 0 && (
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
          <h3 className="text-zinc-900 font-semibold text-lg mb-6 tracking-tight flex items-center justify-between">
            Activity
            <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">View All</button>
          </h3>
          <div className="space-y-4">
            {logs.slice(0, 3).map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{log.name}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{log.mealType} • {format(log.consumedAt.toDate(), 'p')}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-900">+{Math.round(log.calories)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MacroStat({ label, value, unit, icon }: any) {
  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-zinc-100 flex flex-col items-center text-center">
      <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-3">{label}</p>
      <p className="text-2xl font-light text-zinc-900 tracking-tighter">{value}<span className="text-xs font-medium ml-0.5 text-zinc-300">{unit}</span></p>
    </div>
  );
}

