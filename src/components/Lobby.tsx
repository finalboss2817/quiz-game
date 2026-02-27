import { motion } from 'motion/react';
import { Users, Play, ArrowLeft, Copy, Check, ShieldCheck } from 'lucide-react';
import { GameState } from '../types';
import { useState } from 'react';
import { Socket } from 'socket.io-client';

export default function Lobby({ gameState, socket, onBack }: { gameState: GameState, socket: Socket, onBack: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(gameState.roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = () => {
    socket.emit('start-game', gameState.roomId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto mt-12"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to HQ
      </button>

      <div className="glass p-10 rounded-[2.5rem] relative overflow-hidden">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">War Room</h2>
            <p className="text-zinc-400">Waiting for challengers to join the fray...</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Invite Code</span>
            <button 
              onClick={copyId}
              className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:border-indigo-500/50 transition-all group"
            >
              <span className="font-mono text-xl font-bold text-indigo-400">{gameState.roomId}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-500 group-hover:text-white" />}
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
            <Users className="w-4 h-4" />
            Players ({gameState.players.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gameState.players.map((player, idx) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold">
                  {player.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {player.username}
                    {idx === 0 && <ShieldCheck className="w-3 h-3 text-amber-400" title="Room Owner" />}
                  </div>
                  <div className="text-xs text-zinc-500">Ready to fight</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <button 
          onClick={startGame}
          disabled={gameState.players.length < 1}
          className="w-full neo-btn-primary py-5 text-lg flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-current" />
          Commence Battle
        </button>
        
        <p className="text-center text-xs text-zinc-500 mt-6 italic">
          Tip: Minimum 1 player required to start (for testing). Best played with friends!
        </p>
      </div>
    </motion.div>
  );
}
