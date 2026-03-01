import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Users, Link as LinkIcon, Trophy, LogOut, Play, Send, Copy, Check, FileText, Sparkles, Loader2, Upload, FileUp } from 'lucide-react';
import { Question, Player, GameState } from './types';

// Components
import Auth from './components/Auth';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Battlefield from './components/Battlefield';

export default function App() {
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const saved = localStorage.getItem('hsc_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    roomId: null,
    players: [],
    currentQuestionIndex: 0,
    questions: [],
    scores: {},
  });

  const [view, setView] = useState<'home' | 'battlefield' | 'lobby' | 'game' | 'admin'>('home');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      // Fallback to local data if API fails
      const localData = localStorage.getItem('hsc_global_leaderboard');
      if (localData) {
        const parsed = JSON.parse(localData);
        setLeaderboard(parsed.sort((a: any, b: any) => b.score - a.score).slice(0, 10));
      }
    }
  }, []);

  useEffect(() => {
    if (view === 'home') {
      fetchLeaderboard();
    }
  }, [view, fetchLeaderboard]);

  const handleLogin = (username: string) => {
    const newUser = { username };
    localStorage.setItem('hsc_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('hsc_user');
    setUser(null);
    setView('home');
  };

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameState(prev => ({ 
      ...prev, 
      roomId, 
      status: 'lobby', 
      players: [{ id: user!.username, username: user!.username }] 
    }));
    setView('lobby');
  };

  const joinRoom = (roomId: string) => {
    const cleanId = roomId.trim().toUpperCase();
    setGameState(prev => ({ 
      ...prev, 
      roomId: cleanId, 
      status: 'lobby',
      players: [{ id: user!.username, username: user!.username }] 
    }));
    setView('lobby');
  };

  const startGame = async () => {
    try {
      const response = await fetch('/api/questions');
      const questions = await response.json();
      
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        questions: questions.length > 0 ? questions : generateMockQuestions(),
        currentQuestionIndex: 0
      }));
      setView('game');
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      const questions = generateMockQuestions();
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        questions,
        currentQuestionIndex: 0
      }));
      setView('game');
    }
  };

  const submitScore = async (score: number) => {
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username, score })
      });
    } catch (error) {
      console.error("Failed to submit score:", error);
    }

    // Update local leaderboard for immediate feedback
    const localData = localStorage.getItem('hsc_global_leaderboard');
    let leaderboardArr = localData ? JSON.parse(localData) : [];
    
    const existingIdx = leaderboardArr.findIndex((e: any) => e.username === user?.username);
    if (existingIdx > -1) {
      if (score > leaderboardArr[existingIdx].score) {
        leaderboardArr[existingIdx].score = score;
      }
    } else {
      leaderboardArr.push({ username: user?.username, score });
    }
    
    localStorage.setItem('hsc_global_leaderboard', JSON.stringify(leaderboardArr));
    fetchLeaderboard();

    // Update current game scores
    setGameState(prev => ({
      ...prev,
      scores: { ...prev.scores, [user!.username]: (prev.scores[user!.username] || 0) + score }
    }));
  };

  const generateFromPDF = async (file: File, subject: string, adminSecret: string) => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('subject', subject);
      formData.append('adminSecret', adminSecret);

      const response = await fetch('/api/questions/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert(`Successfully scanned PDF and generated ${data.length} questions!`);
      setView('home');
    } catch (error: any) {
      console.error("PDF Scan failed:", error);
      alert(`PDF Scan failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromSyllabus = async (syllabus: string, subject: string, adminSecret: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabus, subject, adminSecret })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert(`Successfully generated ${data.length} questions from syllabus!`);
      setView('home');
    } catch (error: any) {
      console.error("Generation failed:", error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sword className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-display font-bold tracking-tight">HSC QUEST</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Local Mode
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium">{user.username}</span>
            <span className="text-xs text-zinc-500">Rank: Novice</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            >
              <MenuCard 
                title="Open Battlefield"
                description="Test your knowledge against the clock in a solo survival run."
                icon={<Sword className="w-8 h-8 text-emerald-400" />}
                onClick={() => setView('battlefield')}
                color="emerald"
              />
              <MenuCard 
                title="Create Room"
                description="Start a private session (Solo Practice Mode)."
                icon={<Users className="w-8 h-8 text-indigo-400" />}
                onClick={createRoom}
                color="indigo"
              />
              <JoinCard onJoin={joinRoom} />
              
              <MenuCard 
                title="Syllabus AI"
                description="Upload or paste your syllabus to generate custom AI questions."
                icon={<Sparkles className="w-8 h-8 text-amber-400" />}
                onClick={() => setView('admin')}
                color="amber"
              />

              {/* Leaderboard Section */}
              <div className="md:col-span-3 mt-8">
                <div className="glass p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="text-amber-400 w-6 h-6" />
                      <h2 className="text-xl font-display font-bold">Global Hall of Fame</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Live Sync
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold opacity-20 w-6">#{idx + 1}</span>
                            <span className="font-medium">{entry.username}</span>
                          </div>
                          <span className="font-mono font-bold text-indigo-400">{entry.score} pts</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500 text-sm italic">No legends yet. Be the first!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SyllabusProcessor 
                onGenerate={generateFromSyllabus} 
                onUpload={generateFromPDF}
                isGenerating={isGenerating}
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'battlefield' && (
            <motion.div key="battlefield" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Battlefield onBack={() => setView('home')} onScoreSubmit={submitScore} />
            </motion.div>
          )}

          {view === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Lobby 
                gameState={gameState} 
                onStart={startGame}
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Game 
                gameState={gameState} 
                onScoreSubmit={submitScore}
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center text-zinc-600 text-sm">
        <p>© 2026 HSC Quest • Built for the ultimate syllabus mastery</p>
      </footer>
    </div>
  );
}

function generateMockQuestions() {
  return [
    { id: 1, question: "What is the unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correct: 1, subject: "Physics" },
    { id: 2, question: "Which of the following is a noble gas?", options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"], correct: 2, subject: "Chemistry" },
    { id: 3, question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correct: 2, subject: "Biology" },
    { id: 4, question: "If f(x) = x^2, what is f'(x)?", options: ["x", "2x", "x^2", "2"], correct: 1, subject: "Math" },
    { id: 5, question: "Which law states that V = IR?", options: ["Newton's Law", "Ohm's Law", "Boyle's Law", "Charles's Law"], correct: 1, subject: "Physics" }
  ];
}

function MenuCard({ title, description, icon, onClick, color }: any) {
  const colors: any = {
    emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    indigo: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
    amber: 'hover:border-amber-500/50 hover:bg-amber-500/5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass p-8 rounded-3xl text-left flex flex-col gap-4 transition-all duration-300 ${colors[color]}`}
    >
      <div className="p-3 bg-zinc-900 rounded-2xl w-fit">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
        Launch <Play className="w-4 h-4" />
      </div>
    </motion.button>
  );
}

