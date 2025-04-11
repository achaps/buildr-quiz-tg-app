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
  const { webApp } = useTelegram();

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    const isCorrect = index === question.correct_answer_index;
    onAnswer(isCorrect);

    // Provide haptic feedback
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred(isCorrect ? 'medium' : 'heavy');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
        
        <div className="space-y-3">
          {question.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={isAnswered}
              className={`w-full p-4 text-left rounded-lg border transition-colors ${
                isAnswered
                  ? index === question.correct_answer_index
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : selectedAnswer === index
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-gray-50 border-gray-200'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>

      {isAnswered && (
        <div className="text-center">
          <p className="text-lg font-medium">
            {selectedAnswer === question.correct_answer_index
              ? 'Correct! 🎉'
              : 'Incorrect! 😕'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {selectedAnswer === question.correct_answer_index
              ? `You earned ${question.points} points!`
              : `The correct answer was: ${question.answers[question.correct_answer_index]}`}
          </p>
        </div>
      )}
    </div>
  );
} 