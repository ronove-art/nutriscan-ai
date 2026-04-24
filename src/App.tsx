/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, cloneElement } from 'react';
import { auth, db, loginWithGoogle, logout, onAuthStateChanged, doc, getDoc, FirebaseUser } from './lib/firebase';
import { UserProfile } from './types';
import { cn } from './lib/utils';
import { 
  Scan, 
  Home as HomeIcon, 
  History, 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  Activity,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sections
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Journal from './components/Journal';
import Coach from './components/Coach';
import Profile from './components/Profile';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';


export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Activity className="w-12 h-12 text-emerald-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Landing onLogin={loginWithGoogle} />;
  }

  if (!profile) {
    return <Onboarding user={user} onComplete={setProfile} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard profile={profile} />;
      case 'scan': return <Scanner profile={profile} onLogScan={() => setActiveTab('history')} />;
      case 'history': return <Journal profile={profile} />;
      case 'coach': return <Coach profile={profile} />;
      case 'profile': return <Profile profile={profile} onUpdate={setProfile} />;
      default: return <Dashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col max-w-md mx-auto relative shadow-2xl shadow-zinc-200/50 overflow-hidden border-x border-zinc-200">
      {/* Header */}
      <header className="p-6 bg-white/80 backdrop-blur-md border-b border-zinc-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center transform hover:rotate-0 transition-transform">
            <Activity className="text-white w-4 h-4" />
          </div>
          <h1 className="font-semibold text-lg text-zinc-900 tracking-tight">NutriScan <span className="font-light text-zinc-400">AI</span></h1>
        </div>
        <button onClick={logout} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-zinc-100 p-4 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex justify-around items-center z-50">
        <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<HomeIcon />} label="Home" />
        <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History />} label="Logs" />
        
        <button 
          onClick={() => setActiveTab('scan')}
          className="relative -top-8 w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-zinc-900/20 border-4 border-zinc-50 active:scale-95 transition-all"
        >
          <Scan className="w-6 h-6" />
        </button>

        <NavItem active={activeTab === 'coach'} onClick={() => setActiveTab('coach')} icon={<MessageSquare />} label="Coach" />
        <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon />} label="Profile" />
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300",
        active ? "text-zinc-900 scale-105" : "text-zinc-300"
      )}
    >
      {cloneElement(icon, { size: 20, strokeWidth: active ? 2.5 : 2 })}
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-widest leading-none",
        active ? "opacity-100" : "opacity-0"
      )}>{label}</span>
    </button>
  );
}


