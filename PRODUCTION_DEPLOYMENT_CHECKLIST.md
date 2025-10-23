# Production Deployment Checklist for ViloAi

This comprehensive checklist ensures your SaaS application is fully ready for production deployment with all subscription management features properly configured.

## Table of Contents
1. [Pre-Deployment: Stripe Configuration](#1-pre-deployment-stripe-configuration)
2. [Pre-Deployment: Environment Variables](#2-pre-deployment-environment-variables)
3. [Pre-Deployment: Database Setup](#3-pre-deployment-database-setup)
4. [Pre-Deployment: Meta/Instagram Setup](#4-pre-deployment-metainstagram-setup)
5. [Deployment Process](#5-deployment-process)
6. [Post-Deployment: Testing Checklist](#6-post-deployment-testing-checklist)
7. [Monitoring & Troubleshooting](#7-monitoring--troubleshooting)

---

## 1. Pre-Deployment: Stripe Configuration

### 1.1 Create Live Products and Prices
- [ ] Log into [Stripe Dashboard](https://dashboard.stripe.com) and switch to **Live Mode**
- [ ] Navigate to Products → Create products for each subscription tier:
  - **Free Plan** (if applicable)
  - **Starter/Basic Plan**
  - **Pro/Premium Plan**
  - **Enterprise Plan** (if applicable)
- [ ] For each product:
  - [ ] Set product name (e.g., "ViloAi Pro Plan")
  - [ ] Add description
  - [ ] Create a **recurring price** (monthly)
  - [ ] Set billing period to "Monthly"
  - [ ] Copy the **Live Price ID** (starts with `price_`)

### 1.2 Configure Stripe Billing Portal
- [ ] Go to Settings → Billing → [Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
- [ ] Click "Activate Test Link" to enable in Live Mode
- [ ] Configure portal settings:
  - [ ] ✅ Allow customers to update payment methods
  - [ ] ✅ Allow customers to cancel subscriptions
  - [ ] ✅ Show pricing table for plan upgrades/downgrades
  - [ ] ✅ Configure cancellation options (immediate vs. end of period)
- [ ] Set custom branding (logo, colors, business name)
- [ ] Save changes

### 1.3 Set Up Stripe Webhooks (CRITICAL)
- [ ] Go to Developers → [Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Click "Add endpoint"
- [ ] Enter endpoint URL: `https://YOUR-DOMAIN.com/api/stripe/webhook`
- [ ] Select events to listen for:
  - [ ] `checkout.session.completed` - Initial subscription creation
  - [ ] `customer.subscription.created` - Subscription created
  - [ ] `customer.subscription.updated` - Plan changes, renewals
  - [ ] `customer.subscription.deleted` - Cancellations
  - [ ] `invoice.payment_succeeded` - Successful payments
  - [ ] `invoice.payment_failed` - Failed payments
- [ ] Click "Add endpoint"
- [ ] **IMPORTANT**: Copy the **Webhook Signing Secret** (starts with `whsec_`)
- [ ] Add to environment variables as `STRIPE_WEBHOOK_SECRET`

### 1.4 Get Stripe API Keys
- [ ] Go to Developers → [API Keys](https://dashboard.stripe.com/apikeys)
- [ ] Switch to **Live Mode**
- [ ] Copy **Publishable Key** (starts with `pk_live_`)
- [ ] Reveal and copy **Secret Key** (starts with `sk_live_`)
- [ ] **NEVER commit these keys to Git!**

---

## 2. Pre-Deployment: Environment Variables

### 2.1 Update `.env` or Vercel Environment Variables

Create or update these variables for **PRODUCTION**:

```bash
# App URL (CRITICAL - must be production URL)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Supabase (use production project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # Keep secret!

# Stripe (LIVE KEYS - not test keys!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Meta/Instagram (use production app)
META_APP_ID=your_production_meta_app_id
META_APP_SECRET=your_production_meta_app_secret
META_REDIRECT_URI=https://your-production-domain.com/api/auth/instagram/callback

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: OpenAI (if using as fallback)
# OPENAI_API_KEY=sk-...
```

### 2.2 Verify All Required Variables
- [ ] `NEXT_PUBLIC_APP_URL` - No trailing slash, https://
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (SECRET!)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - **LIVE** publishable key
- [ ] `STRIPE_SECRET_KEY` - **LIVE** secret key (SECRET!)
- [ ] `STRIPE_WEBHOOK_SECRET` - **LIVE** webhook secret (SECRET!)
- [ ] `META_APP_ID` - Production Meta app ID
- [ ] `META_APP_SECRET` - Production Meta app secret (SECRET!)
- [ ] `META_REDIRECT_URI` - Production callback URL
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key (SECRET!)

---

## 3. Pre-Deployment: Database Setup

### 3.1 Update Subscription Plans Table
- [ ] Open [Supabase SQL Editor](https://app.supabase.com)
- [ ] Run the following SQL to update with **LIVE** Stripe Price IDs:

```sql
-- Update subscription_plans with LIVE Stripe Price IDs

-- Example: Update Free Plan (if you have one)
UPDATE subscription_plans
SET stripe_price_id = NULL  -- Free plans don't have Stripe prices
WHERE name = 'free';

-- Example: Update Starter Plan
UPDATE subscription_plans
SET stripe_price_id = 'price_LIVE_STARTER_PRICE_ID_HERE',
    price_monthly = 9.99  -- Your actual price
WHERE name = 'starter';

-- Example: Update Pro Plan
UPDATE subscription_plans
SET stripe_price_id = 'price_LIVE_PRO_PRICE_ID_HERE',
    price_monthly = 29.99  -- Your actual price
WHERE name = 'pro';

-- Example: Update Enterprise Plan
UPDATE subscription_plans
SET stripe_price_id = 'price_LIVE_ENTERPRISE_PRICE_ID_HERE',
    price_monthly = 99.99  -- Your actual price
WHERE name = 'enterprise';

-- Verify the updates
SELECT id, name, price_monthly, stripe_price_id FROM subscription_plans ORDER BY price_monthly;
```

### 3.2 Verify Database Schema
- [ ] All tables created (`profiles`, `instagram_messages`, `message_analytics`, `follower_insights`, `subscription_plans`, `business_rules`, `instagram_comments`, `auto_reply_queue`)
- [ ] RLS policies enabled on all tables
- [ ] Triggers created (`handle_new_user`, `update_updated_at_column`)
- [ ] Indexes created for performance

---

## 4. Pre-Deployment: Meta/Instagram Setup

### 4.1 Configure Meta App for Production
- [ ] Log into [Meta for Developers](https://developers.facebook.com)
- [ ] Select your app
- [ ] Switch app to **Live Mode** (if not already)
- [ ] Go to **Instagram Basic Display** or **Instagram API** settings
- [ ] Update **Valid OAuth Redirect URIs**:
  - Add: `https://your-production-domain.com/api/auth/instagram/callback`
- [ ] Go to **App Review** and submit required permissions:
  - [ ] `instagram_basic`
  - [ ] `instagram_manage_messages`
  - [ ] `instagram_manage_comments`
  - [ ] `pages_show_list`
  - [ ] `business_management`
- [ ] Verify app is in **Live mode** and approved

### 4.2 Test Instagram Connection
- [ ] Use a test Instagram Business Account connected to a Facebook Page
- [ ] Ensure you are admin of the Facebook Page
- [ ] Verify the Page has an Instagram Business Account linked

---

## 5. Deployment Process

### 5.1 Deploy to Vercel (or your hosting platform)

#### If using Vercel:
- [ ] Push code to GitHub/GitLab
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Import your repository
- [ ] Add **all environment variables** from section 2.1
- [ ] Deploy
- [ ] Verify deployment URL matches `NEXT_PUBLIC_APP_URL`

#### If using other platform:
- [ ] Build: `npm run build`
- [ ] Test build locally: `npm run start`
- [ ] Deploy to your hosting platform
- [ ] Configure environment variables
- [ ] Verify SSL/HTTPS is enabled

### 5.2 Verify Deployment
- [ ] Visit production URL: `https://your-production-domain.com`
- [ ] Check home page loads
- [ ] Check signup/login works
- [ ] Check dashboard loads
- [ ] Check all static assets load (images, CSS, JS)

---

## 6. Post-Deployment: Testing Checklist

### 6.1 Account Creation & Authentication
- [ ] **Test Signup**
  - [ ] Create new account with email
  - [ ] Verify email confirmation (if enabled)
  - [ ] Check profile created in Supabase `profiles` table
  - [ ] Verify `stripe_customer_id` is NULL initially
- [ ] **Test Login**
  - [ ] Login with created account
  - [ ] Verify redirected to dashboard
  - [ ] Check session persists after page refresh

### 6.2 Instagram Connection
- [ ] **Test Instagram OAuth Flow**
  - [ ] Click "Connect Instagram" button
  - [ ] Verify redirect to Meta OAuth page
  - [ ] Grant permissions
  - [ ] Verify redirect back to app
  - [ ] Check `instagram_connected = true` in database
  - [ ] Verify `instagram_access_token` and `instagram_user_id` stored
- [ ] **Test Message Sync**
  - [ ] Click "Sync Messages"
  - [ ] Verify DMs fetched from Instagram
  - [ ] Check messages appear in `instagram_messages` table
  - [ ] Verify AI analysis runs (intent, suggestions)

### 6.3 Subscription Management - NEW USER

#### Test 6.3.1: First-Time Subscription (Checkout Flow)
- [ ] Log in as a **new user** with no subscription
- [ ] Go to **Settings** page
- [ ] Click **"Upgrade"** on a paid plan (e.g., Starter)
- [ ] Verify redirect to **Stripe Checkout**
- [ ] Use [Stripe Test Cards](https://stripe.com/docs/testing) in **LIVE MODE** (or real card)
  - **Successful payment**: `4242 4242 4242 4242`
  - Any future expiry date (e.g., 12/34)
  - Any 3-digit CVC
- [ ] Complete checkout
- [ ] **Expected Result**:
  - [ ] Redirect to dashboard with `?subscription=success`
  - [ ] See green "Subscription Activated!" message
  - [ ] Profile updated in database:
    - `subscription_plan_id` = correct plan ID
    - `subscription_status` = 'active'
    - `subscription_tier` = plan name
    - `stripe_customer_id` = Stripe customer ID
- [ ] Go to **Settings** → verify "Current Plan" shows correct tier

#### Test 6.3.2: Subscription Upgrade (Existing Subscriber)
- [ ] User already has an **active subscription** (e.g., Starter plan)
- [ ] Go to **Settings** page
- [ ] Click **"Upgrade"** to a higher plan (e.g., Pro)
- [ ] **Expected Result**:
  - [ ] **NO redirect to Stripe Checkout** (instant upgrade!)
  - [ ] Redirect to dashboard with `?subscription=updated`
  - [ ] See blue "Subscription Updated!" message
  - [ ] Database updated immediately:
    - `subscription_plan_id` = new plan ID
    - `subscription_tier` = new plan name
    - `subscription_status` = 'active'
  - [ ] In **Stripe Dashboard**, verify:
    - [ ] Only **ONE active subscription** (old one updated, not duplicated)
    - [ ] Subscription items show new price ID
    - [ ] Proration invoice created (charge for upgrade)

#### Test 6.3.3: Subscription Downgrade (Existing Subscriber)
- [ ] User has an **active subscription** (e.g., Pro plan)
- [ ] Go to **Settings** page
- [ ] Click **"Upgrade"** to a **lower** plan (e.g., Starter) - Note: button still says "Upgrade" but works for downgrade too
- [ ] **Expected Result**:
  - [ ] **NO redirect to Stripe Checkout** (instant downgrade!)
  - [ ] Redirect to dashboard with `?subscription=updated`
  - [ ] See blue "Subscription Updated!" message
  - [ ] Database updated:
    - `subscription_plan_id` = new (lower) plan ID
    - `subscription_tier` = new plan name
    - `subscription_status` = 'active'
  - [ ] In **Stripe Dashboard**, verify:
    - [ ] Only **ONE active subscription**
    - [ ] Subscription items show new price ID
    - [ ] Credit issued for unused time on old plan (proration)

#### Test 6.3.4: Try to "Upgrade" to Same Plan
- [ ] User has an **active subscription** (e.g., Starter plan)
- [ ] Go to **Settings** page
- [ ] Click **"Upgrade"** to the **same plan** (Starter)
- [ ] **Expected Result**:
  - [ ] Redirect to dashboard with `?subscription=already-active`
  - [ ] See yellow "Already Subscribed" message
  - [ ] No changes in Stripe or database

#### Test 6.3.5: Manage Subscription (Stripe Billing Portal)
- [ ] User has an **active subscription**
- [ ] Go to **Settings** page
- [ ] Click **"Manage Subscription"** button
- [ ] **Expected Result**:
  - [ ] Redirect to **Stripe Customer Portal**
  - [ ] User can:
    - [ ] Update payment method
    - [ ] View invoice history
    - [ ] Cancel subscription (test this!)
  - [ ] Test **cancellation**:
    - [ ] Cancel subscription in portal
    - [ ] Verify webhook fires (`customer.subscription.deleted`)
    - [ ] Database updated:
      - `subscription_plan_id` = free plan ID
      - `subscription_status` = 'canceled'
      - `subscription_tier` = 'free'

### 6.4 Webhook Testing (CRITICAL)

#### Test 6.4.1: Verify Webhooks Are Working
- [ ] Log into [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Find your webhook endpoint
- [ ] Check recent webhook deliveries
- [ ] Verify status is **Succeeded** for recent events
- [ ] If any **Failed**, click to see error logs

#### Test 6.4.2: Test Specific Webhook Events
Use Stripe's "Send test webhook" feature:

- [ ] **Test `checkout.session.completed`**
  - [ ] Trigger a test checkout
  - [ ] Verify user profile updated with subscription details
  - [ ] Check application logs for "✅ Checkout completed"

- [ ] **Test `customer.subscription.updated`**
  - [ ] Change plan via Billing Portal or upgrade flow
  - [ ] Verify database reflects new plan
  - [ ] Check logs for "✅ Subscription updated"

- [ ] **Test `customer.subscription.deleted`**
  - [ ] Cancel subscription via Billing Portal
  - [ ] Verify user downgraded to free plan
  - [ ] Check logs for "✅ User downgraded to free plan"

- [ ] **Test `invoice.payment_succeeded`**
  - [ ] Trigger renewal payment (or wait for next billing cycle)
  - [ ] Verify `monthly_message_count` reset
  - [ ] Verify `subscription_status = 'active'`

- [ ] **Test `invoice.payment_failed`**
  - [ ] Use test card that triggers payment failure: `4000 0000 0000 0341`
  - [ ] Verify `subscription_status = 'past_due'`
  - [ ] Check logs for "⚠️ Account marked as past_due"

### 6.5 Edge Cases & Error Handling

- [ ] **Multiple tabs open**: User upgrades in one tab, verify other tabs show updated plan on refresh
- [ ] **Slow webhook**: Wait 20+ seconds after checkout, verify manual sync kicks in
- [ ] **Invalid Stripe Price ID**: Ensure webhook logs error if database has wrong price ID
- [ ] **Deleted Stripe customer**: Verify graceful error handling if customer deleted in Stripe
- [ ] **Network errors**: Test with throttled connection, verify loading states and error messages

### 6.6 User Experience Testing

- [ ] **Loading states**: All buttons show "Loading..." when processing
- [ ] **Error messages**: User-friendly errors displayed (no raw error objects)
- [ ] **Success messages**: Confirmation messages appear after actions
- [ ] **Mobile responsive**: Test on mobile device (iPhone, Android)
- [ ] **Browser compatibility**: Test on Chrome, Safari, Firefox, Edge

---

## 7. Monitoring & Troubleshooting

### 7.1 Set Up Monitoring

- [ ] **Stripe Dashboard**
  - Monitor daily for failed payments
  - Check webhook delivery status weekly
  - Review subscription churn metrics

- [ ] **Supabase Logs**
  - Check for RLS policy errors
  - Monitor database performance
  - Review API request logs

- [ ] **Vercel Logs** (or your platform)
  - Check for runtime errors
  - Monitor build failures
  - Review function execution logs

- [ ] **AI API Usage**
  - Monitor Anthropic API usage
  - Check for rate limits or quota warnings
  - Review AI analysis quality

### 7.2 Common Issues & Solutions

#### Issue: Webhook not firing
- **Solution**: Check Stripe webhook endpoint URL is correct
- **Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- **Solution**: Check endpoint is publicly accessible (not behind auth)

#### Issue: Subscription not updating after checkout
- **Solution**: Check webhook logs in Stripe dashboard for errors
- **Solution**: Verify `subscription_plans` table has correct LIVE price IDs
- **Solution**: Check Supabase logs for database errors

#### Issue: User has multiple active subscriptions
- **Solution**: This should NOT happen with new code - old subscriptions should be updated, not duplicated
- **Solution**: If it happens, manually cancel duplicate subscriptions in Stripe dashboard
- **Solution**: Review webhook logs to see if update event was processed

#### Issue: Proration not working correctly
- **Solution**: Verify `proration_behavior: 'always_invoice'` in `create-checkout` route
- **Solution**: Check Stripe subscription settings allow proration
- **Solution**: Review invoice in Stripe dashboard

#### Issue: Instagram OAuth fails
- **Solution**: Verify `META_REDIRECT_URI` matches production URL exactly
- **Solution**: Check Meta app is in Live mode
- **Solution**: Ensure user is admin of Facebook Page

### 7.3 Performance Optimization

- [ ] Enable Vercel Edge Functions for critical API routes
- [ ] Optimize database queries with proper indexes
- [ ] Implement rate limiting on API endpoints
- [ ] Add caching for frequently accessed data
- [ ] Monitor and optimize AI API call frequency

---

## 8. Final Production Go-Live Checklist

- [ ] All tests passed (sections 6.1 - 6.6)
- [ ] Webhooks working correctly (section 6.4)
- [ ] Environment variables configured (section 2)
- [ ] Database updated with LIVE price IDs (section 3)
- [ ] Stripe Billing Portal configured (section 1.2)
- [ ] Meta app in Live mode with approved permissions (section 4)
- [ ] Monitoring set up (section 7.1)
- [ ] Backup plan in place (database backups, rollback strategy)
- [ ] Customer support email/chat configured
- [ ] Terms of Service and Privacy Policy pages live
- [ ] SSL certificate valid and HTTPS working
- [ ] DNS configured correctly
- [ ] Marketing site ready (if separate from app)

---

## 9. Post-Launch: First 24 Hours

- [ ] Monitor Stripe dashboard for first real subscriptions
- [ ] Check webhook deliveries every 2-4 hours
- [ ] Respond to any user support requests within 1 hour
- [ ] Review Vercel/hosting logs for errors
- [ ] Monitor Supabase database for anomalies
- [ ] Test subscription flow with a real account (your own card)
- [ ] Celebrate launch! 🎉

---

## 10. Ongoing Maintenance

### Weekly
- [ ] Review failed payments and reach out to customers
- [ ] Check webhook delivery success rate
- [ ] Monitor subscription churn

### Monthly
- [ ] Review AI API costs and optimize if needed
- [ ] Analyze user behavior and conversion rates
- [ ] Update subscription plans pricing if needed
- [ ] Review database performance and optimize queries

### Quarterly
- [ ] Update dependencies (`npm update`)
- [ ] Review security patches
- [ ] Conduct security audit
- [ ] Review and improve documentation

---

## Need Help?

- **Stripe Issues**: [Stripe Support](https://support.stripe.com)
- **Supabase Issues**: [Supabase Discord](https://discord.supabase.com)
- **Meta/Instagram Issues**: [Meta Developer Support](https://developers.facebook.com/support)
- **Vercel Issues**: [Vercel Support](https://vercel.com/support)

---

**Last Updated**: 2025-01-23
**Version**: 1.0
**Maintained by**: ViloAi Team
