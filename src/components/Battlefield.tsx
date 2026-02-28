import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, Sword, ArrowLeft, BrainCircuit, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { Question } from '../types';

const MOCK_QUESTIONS: Question[] = [
  { id: 1, question: "What is the primary function of DNA?", options: ["Energy storage", "Genetic information", "Protein synthesis", "Cell structure"], correct: 1, subject: "Biology" },
  { id: 2, question: "What is the value of acceleration due to gravity on Earth?", options: ["8.9 m/s²", "9.8 m/s²", "10.2 m/s²", "7.5 m/s²"], correct: 1, subject: "Physics" },
  { id: 3, question: "Which element has the atomic number 1?", options: ["Helium", "Oxygen", "Hydrogen", "Carbon"], correct: 2, subject: "Chemistry" },
  { id: 4, question: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"], correct: 0, subject: "Math" },
  { id: 5, question: "Who proposed the theory of relativity?", options: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Marie Curie"], correct: 2, subject: "Physics" },
];

export default function Battlefield({ onBack, onScoreSubmit }: { onBack: () => void, onScoreSubmit: (score: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
    const x = info.point.x;
    const y = info.point.y;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const threshold = 180;

    let choice = -1;
    if (x < threshold && y < threshold + 100) choice = 0;
    else if (x > width - threshold && y < threshold + 100) choice = 1;
    else if (x < threshold && y > height - threshold) choice = 2;
    else if (x > width - threshold && y > height - threshold) choice = 3;

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
    <div className="relative h-[75vh] w-full overflow-hidden touch-none select-none">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-6 z-50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
            <Timer className={`w-5 h-5 ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-mono font-bold text-lg">{timeLeft}s</span>
          </div>
          {streak > 1 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter text-center"
            >
              {streak}x Streak!
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <span className="font-mono font-bold text-lg">{score}</span>
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
          <span className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-4 border border-emerald-500/20">
            Battlefield • Q{currentIndex + 1}
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
                className={`w-full h-full rounded-full border-2 border-dashed flex items-center justify-center p-6 text-center text-sm font-bold transition-all duration-300
                  ${isSelected ? (isCorrect ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-500'}
                `}
              >
                {opt}
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
          className="w-20 h-20 bg-emerald-600 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.8)] flex items-center justify-center cursor-grab pointer-events-auto z-50"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            <div className="w-6 h-6 bg-white rounded-full shadow-inner" />
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
