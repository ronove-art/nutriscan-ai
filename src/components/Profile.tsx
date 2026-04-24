import { useState } from 'react';
import { db, doc, updateDoc, serverTimestamp } from '../lib/firebase';
import { UserProfile } from '../types';
import { User, Target, Activity, MessageSquare, ChevronRight, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile({ profile, onUpdate }: { profile: UserProfile, onUpdate: (p: UserProfile) => void }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(profile);

  const handleUpdate = async () => {
    const docRef = doc(db, 'users', profile.uid);
    const updated = { ...formData, updatedAt: serverTimestamp() };
    await updateDoc(docRef, updated);
    onUpdate(updated as UserProfile);
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-tight text-zinc-900">Your <span className="font-semibold">Account</span></h2>
          <p className="text-sm text-zinc-400 mt-1">Manage your health profile.</p>
        </div>
        <button 
          onClick={() => editing ? handleUpdate() : setEditing(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
            editing ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' : 'bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900'
          }`}
        >
          {editing ? 'Save Changes' : <><Settings size={14} /> Manage</>}
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-[24px] flex items-center justify-center text-zinc-300">
             <User size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">{profile.fullName}</h3>
            <p className="text-zinc-400 text-xs font-medium mt-1">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-8">
          <ProfileField label="Primary Goal" value={profile.dietGoal.replace('_', ' ')} editable={editing}>
             <select 
               value={formData.dietGoal} 
               onChange={e => setFormData({ ...formData, dietGoal: e.target.value as any })}
               className="bg-zinc-50 rounded-xl p-3 text-sm w-full outline-none border border-zinc-100 focus:border-zinc-900 transition-colors"
             >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
             </select>
          </ProfileField>

          <ProfileField label="Activity Level" value={profile.activityLevel.replace('_', ' ')} editable={editing}>
            <select 
               value={formData.activityLevel} 
               onChange={e => setFormData({ ...formData, activityLevel: e.target.value as any })}
               className="bg-zinc-50 rounded-xl p-3 text-sm w-full outline-none border border-zinc-100 focus:border-zinc-900 transition-colors"
             >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
             </select>
          </ProfileField>

          <ProfileField label="AI personality" value={profile.aiPersonality} editable={editing}>
             <select 
               value={formData.aiPersonality} 
               onChange={e => setFormData({ ...formData, aiPersonality: e.target.value as any })}
               className="bg-zinc-50 rounded-xl p-3 text-sm w-full outline-none border border-zinc-100 focus:border-zinc-900 transition-colors"
             >
                <option value="friendly">Friendly</option>
                <option value="strict">Strict</option>
                <option value="gentle">Gentle</option>
                <option value="scientific">Scientific</option>
             </select>
          </ProfileField>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">Physical Stats</h4>
        <div className="grid grid-cols-2 gap-6">
          <StatBox label="Daily Target" val={`${profile.dailyCalorieTarget}`} unit="kcal" />
          <StatBox label="Current Weight" val={`${profile.currentWeightKg}`} unit="kg" />
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, children, editable }: any) {
  return (
    <div className="border-b border-zinc-50 pb-6 last:border-0 last:pb-0">
      <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-300 mb-2">{label}</p>
      {editable ? children : (
        <p className="text-zinc-900 font-medium capitalize tracking-tight">{value}</p>
      )}
    </div>
  );
}

function StatBox({ label, val, unit }: any) {
  return (
    <div className="bg-zinc-50/50 rounded-[24px] p-6 border border-zinc-100 transition-colors hover:border-zinc-200">
      <p className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 mb-3">{label}</p>
      <p className="text-3xl font-light text-zinc-900 tracking-tighter">{val}<span className="text-xs font-medium ml-1 text-zinc-300">{unit}</span></p>
    </div>
  );
}

