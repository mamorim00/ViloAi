-- Add reply tracking fields to instagram_messages table
ALTER TABLE instagram_messages
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS replied_by TEXT CHECK (replied_by IN ('instagram_auto', 'manual')),
ADD COLUMN IF NOT EXISTS reply_text TEXT;

-- Add index for filtering by replied status
CREATE INDEX IF NOT EXISTS idx_instagram_messages_replied ON instagram_messages(replied_at, replied_by);

-- Add comment for documentation
COMMENT ON COLUMN instagram_messages.replied_at IS 'Timestamp when the message was answered';
COMMENT ON COLUMN instagram_messages.replied_by IS 'How the message was marked as answered: instagram_auto (detected from IG) or manual (user marked)';
COMMENT ON COLUMN instagram_messages.reply_text IS 'The actual reply text sent (if available from Instagram API)';
