-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('free', 'basic', 'premium', 'enterprise')),
  display_name_en TEXT NOT NULL,
  display_name_fi TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL,
  message_limit INTEGER, -- NULL means unlimited
  stripe_price_id TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name_en, display_name_fi, price_monthly, message_limit, features) VALUES
('free', 'Free Trial', 'Ilmainen kokeilu', 0, 50, '{"trial_days": 14, "ai_analysis": true, "basic_support": true}'),
('basic', 'Basic', 'Perus', 29, 500, '{"ai_analysis": true, "business_rules": true, "email_support": true, "analytics": true}'),
('premium', 'Premium', 'Premium', 79, 2000, '{"ai_analysis": true, "business_rules": true, "priority_support": true, "analytics": true, "advanced_insights": true}'),
('enterprise', 'Enterprise', 'Yritys', 199, NULL, '{"ai_analysis": true, "business_rules": true, "priority_support": true, "analytics": true, "advanced_insights": true, "api_access": true, "custom_integrations": true}')
ON CONFLICT (name) DO NOTHING;

-- Update profiles table for subscription tracking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset DATE DEFAULT CURRENT_DATE;

-- Set default plan to free for existing users
UPDATE profiles
SET subscription_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
    trial_ends_at = NOW() + INTERVAL '14 days'
WHERE subscription_plan_id IS NULL;

-- Create analytics_jobs table for scheduled tasks
CREATE TABLE IF NOT EXISTS analytics_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL UNIQUE CHECK (job_type IN ('daily_aggregation', 'weekly_report', 'monthly_billing')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial job records
INSERT INTO analytics_jobs (job_type, next_run_at) VALUES
('daily_aggregation', NOW() + INTERVAL '1 day'),
('weekly_report', NOW() + INTERVAL '7 days'),
('monthly_billing', NOW() + INTERVAL '1 month')
ON CONFLICT (job_type) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_plan ON profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends ON profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_jobs_next_run ON analytics_jobs(next_run_at, status);

-- Enable RLS for new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (read-only for all authenticated users)
CREATE POLICY "Anyone can view active subscription plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- RLS policies for analytics_jobs (admin only - service role bypass RLS)
CREATE POLICY "Only service role can manage analytics jobs"
  ON analytics_jobs FOR ALL
  USING (false); -- This will be accessed via service role only

-- Create trigger for updated_at on subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on analytics_jobs
CREATE TRIGGER update_analytics_jobs_updated_at BEFORE UPDATE ON analytics_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to atomically increment message count
CREATE OR REPLACE FUNCTION increment_message_count(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET monthly_message_count = monthly_message_count + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with pricing and limits';
COMMENT ON COLUMN profiles.subscription_plan_id IS 'Current subscription plan for the user';
COMMENT ON COLUMN profiles.trial_ends_at IS 'When the free trial expires';
COMMENT ON COLUMN profiles.monthly_message_count IS 'Number of messages analyzed this billing cycle';
COMMENT ON COLUMN profiles.last_message_reset IS 'Last date when monthly message count was reset';
COMMENT ON TABLE analytics_jobs IS 'Scheduled background jobs for analytics and billing';
COMMENT ON FUNCTION increment_message_count IS 'Atomically increments the monthly message count for a user';
