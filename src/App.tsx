import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Users, Link as LinkIcon, Trophy, LogOut, Play, Send, Copy, Check } from 'lucide-react';
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
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    roomId: null,
    players: [],
    currentQuestionIndex: 0,
    questions: [],
    scores: {},
  });

  const [view, setView] = useState<'home' | 'battlefield' | 'lobby' | 'game'>('home');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (view === 'home') {
      fetchLeaderboard();
    }
  }, [view]);

  useEffect(() => {
    if (user) {
      console.log("Connecting to socket...");
      const newSocket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log("Socket connected:", newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error("Socket connection error:", err);
      });

      newSocket.on('room-update', (data) => {
        console.log("Room update received:", data);
        setGameState(prev => ({ 
          ...prev, 
          players: data.players,
          status: data.status || prev.status 
        }));
      });

      newSocket.on('game-started', (data) => {
        setGameState(prev => ({ 
          ...prev, 
          status: 'playing', 
          questions: data.questions,
          currentQuestionIndex: 0
        }));
        setView('game');
      });

      newSocket.on('score-update', (scores) => {
        setGameState(prev => ({ ...prev, scores }));
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

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
    socket?.emit('join-room', { roomId, username: user?.username });
    setGameState(prev => ({ ...prev, roomId, status: 'lobby' }));
    setView('lobby');
  };

  const joinRoom = (roomId: string) => {
    socket?.emit('join-room', { roomId, username: user?.username });
    setGameState(prev => ({ ...prev, roomId, status: 'lobby' }));
    setView('lobby');
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
          <h1 className="text-xl font-display font-bold tracking-tight">HSC QUEST</h1>
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
                description="Start a private session and challenge your friends."
                icon={<Users className="w-8 h-8 text-indigo-400" />}
                onClick={createRoom}
                color="indigo"
              />
              <JoinCard onJoin={joinRoom} />

              {/* Leaderboard Section */}
              <div className="md:col-span-3 mt-8">
                <div className="glass p-8 rounded-[2.5rem]">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="text-amber-400 w-6 h-6" />
                    <h2 className="text-xl font-display font-bold">Global Hall of Fame</h2>
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
                      <p className="text-zinc-500 text-sm italic">No legends recorded yet. Be the first!</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'battlefield' && (
            <motion.div key="battlefield" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Battlefield onBack={() => setView('home')} socket={socket} />
            </motion.div>
          )}

          {view === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Lobby 
                gameState={gameState} 
                socket={socket!} 
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'game' && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Game 
                gameState={gameState} 
                socket={socket!} 
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

function MenuCard({ title, description, icon, onClick, color }: any) {
  const colors: any = {
    emerald: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    indigo: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
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
