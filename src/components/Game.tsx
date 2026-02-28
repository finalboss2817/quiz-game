import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Timer, Trophy, ArrowRight, CheckCircle2, XCircle, BrainCircuit, HelpCircle, Play } from 'lucide-react';
import { GameState } from '../types';

export default function Game({ gameState, onScoreSubmit, onBack }: { gameState: GameState, onScoreSubmit: (score: number) => void, onBack: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [localScore, setLocalScore] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [shake, setShake] = useState(false);

  // Core position tracking for proximity glow
  const coreX = useMotionValue(0);
  const coreY = useMotionValue(0);

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
    if (!arenaRef.current) return;

    const rect = arenaRef.current.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;
    
    const width = rect.width;
    const height = rect.height;
    const midX = width / 2;
    const midY = height / 2;

    let choice = -1;
    if (x < midX && y < midY) choice = 0; // Top Left Shard
    else if (x >= midX && y < midY) choice = 1; // Top Right Shard
    else if (x < midX && y >= midY) choice = 2; // Bottom Left Shard
    else if (x >= midX && y >= midY) choice = 3; // Bottom Right Shard

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
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
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
    <div ref={containerRef} className={`relative h-[80vh] w-full overflow-hidden touch-none select-none transition-all duration-300 flex flex-col ${shake ? 'bg-red-900/10' : ''}`}>
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center"
          >
            <div className="max-w-sm">
              <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.6)]">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </div>
              <h2 className="text-2xl font-display font-black mb-4 uppercase tracking-tighter">Mission Briefing</h2>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                Drag the <span className="text-indigo-400 font-bold text-lg">Knowledge Core</span> into the correct <span className="text-indigo-400 font-bold text-lg">Data Shard</span> to stabilize the sector.
              </p>
              <button 
                onClick={() => setShowTutorial(false)}
                className="neo-btn-primary w-full py-4 flex items-center justify-center gap-2 group"
              >
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Initialize
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Header */}
      <div className="flex justify-between items-center p-4 z-50">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10">
          <Timer className={`w-4 h-4 ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`} />
          <span className="font-mono font-bold">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <span className="font-mono font-bold">{localScore}</span>
        </div>
      </div>

      {/* Question Console */}
      <div className="px-6 py-2 text-center z-40">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-3 border border-indigo-500/20">
            {currentQuestion.subject} • NODE {currentIndex + 1}
          </span>
          <h2 className="text-xl md:text-3xl font-black leading-tight tracking-tighter uppercase italic text-white">
            {currentQuestion.question}
          </h2>
        </motion.div>
      </div>

      {/* Arena Grid */}
      <div ref={arenaRef} className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-6 relative">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correct;
          
          return (
            <div key={idx} className="relative flex items-center justify-center">
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [idx % 2 === 0 ? -1 : 1, idx % 2 === 0 ? 1 : -1, idx % 2 === 0 ? -1 : 1]
                }}
                transition={{ duration: 3 + idx, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full max-w-[240px] max-h-[140px]"
              >
                <motion.div 
                  animate={{ 
                    scale: isSelected ? 1.05 : (isDragging ? 1.02 : 1),
                    borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.1)',
                    backgroundColor: isSelected ? (isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.02)',
                  }}
                  className={`w-full h-full glass rounded-br-3xl rounded-tl-3xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all duration-300 relative overflow-hidden
                    ${isSelected ? (isCorrect ? 'text-emerald-300' : 'text-red-300') : 'text-zinc-400'}
                  `}
                >
                  <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest absolute top-2 left-4">Shard {String.fromCharCode(65 + idx)}</span>
                  <span className="text-xs md:text-sm font-bold uppercase tracking-tight leading-tight">{opt}</span>
                </motion.div>
              </motion.div>
            </div>
          );
        })}

        {/* Player Core (The Draggable Orb) - Centered in the grid */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={onDragEnd}
            style={{ x: coreX, y: coreY }}
            whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
            className="w-16 h-16 bg-indigo-600 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.8)] flex items-center justify-center cursor-grab pointer-events-auto z-50"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              <div className="w-5 h-5 bg-white rounded-full shadow-inner" />
              <div className="absolute -inset-2 border border-white/10 rounded-full animate-[spin_4s_linear_infinite]" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Instructions */}
      <div className="pb-8 text-center pointer-events-none">
        <motion.div
          animate={{ opacity: isDragging ? 0 : 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <HelpCircle className="w-3 h-3 text-white/40" />
          <p className="text-[8px] uppercase tracking-[0.5em] font-black text-white">
            DRAG CORE TO SHARD
          </p>
        </motion.div>
      </div>
    </div>
  );
}
