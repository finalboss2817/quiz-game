export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  subject: string;
}

export interface Player {
  id: string;
  username: string;
  score?: number;
}

export interface GameState {
  status: 'idle' | 'lobby' | 'playing' | 'finished';
  roomId: string | null;
  players: Player[];
  currentQuestionIndex: number;
  questions: Question[];
  scores: Record<string, number>;
}
