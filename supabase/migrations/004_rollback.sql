-- Rollback Script for Migration 004
-- Run this ONLY if you need to undo the migration and start fresh

-- Drop indexes
DROP INDEX IF EXISTS idx_instagram_messages_date;
DROP INDEX IF EXISTS idx_instagram_messages_timestamp;
DROP INDEX IF EXISTS idx_instagram_messages_replied_status;
DROP INDEX IF EXISTS idx_message_analytics_date;
DROP INDEX IF EXISTS idx_follower_insights_score;
DROP INDEX IF EXISTS idx_reply_templates_user;

-- Drop trigger and function for response time
DROP TRIGGER IF EXISTS calculate_message_response_time ON instagram_messages;
DROP FUNCTION IF EXISTS calculate_response_time();

-- Drop reply_templates table
DROP TABLE IF EXISTS reply_templates;

-- Remove columns from message_analytics
ALTER TABLE message_analytics
DROP COLUMN IF EXISTS replied_messages,
DROP COLUMN IF EXISTS avg_response_time_hours,
DROP COLUMN IF EXISTS general_questions,
DROP COLUMN IF EXISTS complaints,
DROP COLUMN IF EXISTS compliments;

-- Remove columns from profiles
ALTER TABLE profiles
DROP COLUMN IF EXISTS onboarding_completed,
DROP COLUMN IF EXISTS onboarding_step,
DROP COLUMN IF EXISTS onboarding_started_at,
DROP COLUMN IF EXISTS onboarding_completed_at;

-- Remove column from instagram_messages
ALTER TABLE instagram_messages
DROP COLUMN IF EXISTS response_time_minutes;

-- Verification query
SELECT 'Rollback completed successfully!' AS status;