function SyllabusProcessor({ onGenerate, onUpload, isGenerating, onBack }: { onGenerate: (s: string, sub: string, sec: string) => void, onUpload: (f: File, sub: string, sec: string) => void, isGenerating: boolean, onBack: () => void }) {
  const [syllabus, setSyllabus] = useState('');
  const [subject, setSubject] = useState('');
  const [secret, setSecret] = useState('');
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div className="glass p-8 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold">Syllabus Engine v2.0</h2>
              <p className="text-zinc-400 text-sm">Scan PDFs or paste text to build your bank.</p>
            </div>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setMode('text')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Text
            </button>
            <button 
              onClick={() => setMode('pdf')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'pdf' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Subject Area</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Admin Secret</label>
            <input 
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {mode === 'text' ? (
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Syllabus Content (Format: Term: Definition)</label>
            <textarea 
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="Mitosis: Cell division resulting in two identical daughter cells.&#10;Meiosis: Cell division resulting in four daughter cells with half chromosomes.&#10;DNA: The molecule that carries genetic instructions."
              className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            />
            <p className="text-[10px] text-zinc-500 italic">Enter at least 4 pairs, one per line.</p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Upload Syllabus PDF</label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${file ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10 bg-black/40 group-hover:border-white/20'}`}>
                <div className={`p-4 rounded-full ${file ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-500'}`}>
                  {file ? <FileUp className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  <p className={`text-sm font-bold ${file ? 'text-white' : 'text-zinc-400'}`}>
                    {file ? file.name : 'Click or drag PDF here'}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Max size: 5MB</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 italic mt-3">The engine will scan for definitions and learning objectives automatically.</p>
          </div>
        )}

        <div className="flex gap-4">
          <button onClick={onBack} className="neo-btn-secondary flex-1 py-4">
            Cancel
          </button>
          <button 
            onClick={() => mode === 'text' ? onGenerate(syllabus, subject, secret) : (file && onUpload(file, subject, secret))}
            disabled={(mode === 'text' ? !syllabus : !file) || !secret || isGenerating}
            className="neo-btn-primary flex-1 py-4 flex items-center justify-center gap-2 bg-amber-500 text-black border-amber-600 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {mode === 'text' ? 'Build Question Bank' : 'Scan & Build Bank'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinCard({ onJoin }: { onJoin: (id: string) => void }) {
  const [id, setId] = useState('');

  return (
    <div className="glass p-8 rounded-3xl flex flex-col gap-4 border-dashed">
      <div className="p-3 bg-zinc-900 rounded-2xl w-fit">
        <LinkIcon className="w-8 h-8 text-amber-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Join Room</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">Paste an invite code to enter a friend's battlefield.</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="CODE123"
            value={id}
            onChange={(e) => setId(e.target.value.toUpperCase())}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          <button 
            onClick={() => id && onJoin(id)}
            className="p-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
