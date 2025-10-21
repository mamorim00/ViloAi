-- Add response time tracking to messages
ALTER TABLE instagram_messages
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;

-- Add indexes for analytics queries (FIXED - removed DATE() function which is not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_instagram_messages_timestamp ON instagram_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_replied_status ON instagram_messages(replied_at) WHERE replied_at IS NOT NULL;

-- Enhance message_analytics table with more metrics
ALTER TABLE message_analytics
ADD COLUMN IF NOT EXISTS replied_messages INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_response_time_hours NUMERIC,
ADD COLUMN IF NOT EXISTS general_questions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complaints INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS compliments INTEGER DEFAULT 0;

-- Add onboarding tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create reply templates table
CREATE TABLE IF NOT EXISTS reply_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_text TEXT NOT NULL,
  intent_type TEXT, -- Associate with specific intent
  language TEXT CHECK (language IN ('fi', 'en', 'both')) DEFAULT 'both',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for reply templates
ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates"
  ON reply_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON reply_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON reply_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON reply_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for reply_templates updated_at
CREATE TRIGGER update_reply_templates_updated_at BEFORE UPDATE ON reply_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
  -- If message is being marked as replied for the first time
  IF NEW.replied_at IS NOT NULL AND OLD.replied_at IS NULL THEN
    NEW.response_time_minutes := EXTRACT(EPOCH FROM (NEW.replied_at - NEW.timestamp)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate response time
DROP TRIGGER IF EXISTS calculate_message_response_time ON instagram_messages;
CREATE TRIGGER calculate_message_response_time
  BEFORE UPDATE ON instagram_messages
  FOR EACH ROW
  WHEN (NEW.replied_at IS NOT NULL AND OLD.replied_at IS NULL)
  EXECUTE FUNCTION calculate_response_time();

-- Add indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_message_analytics_date ON message_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_follower_insights_score ON follower_insights(total_engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_reply_templates_user ON reply_templates(user_id, is_active);

-- Comment for documentation
COMMENT ON COLUMN instagram_messages.response_time_minutes IS 'Time taken to respond to message in minutes';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current step in onboarding flow: 0=not started, 1=subscription, 2=instagram, 3=rules, 4=sync, 5=completed';
COMMENT ON TABLE reply_templates IS 'Reusable reply templates for quick responses';
