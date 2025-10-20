export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  instagram_connected: boolean;
  instagram_access_token?: string;
  instagram_user_id?: string;
  facebook_page_id?: string;
  stripe_customer_id?: string;
  subscription_status: string;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramMessage {
  id: string;
  user_id: string;
  message_id: string;
  sender_id: string;
  sender_username?: string;
  sender_name?: string;
  message_text?: string;
  message_type: string;
  media_url?: string;
  timestamp: string;
  is_read: boolean;
  intent?: string;
  intent_confidence?: number;
  ai_reply_suggestion_fi?: string;
  ai_reply_suggestion_en?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageAnalytics {
  id: string;
  user_id: string;
  date: string;
  total_messages: number;
  price_inquiries: number;
  availability_questions: number;
  location_requests: number;
  other_intents: number;
  avg_response_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface FollowerInsight {
  id: string;
  user_id: string;
  follower_id: string;
  follower_username?: string;
  follower_name?: string;
  message_count: number;
  last_message_at?: string;
  total_engagement_score: number;
  created_at: string;
  updated_at: string;
}

export type MessageIntent =
  | 'price_inquiry'
  | 'availability'
  | 'location'
  | 'general_question'
  | 'complaint'
  | 'compliment'
  | 'other';

export interface IntentAnalysisResult {
  intent: MessageIntent;
  confidence: number;
  suggestedReplyFi: string;
  suggestedReplyEn: string;
}
