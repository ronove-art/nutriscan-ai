import { useState } from 'react';
import { UserProfile } from '../types';
import { db, doc, setDoc, serverTimestamp, FirebaseUser } from '../lib/firebase';
import { motion } from 'motion/react';

export default function Onboarding({ user, onComplete }: { user: FirebaseUser, onComplete: (profile: UserProfile) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: user.displayName || '',
    email: user.email || '',
    gender: 'male',
    dietGoal: 'maintenance',
    activityLevel: 'moderate',
    heightCm: 170,
    currentWeightKg: 70,
    targetWeightKg: 70,
    aiPersonality: 'friendly',
    allergens: [],
    healthConditions: [],
    macroProteinPct: 30,
    macroCarbsPct: 40,
    macroFatPct: 30,
  });

  const calculateTDEE = () => {
    // Basic Mifflin-St Jeer Equation
    // This is a placeholder, realistic app would need birthDate/age
    const weight = formData.currentWeightKg || 70;
    const height = formData.heightCm || 170;
    const age = 30; // Default
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;
    
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    return Math.round(bmr * (multipliers[formData.activityLevel as keyof typeof multipliers] || 1.55));
  };

  const saveProfile = async () => {
    const tdee = calculateTDEE();
    const finalProfile: UserProfile = {
      ...(formData as UserProfile),
      uid: user.uid,
      dailyCalorieTarget: tdee,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), finalProfile);
    onComplete(finalProfile);
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-10 flex flex-col max-w-md mx-auto">
      <div className="mb-16">
        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
          ))}
        </div>
        <h2 className="text-4xl font-light text-zinc-900 tracking-tighter leading-tight">
          {step === 1 ? 'Personal \n' : step === 2 ? 'Health \n' : 'AI \n'}
          <span className="font-semibold">{step === 1 ? 'Details.' : step === 2 ? 'Goals.' : 'Persona.'}</span>
        </h2>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 block">Identity</label>
              <div className="grid grid-cols-3 gap-4">
                {['male', 'female', 'other'].map(g => (
                  <button
                    key={g}
                    onClick={() => setFormData({ ...formData, gender: g as any })}
                    className={`py-4 rounded-2xl border-2 transition-all text-xs font-bold uppercase tracking-widest ${formData.gender === g ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-300'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Height (cm)</label>
                <input 
                  type="number" 
                  value={formData.heightCm}
                  onChange={e => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                  className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 font-medium focus:border-zinc-900 transition-colors outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Weight (kg)</label>
                <input 
                  type="number" 
                  value={formData.currentWeightKg}
                  onChange={e => setFormData({ ...formData, currentWeightKg: Number(e.target.value) })}
                  className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-900 font-medium focus:border-zinc-900 transition-colors outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 block">Action Level</label>
              <select 
                value={formData.activityLevel}
                onChange={e => setFormData({ ...formData, activityLevel: e.target.value as any })}
                className="w-full bg-white border border-zinc-200 rounded-2xl p-5 text-zinc-800 font-medium focus:border-zinc-900 outline-none transition-colors"
              >
                <option value="sedentary">Sedentary (Minimum)</option>
                <option value="light">Lightly Active</option>
                <option value="moderate">Moderate Activity</option>
                <option value="active">High Performance</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 block">Primary Trajectory</label>
              <div className="space-y-4">
                {['weight_loss', 'muscle_gain', 'maintenance'].map(g => (
                  <button
                    key={g}
                    onClick={() => setFormData({ ...formData, dietGoal: g as any })}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${formData.dietGoal === g ? 'border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-900/10' : 'border-zinc-200 bg-white text-zinc-400'}`}
                  >
                    <span className="font-semibold tracking-tight">{g.replace('_', ' ').toUpperCase()}</span>
                    {formData.dietGoal === g && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 block">AI Behavior</label>
              <div className="grid grid-cols-2 gap-4">
                {['friendly', 'strict', 'gentle', 'scientific'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFormData({ ...formData, aiPersonality: p as any })}
                    className={`p-6 rounded-[24px] border-2 transition-all text-center ${formData.aiPersonality === p ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-300'}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{p}</span>
                  </button>
                ))}
              </div>
              <p className="text-zinc-300 text-[10px] uppercase font-bold tracking-widest mt-6 text-center">
                Persona influences core advice logic
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="flex gap-4 mt-20">
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="flex-1 py-5 text-zinc-300 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
          >
            Go Back
          </button>
        )}
        <button 
          onClick={() => step < 3 ? setStep(step + 1) : saveProfile()}
          className="flex-[2] bg-zinc-900 text-white font-bold py-5 rounded-[20px] shadow-2xl shadow-zinc-900/20 active:scale-[0.98] transition-all"
        >
          {step === 3 ? 'Finalize Profile' : 'Proceed'}
        </button>
      </div>
    </div>
  );
}

