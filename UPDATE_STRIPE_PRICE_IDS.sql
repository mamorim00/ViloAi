-- ============================================
-- Update Stripe Price IDs in subscription_plans
-- ============================================
--
-- INSTRUCTIONS:
-- 1. Go to Stripe Dashboard → Products
-- 2. For each product (Basic/Growth, Premium/Pro), click on it
-- 3. Copy the Price ID (starts with price_xxxxx)
-- 4. Replace the placeholders below with your actual Price IDs
-- 5. Run this SQL in Supabase SQL Editor
--
-- ============================================

-- Update Basic/Growth plan with Stripe Price ID
UPDATE subscription_plans
SET stripe_price_id = 'price_YOUR_BASIC_PRICE_ID_HERE'
WHERE name = 'basic';

-- Update Premium/Pro plan with Stripe Price ID
UPDATE subscription_plans
SET stripe_price_id = 'price_YOUR_PREMIUM_PRICE_ID_HERE'
WHERE name = 'premium';

-- Update Enterprise plan if you have one
UPDATE subscription_plans
SET stripe_price_id = 'price_YOUR_ENTERPRISE_PRICE_ID_HERE'
WHERE name = 'enterprise';

-- Free plan doesn't need a Stripe Price ID (it's free)

-- ============================================
-- Verify the update
-- ============================================
SELECT
  name,
  display_name_en,
  price_monthly,
  stripe_price_id,
  CASE
    WHEN stripe_price_id IS NULL AND name != 'free' THEN '❌ MISSING'
    WHEN stripe_price_id IS NOT NULL THEN '✅ SET'
    ELSE '✅ FREE (no price needed)'
  END as status
FROM subscription_plans
ORDER BY price_monthly;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
--
-- 1. Make sure you're using the correct Stripe Price IDs:
--    - For TEST mode: price_xxxxx (starts with price_)
--    - For LIVE mode: Use LIVE price IDs (also start with price_)
--
-- 2. Each Stripe Price ID is unique to:
--    - The specific product
--    - The billing interval (monthly/yearly)
--    - Test vs Live mode
--
-- 3. If you change the price in Stripe, you need to:
--    - Create a NEW price in Stripe (don't edit existing)
--    - Update this table with the new Price ID
--
-- 4. How to find your Price IDs in Stripe:
--    - Dashboard → Products
--    - Click on the product
--    - Look for "Pricing" section
--    - Click "..." → "Copy Price ID"
--
-- ============================================


 Full profile data: 
{subscription_plan_id: 'b5b87a3e-08ed-4294-8a56-abb456871672', subscription_status: 'active', subscription_tier: 'free'}
subscription_plan_id
: 
"b5b87a3e-08ed-4294-8a56-abb456871672"
subscription_status
: 
"active"
subscription_tier
: 
"free"

 http://localhost:3000/api/debug/subscription-status?u
  serId



const { data: { user } } = await
supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_plan_id, subscription_status,
  subscription_tier, stripe_customer_id')
  .eq('id', user.id)
  .single();

console.log('🔍 Current profile:', profile);