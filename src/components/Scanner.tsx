import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { db, collection, query, where, getDocs, addDoc, serverTimestamp } from '../lib/firebase';
import { UserProfile, MenuItem } from '../types';
import { getScanAdvice, identifyFoodFromImage } from '../lib/gemini';
import { X, CheckCircle, Info, Sparkles, Camera, RefreshCcw, Upload, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Scanner({ profile, onLogScan }: { profile: UserProfile, onLogScan: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<MenuItem | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (scanning && !result && !loading) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanning, result, loading]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Camera access error:", err);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  const processImage = async (base64Image: string) => {
    setLoading(true);
    setScanning(false);
    
    try {
      const identified = await identifyFoodFromImage(base64Image, profile);
      
      const menuItem: MenuItem = {
        id: 'ai-generated',
        restaurantId: 'ai',
        name: identified.name || 'Unknown Food',
        calories: identified.calories || 0,
        protein: identified.protein || 0,
        carbs: identified.carbs || 0,
        fat: identified.fat || 0,
        sugar: identified.sugar || 0,
        sodium: identified.sodium || 0,
        servingSize: identified.servingSize || 100,
        category: 'main'
      };

      setResult(menuItem);

      const logsQuery = query(collection(db, 'mealLogs'), where('userId', '==', profile.uid));
      const logsSnap = await getDocs(logsQuery);
      const todayLogs = logsSnap.docs.map(d => d.data());
      
      const adviceResult = await getScanAdvice(menuItem, profile, todayLogs);
      setAdvice(adviceResult);
    } catch (error) {
      console.error("Food identification error:", error);
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  async function captureAndIdentify() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      await processImage(base64Image);
    }
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      await processImage(base64);
    };
    reader.readAsDataURL(file);
  };


  const logMeal = async () => {
    if (!result) return;
    
    await addDoc(collection(db, 'mealLogs'), {
      userId: profile.uid,
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      quantity: 1,
      mealType: 'lunch', 
      consumedAt: serverTimestamp()
    });

    onLogScan();
  };

  // Helper to parse untidy AI text into UI blocks
  const renderAdvice = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const [label, ...contentParts] = line.split(':');
          const content = contentParts.join(':').trim();
          
          if (!content) return <p key={idx} className="text-zinc-900 text-sm">{line}</p>;

          return (
            <div key={idx} className="border-l-2 border-zinc-200 pl-4 py-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 block mb-1">
                {label.replace(/^- /, '')}
              </span>
              <p className="text-zinc-900 text-sm font-medium leading-relaxed italic">
                "{content}"
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {scanning && !result && !loading && (
        <div className="relative bg-white rounded-[40px] overflow-hidden shadow-sm border border-zinc-100 p-2 group">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full aspect-square object-cover rounded-[32px] bg-zinc-50"
          />
          
          {/* Controls Overlay */}
          <div className="absolute inset-x-0 bottom-8 px-8 flex justify-between items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all text-zinc-400 hover:text-zinc-900"
            >
              <Upload size={18} />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </button>

            <button 
              onClick={captureAndIdentify}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-[6px] border-zinc-900 active:scale-90 transition-transform"
            >
              <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center">
                <Camera className="text-white w-7 h-7" />
              </div>
            </button>

            <div className="w-12 h-12 flex items-center justify-center text-zinc-400" title="Auto-detecting food...">
               <RefreshCcw size={18} className="animate-spin-slow" />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-zinc-100"
          >
            <div className="w-24 h-24 bg-zinc-50 rounded-[32px] flex items-center justify-center mb-8 relative rotate-12">
              <Sparkles className="w-12 h-12 text-zinc-900" />
              <div className="absolute inset-0 border-t-2 border-zinc-900 rounded-[32px] animate-spin" />
            </div>
            <p className="font-light text-zinc-900 tracking-tighter text-3xl">Analyzing <span className="font-semibold">Pixels.</span></p>
            <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest mt-4">Cross-referencing nutritional nodes</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-zinc-200/50 border border-zinc-100"
          >
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl font-light text-zinc-900 tracking-tighter leading-tight">
                    {result.name.split(' ')[0]} <br/> 
                    <span className="font-semibold">{result.name.split(' ').slice(1).join(' ')}</span>
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Confidence Score: High</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setResult(null); setScanning(true); }} 
                  className="p-4 bg-zinc-50 rounded-[20px] text-zinc-300 hover:text-zinc-900 transition-colors"
                >
                  <RefreshCcw size={18} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-10">
                <NutriBadge label="Cal" val={result.calories} />
                <NutriBadge label="Prot" val={result.protein} unit="g" />
                <NutriBadge label="Carb" val={result.carbs} unit="g" />
                <NutriBadge label="Fat" val={result.fat} unit="g" />
              </div>

              {advice && (
                <div className="bg-zinc-50/50 rounded-[32px] p-8 mb-10 border border-zinc-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
                       <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-zinc-900 text-[10px] uppercase tracking-[0.3em]">Lumina Insight Report</span>
                  </div>
                  {renderAdvice(advice)}
                </div>
              )}

              <button 
                onClick={logMeal}
                className="w-full bg-zinc-900 text-white font-bold py-6 rounded-[24px] flex items-center justify-center gap-4 shadow-2xl shadow-zinc-900/30 active:scale-[0.98] transition-all"
              >
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="text-lg tracking-tight">Log to Daily Diary</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!result && !loading && (
        <div className="bg-zinc-50/50 rounded-[32px] p-8 border border-zinc-100 border-dashed flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100">
            <FileImage className="w-5 h-5 text-zinc-300" />
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed font-medium uppercase tracking-[0.1em] max-w-[240px]">
            Capture a live photo or upload a PNG to start the <span className="text-zinc-900 font-bold">Spectral Analysis.</span>
          </p>
        </div>
      )}
    </div>
  );
}



function NutriBadge({ label, val, unit }: any) {
  return (
    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-center">
      <p className="text-[8px] uppercase font-bold text-zinc-300 mb-2 tracking-widest">{label}</p>
      <p className="text-lg font-light text-zinc-900 tracking-tighter">
        {val}
        {unit && <span className="text-[10px] ml-0.5 text-zinc-300">{unit}</span>}
      </p>
    </div>
  );
}

