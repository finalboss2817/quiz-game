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

  const currentQuestion = MOCK_QUESTIONS[currentIndex];

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleNext();
    }
  }, [timeLeft, isFinished]);

  const handleAnswer = (optionIdx: number) => {
    if (selectedOption !== null) return;
    
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
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-8 px-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score</span>
            <span className="font-mono font-bold text-emerald-400">{score}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft < 4 ? 'border-red-500/50 text-red-400 animate-pulse' : 'border-zinc-800 text-zinc-400'}`}>
            <Timer className="w-4 h-4" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass p-10 rounded-[2.5rem] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 10, ease: "linear" }}
            />
          </div>

          <div className="mb-4 flex justify-between items-center">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              {currentQuestion.subject}
            </span>
            {streak > 1 && (
              <span className="text-xs font-bold text-amber-400 animate-bounce">
                🔥 {streak} STREAK
              </span>
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-10 leading-snug">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correct;
              const showResult = selectedOption !== null;

              let stateClasses = "border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5";
              if (showResult) {
                if (isCorrect) stateClasses = "border-emerald-500 bg-emerald-500/20 text-emerald-400";
                else if (isSelected) stateClasses = "border-red-500 bg-red-500/20 text-red-400";
                else stateClasses = "opacity-50 border-zinc-800";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${stateClasses}`}
                >
                  <span className="font-medium">{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
