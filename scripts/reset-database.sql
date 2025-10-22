-- ViloAi Database Reset Script
-- ⚠️ WARNING: This will DELETE ALL DATA including users, messages, and subscriptions
-- Use this script for testing purposes only
-- Run this in the Supabase SQL Editor

-- Step 1: Disable triggers temporarily to avoid cascade issues
SET session_replication_role = replica;

-- Step 2: Delete all application data (in reverse dependency order)
DELETE FROM follower_insights;
DELETE FROM message_analytics;
DELETE FROM auto_reply_queue;
DELETE FROM automation_rules;
DELETE FROM instagram_comments;
DELETE FROM instagram_messages;
DELETE FROM profiles;

-- Step 3: Delete all auth users (this will cascade to profiles via trigger)
-- Note: This requires admin access to auth schema
DELETE FROM auth.users;

-- Step 4: Re-enable triggers
SET session_replication_role = DEFAULT;

-- Step 5: Reset any sequences (if needed)
-- Uncomment if you want to reset auto-increment IDs
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS instagram_messages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS instagram_comments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS message_analytics_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS follower_insights_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS auto_reply_queue_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS automation_rules_id_seq RESTART WITH 1;

-- Verify deletion
SELECT
  'auth.users' as table_name,
  COUNT(*) as remaining_rows
FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'instagram_messages', COUNT(*) FROM instagram_messages
UNION ALL
SELECT 'instagram_comments', COUNT(*) FROM instagram_comments
UNION ALL
SELECT 'message_analytics', COUNT(*) FROM message_analytics
UNION ALL
SELECT 'follower_insights', COUNT(*) FROM follower_insights
UNION ALL
SELECT 'auto_reply_queue', COUNT(*) FROM auto_reply_queue
UNION ALL
SELECT 'automation_rules', COUNT(*) FROM automation_rules;

-- All tables should show 0 remaining rows
