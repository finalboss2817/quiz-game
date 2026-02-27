import { useState } from 'react';
import { motion } from 'motion/react';
import { Sword, Sparkles } from 'lucide-react';

export default function Auth({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b,0%,#09090b,100%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 rounded-[2.5rem] max-w-md w-full text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
        
        <div className="mb-8 inline-flex p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/40">
          <Sword className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl font-display font-bold mb-4 tracking-tight">Welcome, Scholar</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          The battlefield of knowledge awaits. Enter your codename to begin your HSC mastery journey.
        </p>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onLogin(name.trim());
          }}
          className="space-y-4"
        >
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter Codename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600"
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full neo-btn-primary py-4 text-lg flex items-center justify-center gap-2 group"
          >
            Enter the Arena
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex justify-center gap-8 text-xs text-zinc-500 font-medium tracking-widest uppercase">
          <span>Real-time</span>
          <span>Competitive</span>
          <span>Syllabus-Based</span>
        </div>
      </motion.div>
    </div>
  );
}
