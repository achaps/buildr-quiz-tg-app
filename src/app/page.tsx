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

// Type pour les données de log
type LogData = Record<string, unknown>;

// Fonction pour envoyer les logs à un endpoint
async function sendLog(level: string, message: string, data?: LogData) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to send log:', error);
  }
}

export default function Home() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAnswerToday, setCanAnswerToday] = useState(true);
  const { webApp, user } = useTelegram();

  useEffect(() => {
    async function initializeSupabase() {
      if (!user) return;

      try {
        // Convertir l'ID Telegram en UUID valide
        const telegramId = user.id.toString();
        const uuid = `00000000-0000-0000-0000-${telegramId.padStart(12, '0')}`;

        // Sign in anonymously with the user's Telegram ID
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: `${uuid}@telegram.user`,
          password: uuid,
        });

        if (authError) {
          // If user doesn't exist, create a new one
          if (authError.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
              email: `${uuid}@telegram.user`,
              password: uuid,
            });

            if (signUpError) throw signUpError;
          } else {
            throw authError;
          }
        }

        await sendLog('info', 'Supabase authentication successful', { userId: uuid });
      } catch (err) {
        await sendLog('error', 'Supabase authentication failed', { error: err });
      }
    }

    initializeSupabase();
  }, [user]);

  useEffect(() => {
    async function fetchUserProgress() {
      try {
        await sendLog('info', 'Starting fetchUserProgress', { supabaseUrl, user });

        if (!user) {
          await sendLog('info', 'No user found, skipping fetch');
          setLoading(false);
          return;
        }

        const { data: progressData, error: progressError } = await supabase
          .from('quiz_user_progress')
          .select('*')
          .eq('telegram_id', user.id)
          .single();
        
        await sendLog('info', 'Progress data fetched', { progressData, progressError });
        
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
        
        await sendLog('info', 'Quiz status', { hasAnsweredToday });
        setCanAnswerToday(!hasAnsweredToday);
        
        if (hasAnsweredToday) {
          setLoading(false);
          return;
        }
        
        let nextQuestionId = progressData?.next_question_id;
        await sendLog('info', 'Next question ID', { nextQuestionId });
        
        if (!nextQuestionId) {
          await sendLog('info', 'No next question ID, fetching first question');
          const { data: firstQuestion, error: firstQuestionError } = await supabase
            .from('quiz_questions')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
          
          await sendLog('info', 'First question fetched', { firstQuestion, firstQuestionError });
          
          if (firstQuestionError) throw firstQuestionError;
          
          nextQuestionId = firstQuestion.id;
          
          const { error: createError } = await supabase
            .from('quiz_user_progress')
            .insert({
              telegram_id: user.id,
              next_question_id: nextQuestionId
            });
          
          await sendLog('info', 'Progress created', { createError });
          if (createError) throw createError;
        }
        
        await sendLog('info', 'Fetching question', { nextQuestionId });
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('id', nextQuestionId)
          .single();
        
        await sendLog('info', 'Question fetched', { questionData, questionError });
        
        if (questionError) throw questionError;
        
        setQuestion(questionData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
        await sendLog('error', 'Error in fetchUserProgress', { error: errorMessage, err });
        setError(errorMessage);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-900">Loading your daily question...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-900">Preparing your question...</p>
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
