'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DailyQuestion } from '@/components/quiz/DailyQuestion';
import { QuizQuestion } from '@/types/quiz';
import { useTelegram } from '@/components/layout/TelegramProvider';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_POINTS = 10;
const MAX_STREAK = 5;

interface ProgressData {
  streak: number;
  last_quiz_date: string | null;
  next_question_id: string | null;
  last_streak_date: string | null;
  quiz_points: number;
}

export default function Home() {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAnswerToday, setCanAnswerToday] = useState(true);
  const [userStats, setUserStats] = useState<{ streak: number; total_points: number }>({ streak: 0, total_points: 0 });
  const { user } = useTelegram();

  useEffect(() => {
    async function initializeSupabase() {
      if (!user) return;

      try {
        const telegramId = user.id.toString();
        const uuid = `00000000-0000-0000-0000-${telegramId.padStart(12, '0')}`;

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: `${uuid}@telegram.user`,
          password: uuid,
        });

        if (authError) {
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
      } catch (err) {
        console.error('Authentication error:', err);
      }
    }

    initializeSupabase();
  }, [user]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;

      try {
        const { data: progressData } = await supabase
          .from('quiz_user_progress')
          .select('streak, last_quiz_date, next_question_id, last_streak_date, quiz_points')
          .eq('telegram_id', user.id)
          .single() as { data: ProgressData | null };

        const { data: userData } = await supabase
          .from('tg-users')
          .select('total_points')
          .eq('telegram_id', user.id)
          .single();

        setUserStats({
          streak: progressData?.streak || 0,
          total_points: userData?.total_points || 0
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastQuizDate = progressData?.last_quiz_date ? new Date(progressData.last_quiz_date) : null;
        const hasAnsweredToday = lastQuizDate && 
          lastQuizDate.getFullYear() === today.getFullYear() && 
          lastQuizDate.getMonth() === today.getMonth() && 
          lastQuizDate.getDate() === today.getDate();
        
        setCanAnswerToday(!hasAnsweredToday);

        if (!hasAnsweredToday) {
          let nextQuestionId = progressData?.next_question_id;
          
          if (!nextQuestionId) {
            const { data: firstQuestion } = await supabase
              .from('quiz_questions')
              .select('id')
              .order('created_at', { ascending: true })
              .limit(1)
              .single();
            
            nextQuestionId = firstQuestion?.id;
            
            if (nextQuestionId) {
              await supabase
                .from('quiz_user_progress')
                .insert({
                  telegram_id: user.id,
                  next_question_id: nextQuestionId
                });
            }
          }
          
          if (nextQuestionId) {
            const { data: questionData } = await supabase
              .from('quiz_questions')
              .select('*')
              .eq('id', nextQuestionId)
              .single();
            
            setQuestion(questionData);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
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
      
      await supabase
        .from('quiz_user_progress')
        .update({
          last_quiz_date: new Date().toISOString(),
          next_question_id: nextQuestion?.id || null,
          streak: isCorrect ? newStreak : 0,
          last_streak_date: isCorrect ? new Date().toISOString() : null,
          quiz_points: (progressData?.quiz_points || 0) + pointsToAdd
        })
        .eq('telegram_id', user.id);
      
      if (isCorrect) {
        const { data: userData } = await supabase
          .from('tg-users')
          .select('total_points')
          .eq('telegram_id', user.id)
          .single();

        const newPoints = (userData?.total_points || 0) + pointsToAdd;
        
        await supabase
          .from('tg-users')
          .update({
            total_points: newPoints
          })
          .eq('telegram_id', user.id);
        
        setUserStats(prev => ({
          ...prev,
          streak: newStreak,
          total_points: newPoints
        }));
      }
      
      setCanAnswerToday(false);
    } catch (err) {
      console.error('Error handling answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to handle answer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
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
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <p className="text-gray-600">Please open this app in Telegram.</p>
        </div>
      </div>
    );
  }

  if (question && canAnswerToday) {
    return (
      <main className="min-h-screen bg-white p-4">
        <DailyQuestion question={question} onAnswer={handleAnswer} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Image
            src="/buildr-network-logo.png"
            alt="Buildr Network Logo"
            width={200}
            height={200}
            className="mb-8"
          />
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="text-gray-900 font-semibold">Streak {userStats.streak}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💰</span>
            <span className="text-gray-900 font-semibold">{userStats.total_points} pBUILDR</span>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          disabled={!canAnswerToday}
          className={`w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all ${
            canAnswerToday
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canAnswerToday ? '➡️ Start Daily Quiz' : '⌛️ Come back tomorrow for a new Quiz'}
        </button>
      </div>
    </main>
  );
}
