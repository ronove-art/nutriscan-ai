import { useState, useEffect, useRef, FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { UserProfile, ChatMessage } from '../types';
import { ai } from '../lib/gemini';
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Coach({ profile }: { profile: UserProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('userId', '==', profile.uid),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsubscribe;
  }, [profile.uid]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Save User Message
      await addDoc(collection(db, 'chats'), {
        userId: profile.uid,
        role: 'user',
        content: userMsg,
        timestamp: serverTimestamp()
      });

      // Get AI Response
      // Only send last 5 messages for context to keep it snappy
      const chatContext = messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      
      const prompt = `
        You are LUMINA COACH, a professional, science-backed nutrition expert. 
        User Profile: ${profile.dietGoal} goal, weight ${profile.currentWeightKg}kg, target ${profile.dailyCalorieTarget}kcal.
        Tone: ${profile.aiPersonality} but highly structured and minimalist.
        
        Guidelines:
        1. Use Indonesian language.
        2. Use Markdown for structure (Bold keys, bullet points).
        3. Never write long paragraphs. Keep it punchy.
        4. If giving data, use a clean list.
        
        Previous Context:
        ${chatContext}
        
        User Message: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const aiResponse = response.text || "Mohon maaf, bisakah Anda ulangi?";

      // Save Assistant Message
      await addDoc(collection(db, 'chats'), {
        userId: profile.uid,
        role: 'assistant',
        content: aiResponse,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto space-y-6 px-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-[32px] flex items-center justify-center mb-6">
              <Bot className="text-zinc-900 w-8 h-8 font-light" />
            </div>
            <h3 className="text-zinc-900 font-semibold tracking-tight text-xl mb-2">NutriScan AI Coach</h3>
            <p className="text-zinc-400 text-sm max-w-[240px] leading-relaxed">
              Your personal companion for science-driven nutrition advice.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] p-6 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-zinc-900 text-white rounded-[28px] rounded-tr-none' 
                : 'bg-white text-zinc-900 rounded-[28px] rounded-tl-none border border-zinc-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'opacity-40' : 'text-zinc-300'}`}>
                  {msg.role === 'assistant' ? 'Lumina Intelligence' : 'Authenticated User'}
                </span>
              </div>
              
              <div className={`markdown-body text-sm leading-relaxed font-medium ${msg.role === 'user' ? 'text-zinc-100' : 'text-zinc-800'}`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 rounded-[28px] rounded-tl-none p-6 shadow-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-zinc-200 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-zinc-900 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-6 flex gap-3">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Lumina anything..."
          disabled={loading}
          className="flex-1 bg-white border border-zinc-200 rounded-2xl px-6 py-5 text-sm font-medium focus:outline-none focus:border-zinc-900 transition-colors placeholder:text-zinc-300"
        />
        <button 
          type="submit"
          disabled={loading || !input.trim()}
          className="w-16 h-16 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-zinc-900/10 disabled:opacity-30 transition-all active:scale-95"
        >
          <Send size={22} />
        </button>
      </form>

    </div>
  );
}

