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
  subscription_plan_id?: string;
  trial_ends_at?: string;
  monthly_message_count: number;
  last_message_reset: string;
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
  replied_at?: string;
  replied_by?: 'instagram_auto' | 'manual';
  reply_text?: string;
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
  detectedLanguage?: 'fi' | 'en';
  suggestedReplyFi: string;
  suggestedReplyEn: string;
}

export type RuleType = 'price' | 'business_info' | 'inventory' | 'faq' | 'other';

export interface BusinessRule {
  id: string;
  user_id: string;
  rule_type: RuleType;
  rule_key: string;
  rule_value: string;
  rule_metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlanName = 'free' | 'basic' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: SubscriptionPlanName;
  display_name_en: string;
  display_name_fi: string;
  price_monthly: number;
  message_limit: number | null; // null = unlimited
  stripe_price_id?: string;
  features: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsJob {
  id: string;
  job_type: 'daily_aggregation' | 'weekly_report' | 'monthly_billing';
  last_run_at?: string;
  next_run_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  current_count: number;
  limit: number | null; // null = unlimited
  percentage: number;
  reset_date: string;
  is_over_limit: boolean;
}
