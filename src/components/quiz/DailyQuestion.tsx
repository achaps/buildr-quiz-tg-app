'use client';

import { useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { QuizQuestion } from '@/types/quiz';
import { createClient } from '@supabase/supabase-js';

interface DailyQuestionProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

export function DailyQuestion({ question, onAnswer }: DailyQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { webApp } = useTelegram();

  const handleAnswer = async (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const isCorrect = index === question.correct_answer_index;
    onAnswer(isCorrect);

    // Show feedback
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      webApp.showPopup({
        title: isCorrect ? 'Correct!' : 'Incorrect',
        message: isCorrect 
          ? `You earned ${question.points} points!` 
          : `The correct answer was: ${question.answers[question.correct_answer_index]}`,
        buttons: [{ type: 'ok' }]
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">{question.question}</h2>
      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={isAnswered}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              isAnswered
                ? index === question.correct_answer_index
                  ? 'bg-green-100 text-green-900'
                  : selectedAnswer === index
                  ? 'bg-red-100 text-red-900'
                  : 'bg-gray-100 text-gray-900'
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
} 