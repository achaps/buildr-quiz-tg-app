'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DailyQuestion } from '@/components/quiz/DailyQuestion';
import { QuizQuestion } from '@/types/quiz';
import { useTelegram } from '@/components/layout/TelegramProvider';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_POINTS = 10;
const MAX_STREAK = 5;

export default function Home() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAnswerToday, setCanAnswerToday] = useState(true);
  const { webApp, user } = useTelegram();

  useEffect(() => {
    async function fetchUserProgress() {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: progressData, error: progressError } = await supabase
          .from('quiz_user_progress')
          .select('*')
          .eq('telegram_id', user.id)
          .single();
        
        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastQuizDate = progressData?.last_quiz_date ? new Date(progressData.last_quiz_date) : null;
        const hasAnsweredToday = lastQuizDate && 
          lastQuizDate.getFullYear() === today.getFullYear() && 
          lastQuizDate.getMonth() === today.getMonth() && 
          lastQuizDate.getDate() === today.getDate();
        
        setCanAnswerToday(!hasAnsweredToday);
        
        if (hasAnsweredToday) {
          setLoading(false);
          return;
        }
        
        let nextQuestionId = progressData?.next_question_id;
        
        if (!nextQuestionId) {
          const { data: firstQuestion, error: firstQuestionError } = await supabase
            .from('quiz_questions')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
          
          if (firstQuestionError) throw firstQuestionError;
          
          nextQuestionId = firstQuestion.id;
          
          const { error: createError } = await supabase
            .from('quiz_user_progress')
            .insert({
              telegram_id: user.id,
              next_question_id: nextQuestionId
            });
          
          if (createError) throw createError;
        }
        
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('id', nextQuestionId)
          .single();
        
        if (questionError) throw questionError;
        
        setQuestion(questionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProgress();
  }, [user]);

  const handleAnswer = async (isCorrect: boolean) => {
    if (!user || !question) return;
    
    try {
      const { data: progressData } = await supabase
        .from('quiz_user_progress')
        .select('*')
        .eq('telegram_id', user.id)
        .single();
      
      if (!progressData) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastStreakDate = progressData?.last_streak_date ? new Date(progressData.last_streak_date) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let newStreak = 0;
      let pointsToAdd = 0;

      if (isCorrect) {
        if (lastStreakDate && 
            lastStreakDate.getFullYear() === yesterday.getFullYear() &&
            lastStreakDate.getMonth() === yesterday.getMonth() &&
            lastStreakDate.getDate() === yesterday.getDate()) {
          newStreak = Math.min((progressData?.streak || 0) + 1, MAX_STREAK);
        } else {
          newStreak = 1;
        }
        pointsToAdd = BASE_POINTS * newStreak;
      }

      const { data: nextQuestion } = await supabase
        .from('quiz_questions')
        .select('id')
        .gt('created_at', question.created_at)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      const { error: updateError } = await supabase
        .from('quiz_user_progress')
        .update({
          last_quiz_date: new Date().toISOString(),
          next_question_id: nextQuestion?.id || null,
          streak: isCorrect ? newStreak : 0,
          last_streak_date: isCorrect ? new Date().toISOString() : null,
          quiz_points: (progressData?.quiz_points || 0) + pointsToAdd
        })
        .eq('telegram_id', user.id);
      
      if (updateError) throw updateError;
      
      if (isCorrect) {
        const { data: userData } = await supabase
          .from('tg-users')
          .select('total_points')
          .eq('telegram_id', user.id)
          .single();

        const newPoints = (userData?.total_points || 0) + pointsToAdd;
        
        const { error: updatePointsError } = await supabase
          .from('tg-users')
          .update({
            total_points: newPoints
          })
          .eq('telegram_id', user.id);
        
        if (updatePointsError) throw updatePointsError;
      }
      
      if (webApp?.MainButton) {
        webApp.MainButton.hide();
      }
      
      setCanAnswerToday(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle answer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please open this app in Telegram.</p>
        </div>
      </div>
    );
  }

  if (!canAnswerToday) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">You&apos;ve already answered today&apos;s question!</p>
          <p className="text-sm text-gray-500 mt-2">Come back tomorrow for the next question.</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No questions available.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <DailyQuestion question={question} onAnswer={handleAnswer} />
    </main>
  );
}
