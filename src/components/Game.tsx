import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, ArrowRight, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import { GameState } from '../types';
import { Socket } from 'socket.io-client';

export default function Game({ gameState, socket, onBack }: { gameState: GameState, socket: Socket, onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [localScore, setLocalScore] = useState(0);

  const currentQuestion = gameState.questions[currentIndex];

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
      const points = timeLeft * 10;
      setLocalScore(prev => prev + points);
      socket.emit('submit-answer', { 
        roomId: gameState.roomId, 
        score: points,
        username: gameState.players.find(p => p.id === socket.id)?.username 
      });
    }

    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    if (currentIndex < gameState.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setTimeLeft(15);
    } else {
      setIsFinished(true);
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
    <div className="max-w-3xl mx-auto mt-8">
      {/* Progress & Timer */}
      <div className="flex justify-between items-center mb-8 px-4">
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            Question {currentIndex + 1} / {gameState.questions.length}
          </div>
          <div className="h-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / gameState.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${timeLeft < 5 ? 'border-red-500/50 text-red-400 bg-red-500/5' : 'border-zinc-800 text-zinc-400'}`}>
          <Timer className="w-4 h-4" />
          <span className="font-mono font-bold">{timeLeft}s</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass p-10 rounded-[2.5rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <BrainCircuit className="w-24 h-24" />
          </div>

          <div className="mb-2">
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/20">
              {currentQuestion.subject}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold mb-10 leading-snug">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correct;
              const showResult = selectedOption !== null;

              let stateClasses = "border-zinc-800 hover:border-zinc-600 hover:bg-white/5";
              if (showResult) {
                if (isCorrect) stateClasses = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                else if (isSelected) stateClasses = "border-red-500/50 bg-red-500/10 text-red-400";
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

      <div className="mt-8 flex justify-center gap-4">
        {Object.entries(gameState.scores).map(([id, score]) => {
          const player = gameState.players.find(p => p.id === id);
          return (
            <div key={id} className="glass px-4 py-2 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-bold">{player?.username}: {score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
