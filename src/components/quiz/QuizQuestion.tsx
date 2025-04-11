'use client';

import { useState } from 'react';
import { QuizQuestion as QuizQuestionType } from '@/types/quiz';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (selectedIndex: number) => void;
}

export function QuizQuestion({ question, onAnswer }: QuizQuestionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleAnswerClick = (index: number) => {
    setSelectedIndex(index);
    onAnswer(index);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">{question.question}</h2>
      <div className="space-y-4">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(index)}
            className={`w-full p-4 text-left rounded-lg transition-colors ${
              selectedIndex === index
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
            disabled={selectedIndex !== null}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
} 