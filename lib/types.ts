export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  instagram_connected: boolean;
  instagram_access_token?: string;
  instagram_user_id?: string;
  facebook_page_id?: string;
  last_instagram_sync?: string;
  stripe_customer_id?: string;
  subscription_status: string;
  subscription_tier?: string;
  subscription_plan_id?: string;
  trial_ends_at?: string;
  monthly_message_count: number;
  last_message_reset: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  onboarding_started_at?: string;
  onboarding_completed_at?: string;
  auto_reply_comments_enabled?: boolean;
  auto_reply_dms_enabled?: boolean;
  last_comment_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramMessage {
  id: string;
  user_id: string;
  message_id: string;
  conversation_id?: string;
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
  response_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationContext {
  message_text: string;
  msg_timestamp: string;
  sender_name: string;
}

export interface MessageAnalytics {
  id: string;
  user_id: string;
  date: string;
  total_messages: number;
  price_inquiries: number;
  availability_questions: number;
  location_requests: number;
  general_questions: number;
  complaints: number;
  compliments: number;
  other_intents: number;
  replied_messages: number;
  avg_response_time_minutes?: number;
  avg_response_time_hours?: number;
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

export interface ReplyTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_text: string;
  intent_type?: string;
  language: 'fi' | 'en' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalMessages: number;
  repliedMessages: number;
  responseRate: number;
  avgResponseTimeHours: number;
  messagesByIntent: Record<MessageIntent, number>;
  messagesByDate: Array<{
    date: string;
    count: number;
    replied: number;
  }>;
}

// ============================================
// Auto-Reply System Types
// ============================================

export type TriggerType = 'comment' | 'dm' | 'both';
export type MatchType = 'exact' | 'contains' | 'starts_with';
export type ReplyType = 'automation' | 'ai_approved';
export type RepliedBy = 'automation' | 'ai_approved' | 'manual';
export type QueueStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AutomationRule {
  id: string;
  user_id: string;
  trigger_type: TriggerType;
  trigger_text: string;
  reply_text: string;
  match_type: MatchType;
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramComment {
  id: string;
  user_id: string;
  comment_id: string;
  post_id: string;
  media_id: string;
  sender_id: string;
  sender_username?: string;
  sender_name?: string;
  comment_text?: string;
  timestamp: string;
  is_read: boolean;
  intent?: string;
  intent_confidence?: number;
  is_question: boolean;
  ai_reply_suggestion_fi?: string;
  ai_reply_suggestion_en?: string;
  replied_at?: string;
  replied_by?: RepliedBy;
  reply_text?: string;
  reply_comment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AutoReplyQueue {
  id: string;
  user_id: string;
  message_type: 'comment' | 'dm';
  message_id: string;
  conversation_id?: string; // Instagram conversation ID (for DMs)
  sender_id?: string; // Instagram sender user ID (IGID)
  message_text: string;
  sender_username?: string;
  suggested_reply: string;
  detected_language: 'fi' | 'en';
  status: QueueStatus;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  final_reply?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface AutoReplyLog {
  id: string;
  user_id: string;
  message_type: 'comment' | 'dm';
  message_id: string;
  original_message_text?: string;
  sender_username?: string;
  reply_text: string;
  reply_type: ReplyType;
  automation_rule_id?: string;
  sent_at: string;
  instagram_reply_id?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface AutoReplySettings {
  auto_reply_comments_enabled: boolean;
  auto_reply_dms_enabled: boolean;
}

// ============================================
// Lead Management Types
// ============================================

export type LeadScore = 0 | 5 | 8 | 10;

export interface LeadInfo {
  isLead: boolean;
  score: LeadScore;
  reason: string;
}

// Unified inbox item (combines messages, comments, and queue items)
export interface UnifiedInboxItem {
  id: string;
  type: 'dm' | 'comment' | 'pending_approval';
  source_id: string; // Original message_id or comment_id
  user_id: string;
  sender_id: string;
  sender_username?: string;
  sender_name?: string;
  message_text: string;
  timestamp: string;
  intent?: MessageIntent;
  intent_confidence?: number;
  ai_suggestion_fi?: string;
  ai_suggestion_en?: string;
  detected_language?: 'fi' | 'en';
  replied_at?: string;
  replied_by?: string;
  reply_text?: string;
  // Lead info
  lead_info: LeadInfo;
  // Queue-specific fields (for pending approvals)
  queue_item_id?: string;
  conversation_id?: string; // For DMs
  post_id?: string; // For comments
  status?: QueueStatus;
}
