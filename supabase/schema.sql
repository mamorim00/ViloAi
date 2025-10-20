-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  instagram_connected BOOLEAN DEFAULT FALSE,
  instagram_access_token TEXT,
  instagram_user_id TEXT,
  facebook_page_id TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create instagram_messages table
CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id TEXT UNIQUE NOT NULL,
  sender_id TEXT NOT NULL,
  sender_username TEXT,
  sender_name TEXT,
  message_text TEXT,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  intent TEXT,
  intent_confidence NUMERIC,
  ai_reply_suggestion_fi TEXT,
  ai_reply_suggestion_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_analytics table
CREATE TABLE IF NOT EXISTS message_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  price_inquiries INTEGER DEFAULT 0,
  availability_questions INTEGER DEFAULT 0,
  location_requests INTEGER DEFAULT 0,
  other_intents INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create follower_insights table
CREATE TABLE IF NOT EXISTS follower_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id TEXT NOT NULL,
  follower_username TEXT,
  follower_name TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  total_engagement_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, follower_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_instagram_messages_user_id ON instagram_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_timestamp ON instagram_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_intent ON instagram_messages(intent);
CREATE INDEX IF NOT EXISTS idx_message_analytics_user_date ON message_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_follower_insights_user_id ON follower_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_follower_insights_engagement ON follower_insights(total_engagement_score DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Instagram messages policies
CREATE POLICY "Users can view their own messages"
  ON instagram_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON instagram_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON instagram_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Message analytics policies
CREATE POLICY "Users can view their own analytics"
  ON message_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON message_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON message_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Follower insights policies
CREATE POLICY "Users can view their own follower insights"
  ON follower_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follower insights"
  ON follower_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follower insights"
  ON follower_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_messages_updated_at BEFORE UPDATE ON instagram_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_analytics_updated_at BEFORE UPDATE ON message_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follower_insights_updated_at BEFORE UPDATE ON follower_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
