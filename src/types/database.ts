
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count?: number;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export interface ThreadWithStats extends ChatThread {
  message_count: number;
}
