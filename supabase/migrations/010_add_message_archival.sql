-- Migration 010: Add Message Archival System
-- Purpose: Improve sync performance by archiving answered messages
-- This replaces slow timestamp checking with fast indexed queries

-- Add is_archived field to instagram_messages
ALTER TABLE instagram_messages
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add is_archived field to instagram_comments
ALTER TABLE instagram_comments
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add indexes for fast querying of unanswered messages
CREATE INDEX IF NOT EXISTS idx_instagram_messages_unarchived
ON instagram_messages(user_id, is_archived, replied_at)
WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_instagram_comments_unarchived
ON instagram_comments(user_id, is_archived, replied_at)
WHERE is_archived = FALSE;

-- Add index for message_id lookups (used in sync duplicate detection)
CREATE INDEX IF NOT EXISTS idx_instagram_messages_message_id
ON instagram_messages(user_id, message_id)
WHERE is_archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_instagram_comments_comment_id
ON instagram_comments(user_id, comment_id)
WHERE is_archived = FALSE;

-- Comments on new fields
COMMENT ON COLUMN instagram_messages.is_archived IS 'True if message has been answered and archived. Archived messages are skipped during sync.';
COMMENT ON COLUMN instagram_comments.is_archived IS 'True if comment has been answered and archived. Archived messages are skipped during sync.';

-- Function to auto-archive old answered messages (called by cron job)
CREATE OR REPLACE FUNCTION archive_old_answered_messages(days_old INTEGER DEFAULT 30)
RETURNS TABLE(archived_messages BIGINT, archived_comments BIGINT) AS $$
DECLARE
  msg_count BIGINT;
  comment_count BIGINT;
BEGIN
  -- Archive old answered DMs
  UPDATE instagram_messages
  SET is_archived = TRUE
  WHERE replied_at IS NOT NULL
    AND replied_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_archived = FALSE;

  GET DIAGNOSTICS msg_count = ROW_COUNT;

  -- Archive old answered comments
  UPDATE instagram_comments
  SET is_archived = TRUE
  WHERE replied_at IS NOT NULL
    AND replied_at < NOW() - (days_old || ' days')::INTERVAL
    AND is_archived = FALSE;

  GET DIAGNOSTICS comment_count = ROW_COUNT;

  RETURN QUERY SELECT msg_count, comment_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_old_answered_messages IS 'Archives answered messages older than specified days. Default 30 days.';
