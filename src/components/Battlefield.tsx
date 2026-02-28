import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'motion/react';
import { Timer, Trophy, Sword, ArrowLeft, BrainCircuit, CheckCircle2, XCircle, RefreshCcw, Play, HelpCircle } from 'lucide-react';
import { Question } from '../types';

const MOCK_QUESTIONS: Question[] = [
  { id: 1, question: "What is the primary function of DNA?", options: ["Energy storage", "Genetic information", "Protein synthesis", "Cell structure"], correct: 1, subject: "Biology" },
  { id: 2, question: "What is the value of acceleration due to gravity on Earth?", options: ["8.9 m/s²", "9.8 m/s²", "10.2 m/s²", "7.5 m/s²"], correct: 1, subject: "Physics" },
  { id: 3, question: "Which element has the atomic number 1?", options: ["Helium", "Oxygen", "Hydrogen", "Carbon"], correct: 2, subject: "Chemistry" },
  { id: 4, question: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"], correct: 0, subject: "Math" },
  { id: 5, question: "Who proposed the theory of relativity?", options: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Marie Curie"], correct: 2, subject: "Physics" },
];

export default function Battlefield({ onBack, onScoreSubmit }: { onBack: () => void, onScoreSubmit: (score: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [shake, setShake] = useState(false);

  const coreX = useMotionValue(0);
  const coreY = useMotionValue(0);

  const currentQuestion = MOCK_QUESTIONS[currentIndex];

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleNext();
    }
  }, [timeLeft, isFinished]);

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
      handleAnswer(choice);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.correct;
    
    if (isCorrect) {
      const points = (timeLeft * 10) + (streak * 5);
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  const handleNext = () => {
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setTimeLeft(10);
    } else {
      setIsFinished(true);
      
      // Emit score to server for leaderboard
      onScoreSubmit(score);

      // Save to local storage for persistence
      const history = JSON.parse(localStorage.getItem('hsc_history') || '[]');
      history.push({ score, date: new Date().toISOString() });
      localStorage.setItem('hsc_history', JSON.stringify(history.slice(-10)));
    }
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 text-center"
      >
        <div className="glass p-12 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h2 className="text-4xl font-display font-bold mb-2">Battle Report</h2>
          <p className="text-zinc-400 mb-10">You survived the open battlefield.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="glass p-6 rounded-2xl">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Final Score</div>
              <div className="text-3xl font-mono font-bold text-emerald-400">{score}</div>
            </div>
            <div className="glass p-6 rounded-2xl">
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Max Streak</div>
              <div className="text-3xl font-mono font-bold text-indigo-400">{streak}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => window.location.reload()} className="neo-btn-secondary flex-1 py-4 flex items-center justify-center gap-2">
              <RefreshCcw className="w-5 h-5" /> Try Again
            </button>
            <button onClick={onBack} className="neo-btn-primary flex-1 py-4">
              Return Home
            </button>
          </div>
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
              <div className="w-20 h-20 bg-emerald-600 rounded-full mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)]">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-6 h-6 bg-white rounded-full"
                />
              </div>
              <h2 className="text-2xl font-display font-black mb-4 uppercase tracking-tighter">Combat Briefing</h2>
              <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                Welcome to the <span className="text-emerald-400 font-bold">Battlefield</span>. 
                Drag the <span className="text-emerald-400 font-bold text-lg">Core</span> to the correct data shard. 
                Speed builds <span className="text-orange-500 font-bold">Streaks</span>.
              </p>
              <button 
                onClick={() => setShowTutorial(false)}
                className="neo-btn-primary w-full py-4 flex items-center justify-center gap-2 group border-emerald-500/50"
              >
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Enter Combat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Header */}
      <div className="flex justify-between items-center p-4 z-50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10">
            <Timer className={`w-4 h-4 ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          {streak > 1 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter text-center"
            >
              {streak}x Streak!
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-bold">{score}</span>
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
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-3 border border-emerald-500/20">
            Battlefield • SECTOR {currentIndex + 1}
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
                  y: [0, 10, 0],
                  x: [0, idx % 2 === 0 ? 5 : -5, 0]
                }}
                transition={{ duration: 4 + idx, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full max-w-[240px] max-h-[140px]"
              >
                <motion.div 
                  animate={{ 
                    scale: isSelected ? 1.05 : (isDragging ? 1.02 : 1),
                    borderColor: isSelected ? (isCorrect ? '#10b981' : '#ef4444') : 'rgba(255,255,255,0.05)',
                    backgroundColor: isSelected ? (isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.02)',
                  }}
                  className={`w-full h-full glass rounded-tr-[3rem] rounded-bl-[3rem] border-2 border-dashed flex items-center justify-center p-4 text-center transition-all duration-300 relative overflow-hidden
                    ${isSelected ? (isCorrect ? 'text-emerald-300' : 'text-red-300') : 'text-zinc-400'}
                  `}
                >
                  <div className="absolute top-2 left-4 w-6 h-6 rounded-full border border-current opacity-20 flex items-center justify-center text-[8px] font-mono">
                    0{idx + 1}
                  </div>
                  <span className="text-xs md:text-sm font-black leading-tight uppercase italic tracking-tighter">{opt}</span>
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
            className="w-16 h-16 bg-emerald-600 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.8)] flex items-center justify-center cursor-grab pointer-events-auto z-50"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              <div className="w-5 h-5 bg-white rounded-full shadow-inner" />
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
