-- Run this in Supabase SQL Editor to see what's in your queue

-- Check current queue items and their fields
SELECT
  id,
  message_type,
  message_id,
  conversation_id, -- This will be NULL for old items
  sender_id, -- This will be NULL for old items
  message_text,
  status,
  created_at
FROM auto_reply_queue
WHERE user_id = 'be030d4b-0a01-4287-b09f-37f2196d45d3'
ORDER BY created_at DESC
LIMIT 10;
