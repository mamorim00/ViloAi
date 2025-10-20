-- Migration: Add facebook_page_id column to profiles table
-- Run this in your Supabase SQL Editor if you already have the profiles table created

-- Add the new column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_page_id TEXT;

-- Note: Existing users will need to reconnect their Instagram accounts
-- to populate the facebook_page_id field
