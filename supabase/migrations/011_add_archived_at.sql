-- Add archived_at column to instagram_messages and instagram_comments
-- This allows users to "ignore" messages they don't want to respond to

ALTER TABLE instagram_messages
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE instagram_comments
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instagram_messages_archived ON instagram_messages(user_id, archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_instagram_comments_archived ON instagram_comments(user_id, archived_at) WHERE archived_at IS NULL;

COMMENT ON COLUMN instagram_messages.archived_at IS 'When the user marked this message as ignored/archived';
COMMENT ON COLUMN instagram_comments.archived_at IS 'When the user marked this comment as ignored/archived';
