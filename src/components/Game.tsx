import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, ArrowRight, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import { GameState } from '../types';

export default function Game({ gameState, onScoreSubmit, onBack }: { gameState: GameState, onScoreSubmit: (score: number) => void, onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const currentQuestion = gameState.questions[currentIndex];

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleNext();
    }
  }, [timeLeft, isFinished]);

  const handleNext = () => {
    if (currentIndex < gameState.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
    }
  };

  const onDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const x = info.point.x;
    const y = info.point.y;
    
    // Collision detection for 4 corners
    const width = window.innerWidth;
    const height = window.innerHeight;
    const threshold = 180;

    let choice = -1;
    if (x < threshold && y < threshold + 100) choice = 0; // Top Left
    else if (x > width - threshold && y < threshold + 100) choice = 1; // Top Right
    else if (x < threshold && y > height - threshold) choice = 2; // Bottom Left
    else if (x > width - threshold && y > height - threshold) choice = 3; // Bottom Right

    if (choice !== -1 && selectedOption === null) {
      submitAnswer(choice);
    }
  };

  const submitAnswer = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.correct;
    
    if (isCorrect) {
      const points = timeLeft * 10;
      setLocalScore(prev => prev + points);
      onScoreSubmit(points);
    }

    setTimeout(() => {
      handleNext();
    }, 1200);
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 text-center"
      >
        <div className="glass p-12 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h2 className="text-4xl font-display font-bold mb-2">Battle Concluded</h2>
          <p className="text-zinc-400 mb-10">You've successfully navigated the HSC syllabus.</p>
          
          <div className="grid grid-cols-1 gap-4 mb-10">
            {Object.entries(gameState.scores)
              .sort(([, a], [, b]) => b - a)
              .map(([id, score], idx) => {
                const player = gameState.players.find(p => p.id === id);
                return (
                  <div key={id} className={`flex items-center justify-between p-4 rounded-2xl ${idx === 0 ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold opacity-30">#{idx + 1}</span>
                      <span className="font-bold">{player?.username || 'Unknown'}</span>
                    </div>
                    <span className="text-xl font-mono font-bold text-indigo-400">{score} pts</span>
                  </div>
                );
              })}
          </div>

          <button onClick={onBack} className="neo-btn-primary w-full py-4">
            Return to Headquarters
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative h-[75vh] w-full overflow-hidden touch-none select-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 z-50">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
          <Timer className={`w-5 h-5 ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
          <span className="font-mono font-bold text-lg">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
          <BrainCircuit className="w-5 h-5 text-emerald-400" />
          <span className="font-mono font-bold text-lg">{localScore}</span>
        </div>
      </div>

      {/* Question Center */}
      <div className="absolute inset-0 flex items-center justify-center p-12 text-center pointer-events-none">
        <motion.div 
          key={currentIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl"
        >
          <span className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-4 border border-indigo-500/20">
            {currentQuestion.subject} • Q{currentIndex + 1}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
            {currentQuestion.question}
          </h2>
        </motion.div>
      </div>

      {/* Portals (Corners) */}
      <div className="absolute inset-0 pointer-events-none">
        {currentQuestion.options.map((opt, idx) => {
          const positions = [
            "top-6 left-6", "top-6 right-6",
            "bottom-6 left-6", "bottom-6 right-6"
          ];
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correct;
          
          return (
            <div key={idx} className={`absolute ${positions[idx]} w-40 h-40 md:w-48 md:h-48`}>
              <motion.div 
                animate={{ 
                  scale: isSelected ? 1.15 : (isDragging ? 1.05 : 1),
                  borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? (isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.03)'
                }}
                className={`w-full h-full rounded-[2.5rem] border-2 border-dashed flex items-center justify-center p-6 text-center text-sm font-bold transition-all duration-300
                  ${isSelected ? (isCorrect ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-500'}
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] opacity-40 uppercase tracking-widest">Portal {idx + 1}</span>
                  {opt}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Player Core (The Draggable Orb) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={onDragEnd}
          whileDrag={{ scale: 1.3, cursor: 'grabbing' }}
          className="w-20 h-20 bg-indigo-600 rounded-full shadow-[0_0_50px_rgba(79,70,229,0.8)] flex items-center justify-center cursor-grab pointer-events-auto z-50 group"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            <div className="w-6 h-6 bg-white rounded-full shadow-inner" />
            <div className="absolute -inset-4 border border-white/10 rounded-full animate-[spin_4s_linear_infinite]" />
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-0 right-0 text-center pointer-events-none">
        <motion.p 
          animate={{ opacity: isDragging ? 0 : 0.4 }}
          className="text-[10px] uppercase tracking-[0.5em] font-black text-white"
        >
          Drag core to correct portal
        </motion.p>
      </div>
    </div>
  );
}
