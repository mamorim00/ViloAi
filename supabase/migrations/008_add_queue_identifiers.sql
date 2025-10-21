-- Migration: Add conversation_id and sender_id to auto_reply_queue for proper DM replies
-- This fixes the issue where we can't reply to DMs because we only stored message_id

ALTER TABLE auto_reply_queue
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS sender_id TEXT;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_auto_reply_queue_conversation ON auto_reply_queue(conversation_id);

-- Add helpful comment
COMMENT ON COLUMN auto_reply_queue.conversation_id IS 'Instagram conversation ID (for DMs) - required to reply via API';
COMMENT ON COLUMN auto_reply_queue.sender_id IS 'Instagram sender user ID (IGID) - alternative way to reply via page messages endpoint';
