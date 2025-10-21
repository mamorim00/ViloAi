-- Migration 006: Add Conversation Tracking and Incremental Sync Support
-- This migration enables:
-- 1. Message session grouping by conversation
-- 2. Incremental sync to only fetch new messages

-- Add conversation_id to instagram_messages table
ALTER TABLE instagram_messages
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

-- Add index for fast conversation lookups
CREATE INDEX IF NOT EXISTS idx_instagram_messages_conversation
  ON instagram_messages(conversation_id, timestamp DESC);

-- Add index for session context queries (same sender, recent messages)
CREATE INDEX IF NOT EXISTS idx_instagram_messages_sender_timestamp
  ON instagram_messages(user_id, sender_id, timestamp DESC);

-- Add last_instagram_sync to profiles table for incremental sync
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_instagram_sync TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN instagram_messages.conversation_id IS 'Instagram conversation/thread ID for grouping related messages';
COMMENT ON COLUMN profiles.last_instagram_sync IS 'Timestamp of last successful Instagram message sync for incremental updates';

-- Create function to get conversation context for AI analysis
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_user_id UUID,
  p_conversation_id TEXT,
  p_current_timestamp TIMESTAMP WITH TIME ZONE,
  p_minutes_back INTEGER DEFAULT 10,
  p_max_messages INTEGER DEFAULT 5
)
RETURNS TABLE (
  message_text TEXT,
  msg_timestamp TIMESTAMP WITH TIME ZONE,
  sender_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    im.message_text,
    im.timestamp AS msg_timestamp,
    im.sender_name
  FROM instagram_messages im
  WHERE im.user_id = p_user_id
    AND im.conversation_id = p_conversation_id
    AND im.timestamp >= (p_current_timestamp - (p_minutes_back || ' minutes')::INTERVAL)
    AND im.timestamp < p_current_timestamp
  ORDER BY im.timestamp ASC
  LIMIT p_max_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on function
COMMENT ON FUNCTION get_conversation_context IS 'Retrieves recent messages from a conversation for AI context analysis';
