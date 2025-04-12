'use client';

import { useState } from 'react';
import { useTelegram } from '@/components/layout/TelegramProvider';
import { QuizQuestion } from '@/types/quiz';

interface DailyQuestionProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

export function DailyQuestion({ question, onAnswer }: DailyQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { webApp } = useTelegram();

  const handleAnswer = async (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const correct = index === question.correct_answer_index;
    setIsCorrect(correct);
    onAnswer(correct);

    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const handleContinue = () => {
    window.location.reload();
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h2>
      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={isAnswered}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              isAnswered
                ? index === question.correct_answer_index
                  ? 'bg-green-100 text-green-900 border-2 border-green-500'
                  : selectedAnswer === index
                  ? 'bg-red-100 text-red-900 border-2 border-red-500'
                  : 'bg-gray-50 text-gray-500'
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'
            }`}
          >
            {answer}
          </button>
        ))}
      </div>

      {isAnswered && (
        <div className="mt-8 space-y-4">
          <button
            onClick={handleContinue}
            className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all ${
              isCorrect
                ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
            }`}
          >
            {isCorrect ? '🪙 Collect 10 pBUILDR' : '❌ Wrong, try again tomorrow!'}
          </button>
        </div>
      )}
    </div>
  );
} 