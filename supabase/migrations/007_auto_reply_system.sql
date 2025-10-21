-- ============================================
-- Auto-Reply System Migration
-- ============================================
-- Creates tables for Instagram comment auto-replies,
-- automation rules, approval queue, and audit logs

-- 1. Create automation_rules table
-- Stores exact-match automation triggers (e.g., "send hi" -> auto-send ebook link)
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('comment', 'dm', 'both')),
  trigger_text TEXT NOT NULL, -- The exact text to match (case-insensitive)
  reply_text TEXT NOT NULL, -- The automated reply to send
  match_type TEXT DEFAULT 'exact' CHECK (match_type IN ('exact', 'contains', 'starts_with')),
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0, -- Track how many times this rule was used
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create instagram_comments table
-- Stores Instagram post comments with AI analysis
CREATE TABLE IF NOT EXISTS instagram_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id TEXT UNIQUE NOT NULL, -- Instagram comment ID
  post_id TEXT NOT NULL, -- Instagram post/media ID
  media_id TEXT NOT NULL, -- Same as post_id
  sender_id TEXT NOT NULL, -- Instagram user ID who commented
  sender_username TEXT,
  sender_name TEXT,
  comment_text TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,

  -- AI Analysis fields
  intent TEXT,
  intent_confidence NUMERIC,
  is_question BOOLEAN DEFAULT FALSE, -- Whether AI determined this is a question/inquiry
  ai_reply_suggestion_fi TEXT,
  ai_reply_suggestion_en TEXT,

  -- Reply tracking
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by TEXT CHECK (replied_by IN ('automation', 'ai_approved', 'manual')),
  reply_text TEXT,
  reply_comment_id TEXT, -- Instagram ID of the reply comment

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create auto_reply_queue table
-- Stores AI-generated replies awaiting user approval
CREATE TABLE IF NOT EXISTS auto_reply_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('comment', 'dm')),
  message_id TEXT NOT NULL, -- Reference to comment_id or message_id
  message_text TEXT NOT NULL, -- Original message from customer
  sender_username TEXT,

  -- Suggested reply
  suggested_reply TEXT NOT NULL,
  detected_language TEXT DEFAULT 'en' CHECK (detected_language IN ('fi', 'en')),

  -- Approval status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Edited reply (if user modified before sending)
  final_reply TEXT, -- If user edited the suggested reply

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') -- Auto-expire old items
);

-- 4. Create auto_reply_logs table
-- Audit trail of all auto-replies sent
CREATE TABLE IF NOT EXISTS auto_reply_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('comment', 'dm')),
  message_id TEXT NOT NULL, -- Reference to comment_id or message_id
  original_message_text TEXT,
  sender_username TEXT,

  -- Reply details
  reply_text TEXT NOT NULL,
  reply_type TEXT NOT NULL CHECK (reply_type IN ('automation', 'ai_approved')),
  automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL, -- If triggered by automation

  -- Metadata
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  instagram_reply_id TEXT, -- Instagram ID of sent reply/message
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Update profiles table with auto-reply settings
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_reply_comments_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_reply_dms_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_comment_sync TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Automation rules indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(trigger_type);

-- Instagram comments indexes
CREATE INDEX IF NOT EXISTS idx_instagram_comments_user_id ON instagram_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_post_id ON instagram_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_timestamp ON instagram_comments(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_comments_is_question ON instagram_comments(user_id, is_question) WHERE is_question = TRUE;
CREATE INDEX IF NOT EXISTS idx_instagram_comments_replied ON instagram_comments(user_id, replied_at);

-- Auto-reply queue indexes
CREATE INDEX IF NOT EXISTS idx_auto_reply_queue_user_id ON auto_reply_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_queue_status ON auto_reply_queue(user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_auto_reply_queue_message ON auto_reply_queue(message_type, message_id);

-- Auto-reply logs indexes
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_user_id ON auto_reply_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_sent_at ON auto_reply_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_reply_logs_type ON auto_reply_logs(reply_type);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_logs ENABLE ROW LEVEL SECURITY;

-- Automation Rules Policies
CREATE POLICY "Users can view their own automation rules"
  ON automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation rules"
  ON automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation rules"
  ON automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation rules"
  ON automation_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Instagram Comments Policies
CREATE POLICY "Users can view their own comments"
  ON instagram_comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comments"
  ON instagram_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON instagram_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-Reply Queue Policies
CREATE POLICY "Users can view their own queue items"
  ON auto_reply_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue items"
  ON auto_reply_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue items"
  ON auto_reply_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue items"
  ON auto_reply_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-Reply Logs Policies
CREATE POLICY "Users can view their own logs"
  ON auto_reply_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON auto_reply_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_comments_updated_at
  BEFORE UPDATE ON instagram_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_reply_queue_updated_at
  BEFORE UPDATE ON auto_reply_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to clean up expired queue items
CREATE OR REPLACE FUNCTION cleanup_expired_queue_items()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE auto_reply_queue
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending approval count for a user
CREATE OR REPLACE FUNCTION get_pending_approvals_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count
  FROM auto_reply_queue
  WHERE user_id = p_user_id AND status = 'pending';

  RETURN count;
END;
$$ LANGUAGE plpgsql;
