export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correct_answer_index: number;
  points: number;
  created_at: string;
}

export interface QuizResponse {
  question_id: string;
  telegram_id: string;
  selected_answer_index: number;
  is_correct: boolean;
  points_earned: number;
  created_at: string;
}

export interface QuizStreak {
  current_streak: number;
  last_checkin: string;
  streak_bonus: number;
}

export interface QuizState {
  currentQuestion: QuizQuestion | null;
  selectedAnswer: number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  score: number;
} 