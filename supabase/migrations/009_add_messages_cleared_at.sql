-- Add messages_cleared_at field to profiles table
-- This tracks when the user last cleared their messages
-- Sync operations will only fetch messages after this timestamp

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS messages_cleared_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the field
COMMENT ON COLUMN profiles.messages_cleared_at IS 'Timestamp when user last cleared all messages. Used to prevent re-syncing old messages.';
