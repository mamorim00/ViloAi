# Debug Subscription Issue

## Step 1: Check what's in the database

Open your browser console on the dashboard page and run:

```javascript
// Get your user ID
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user.id);

// Check current profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

console.log('Profile data:', {
  subscription_plan_id: profile.subscription_plan_id,
  subscription_status: profile.subscription_status,
  subscription_tier: profile.subscription_tier,
  stripe_customer_id: profile.stripe_customer_id
});
```

## Step 2: Use the debug endpoint

Visit this URL in your browser (replace USER_ID with your actual user ID from step 1):

```
http://localhost:3000/api/debug/subscription-status?userId=USER_ID
```

This will show you:
- Your current profile data
- Your subscription plan details
- All available plans and their Stripe Price IDs
- Your Stripe subscriptions (if any)
- A diagnosis of what's wrong

## Step 3: Manual sync

Try the manual sync endpoint:

```javascript
const response = await fetch('/api/stripe/sync-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
});

const result = await response.json();
console.log('Sync result:', result);
```

## Step 4: Check server logs

Look at your terminal where `npm run dev` is running. Search for:
- "❌ Plan not found" - means Stripe Price IDs don't match
- "📋 Available plans" - shows what's in your database
- "✅ Subscription activated" - means it worked!

## Common Issues:

### Issue 1: stripe_price_id is NULL
**Symptom:** Logs show "Plan not found for price ID: price_xxx"

**Fix:** Run the UPDATE_STRIPE_PRICE_IDS.sql script with your actual Stripe Price IDs

### Issue 2: Wrong Stripe Price ID
**Symptom:** Logs show "Looking for price_id: price_ABC" but database has "price_XYZ"

**Fix:** You're using test mode prices but database has live mode (or vice versa). Update the database with the correct Price IDs.

### Issue 3: subscription_plan_id not set
**Symptom:** Profile has subscription_status='active' but subscription_plan_id is NULL

**Fix:** The webhook isn't updating the plan ID. Check server logs for errors.

### Issue 4: Polling finds it but doesn't update
**Symptom:** Console shows "Subscription detected" but UI doesn't change

**Fix:** The checkUser() function needs to refresh. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Expected Successful Flow:

1. Complete Stripe checkout
2. Server logs show:
   ```
   ✅ Checkout completed: cs_test_xxx
   💳 Subscription details: { status: 'active', priceId: 'price_xxx' }
   📦 Found plan: { id: 'uuid', name: 'basic' }
   ✅ Subscription activated for user: uuid
   📊 Rows updated: 1
   ```
3. Browser console shows:
   ```
   ✅ Subscription detected! Refreshing profile...
   ```
4. Profile now has:
   - subscription_plan_id: (UUID of basic plan)
   - subscription_status: 'active'
   - subscription_tier: 'basic'

## If Nothing Works:

Try this nuclear option in your browser console:

```javascript
// Manually set subscription (only if you have an active Stripe subscription)
const { data: basicPlan } = await supabase
  .from('subscription_plans')
  .select('id')
  .eq('name', 'basic')
  .single();

const { data: { user } } = await supabase.auth.getUser();

// This will fail due to RLS, but let's see what error we get
const { error } = await supabase
  .from('profiles')
  .update({
    subscription_plan_id: basicPlan.id,
    subscription_status: 'active',
    subscription_tier: 'basic'
  })
  .eq('id', user.id);

console.log('Manual update error (expected due to RLS):', error);
```

The manual update will fail (RLS prevents client-side updates), but it tells us if the plan ID is correct.

Then trigger manual sync from server:
```javascript
fetch('/api/stripe/sync-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
}).then(r => r.json()).then(console.log);
```
