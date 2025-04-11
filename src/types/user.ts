export interface TgUser {
  telegram_id: string;
  username: string | null;
  total_points: number;
  referred_by: string | null;
  created_at: string;
}

export interface DailyCheckin {
  telegram_id: string;
  last_checkin: string;
  streak: number;
}

export interface GroupActivity {
  telegram_id: string;
  topic_id: number;
  first_message_at: string;
  message_count: number;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  type: string;
  created_at: string;
} 