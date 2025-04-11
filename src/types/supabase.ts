export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tg_users: {
        Row: {
          telegram_id: string
          username: string | null
          total_points: number
          referred_by: string | null
          created_at: string
        }
        Insert: {
          telegram_id: string
          username?: string | null
          total_points?: number
          referred_by?: string | null
          created_at?: string
        }
        Update: {
          telegram_id?: string
          username?: string | null
          total_points?: number
          referred_by?: string | null
          created_at?: string
        }
      }
      daily_checkins: {
        Row: {
          telegram_id: string
          last_checkin: string
          streak: number
        }
        Insert: {
          telegram_id: string
          last_checkin?: string
          streak?: number
        }
        Update: {
          telegram_id?: string
          last_checkin?: string
          streak?: number
        }
      }
      group_activities: {
        Row: {
          telegram_id: string
          topic_id: number
          first_message_at: string
          message_count: number
        }
        Insert: {
          telegram_id: string
          topic_id: number
          first_message_at?: string
          message_count?: number
        }
        Update: {
          telegram_id?: string
          topic_id?: number
          first_message_at?: string
          message_count?: number
        }
      }
      quiz_questions: {
        Row: {
          id: string
          question: string
          answers: string[]
          correct_answer_index: number
          category: 'defi' | 'nft' | 'dao' | 'general'
          points: number
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          answers: string[]
          correct_answer_index: number
          category: 'defi' | 'nft' | 'dao' | 'general'
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          answers?: string[]
          correct_answer_index?: number
          category?: 'defi' | 'nft' | 'dao' | 'general'
          points?: number
          created_at?: string
        }
      }
      quiz_responses: {
        Row: {
          question_id: string
          telegram_id: string
          selected_answer_index: number
          is_correct: boolean
          points_earned: number
          created_at: string
        }
        Insert: {
          question_id: string
          telegram_id: string
          selected_answer_index: number
          is_correct: boolean
          points_earned: number
          created_at?: string
        }
        Update: {
          question_id?: string
          telegram_id?: string
          selected_answer_index?: number
          is_correct?: boolean
          points_earned?: number
          created_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          email: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          type?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 