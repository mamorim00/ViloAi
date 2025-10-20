-- Create business_rules table
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('price', 'business_info', 'inventory', 'faq', 'other')),
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  rule_metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_business_rules_user_id ON business_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_type ON business_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_business_rules_active ON business_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_business_rules_user_type ON business_rules(user_id, rule_type);

-- Enable Row Level Security
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own business rules"
  ON business_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business rules"
  ON business_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business rules"
  ON business_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business rules"
  ON business_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_rules_updated_at BEFORE UPDATE ON business_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
