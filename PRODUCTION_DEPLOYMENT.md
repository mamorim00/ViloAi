# Production Deployment Checklist

## Pre-Deployment Checklist

### 1. ✅ Environment Variables

**Critical**: Update all environment variables for production:

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key

#### Stripe (IMPORTANT!)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Change from `pk_test_...` to `pk_live_...`
- [ ] `STRIPE_SECRET_KEY` - Change from `sk_test_...` to `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` - Get from production webhook endpoint

#### AI
- [ ] `ANTHROPIC_API_KEY` - Verify API key is active and has credits

#### Meta/Instagram
- [ ] `META_APP_ID` - Your production Meta app ID
- [ ] `META_APP_SECRET` - Your production Meta app secret
- [ ] `META_REDIRECT_URI` - Update to `https://yourdomain.com/api/auth/instagram/callback`

#### Application
- [ ] `NEXT_PUBLIC_APP_URL` - Update to `https://yourdomain.com`

### 2. ✅ Stripe Production Setup

#### 2.1 Switch to Live Mode
1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle from "Test Mode" to "Live Mode" (top right)
3. Copy live API keys (not test keys)

#### 2.2 Create Subscription Products
1. Navigate to **Products** in Stripe Dashboard
2. Create your subscription plans:
   - **Free Plan** (if applicable)
   - **Growth Plan** ($29/month or your pricing)
   - **Pro Plan** ($99/month or your pricing)
3. Copy each **Price ID** (starts with `price_...`)
4. Update in Supabase `subscription_plans` table

#### 2.3 Configure Webhook
1. Go to **Developers → Webhooks** in Stripe
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copy **Signing secret** (starts with `whsec_...`)
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. ✅ Supabase Production Setup

#### 3.1 Update Subscription Plans Table
```sql
-- Run in Supabase SQL Editor
INSERT INTO subscription_plans (name, display_name, price_per_month, stripe_price_id, features, message_limit, is_active)
VALUES
  ('free', 'Free', 0, NULL, '{"basic_features": true}', 50, true),
  ('growth', 'Growth', 29, 'price_YOUR_GROWTH_PRICE_ID', '{"ai_replies": true, "priority_support": true}', 500, true),
  ('pro', 'Pro', 99, 'price_YOUR_PRO_PRICE_ID', '{"unlimited_ai": true, "white_label": true, "priority_support": true}', NULL, true)
ON CONFLICT (name) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_per_month = EXCLUDED.price_per_month;
```

Replace `price_YOUR_GROWTH_PRICE_ID` and `price_YOUR_PRO_PRICE_ID` with actual Stripe Price IDs.

#### 3.2 Verify Database Schema
```bash
# Check that all tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

# Should see:
# - profiles
# - instagram_messages
# - instagram_comments
# - message_analytics
# - follower_insights
# - auto_reply_queue
# - automation_rules
# - business_rules
# - auto_reply_logs
# - subscription_plans
```

#### 3.3 RLS Policies Check
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Should show all main tables with rowsecurity = true
```

### 4. ✅ Meta/Instagram Production App

#### 4.1 App Review (Required for Production)
1. Login to [Meta for Developers](https://developers.facebook.com)
2. Select your app
3. Request permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `business_management`
4. Complete App Review process (may take 1-2 weeks)

#### 4.2 Update OAuth Redirect URI
1. Go to **App Settings → Basic**
2. Update **Valid OAuth Redirect URIs**:
   - Add: `https://yourdomain.com/api/auth/instagram/callback`
   - Remove localhost URLs for production

#### 4.3 Switch App Mode
1. In Meta App Dashboard
2. Switch from "Development" to "Live" mode
3. Verify all permissions are active

### 5. ✅ Code Review

#### 5.1 Remove Development Code
- [ ] No `console.log` with sensitive data
- [ ] No hardcoded API keys or secrets
- [ ] No test/mock data in production code

#### 5.2 Security Check
- [ ] All API routes use authentication
- [ ] RLS policies are enabled
- [ ] Service role key only used on server-side
- [ ] No CORS issues (proper domain configured)

#### 5.3 Performance Check
- [ ] Caching enabled (message caching)
- [ ] Lazy loading implemented (AI analysis)
- [ ] Optimistic updates working
- [ ] No unnecessary API calls

### 6. ✅ Testing Before Deployment

```bash
# 1. Build production version locally
npm run build

# 2. Check for errors
# Should see: ✓ Compiled successfully

# 3. Test production build locally
npm run start

# 4. Test critical flows:
# - Signup → Dashboard
# - Instagram connection
# - Message sync
# - AI analysis
# - Stripe checkout (use test mode first)
# - Quick reply
```

### 7. ✅ Deployment to Vercel (Recommended)

#### 7.1 Initial Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

#### 7.2 Set Environment Variables
```bash
# Set all production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add ANTHROPIC_API_KEY production
vercel env add META_APP_ID production
vercel env add META_APP_SECRET production
vercel env add META_REDIRECT_URI production
vercel env add NEXT_PUBLIC_APP_URL production
```

#### 7.3 Deploy
```bash
# Deploy to production
vercel --prod

# Expected output:
# ✓ Production deployment ready
# 🔗 https://your-project.vercel.app
```

### 8. ✅ Post-Deployment Verification

#### 8.1 Test Production App
1. **Signup Flow**
   - [ ] Create new account
   - [ ] Verify email (if email confirmation enabled)
   - [ ] Profile created in database
   - [ ] Redirected to dashboard

2. **Stripe Subscription**
   - [ ] Click "View Plans"
   - [ ] Complete checkout with REAL card (small amount)
   - [ ] Verify webhook fires
   - [ ] Subscription shows in dashboard
   - [ ] Database updated correctly

3. **Instagram Connection**
   - [ ] Connect Instagram Business account
   - [ ] OAuth redirect works
   - [ ] Token saved to database
   - [ ] Connection status shows correctly

4. **Message Sync**
   - [ ] Click "Sync Messages"
   - [ ] Messages fetched from Instagram
   - [ ] AI analysis works
   - [ ] Suggestions generated
   - [ ] Cache working

5. **Quick Reply**
   - [ ] Click Reply button
   - [ ] AI suggestion pre-filled
   - [ ] Send reply
   - [ ] Reply appears on Instagram
   - [ ] Database updated

#### 8.2 Monitor Errors
```bash
# Check Vercel logs
vercel logs

# Check for:
# - 500 errors
# - Failed API calls
# - Authentication issues
# - Database connection errors
```

#### 8.3 Performance Check
1. Open Chrome DevTools
2. Check **Network** tab:
   - [ ] Caching working (instant loads)
   - [ ] No unnecessary API calls
   - [ ] Filters switching instantly
3. Check **Performance** tab:
   - [ ] First load < 3 seconds
   - [ ] Cached loads < 500ms

### 9. ✅ Stripe Live Mode Testing

⚠️ **IMPORTANT**: Test with real card but use refund immediately after testing

#### Test Checklist
1. [ ] Checkout flow works
2. [ ] Webhook fires immediately (check logs)
3. [ ] Subscription shows in dashboard within 5 seconds
4. [ ] Database updated correctly
5. [ ] User can access paid features
6. [ ] Refund test payment in Stripe dashboard

### 10. ✅ Monitoring Setup

#### 10.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor:
   - Page views
   - Response times
   - Error rates

#### 10.2 Sentry (Optional)
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Add DSN to environment variables
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

#### 10.3 Supabase Monitoring
1. Open Supabase dashboard
2. Check **Database → Usage**:
   - [ ] Connection pooling enabled
   - [ ] No connection leaks
3. Check **Logs**:
   - [ ] No RLS policy violations
   - [ ] No authentication errors

### 11. ✅ Backup & Recovery

#### 11.1 Database Backup
```sql
-- Enable automatic backups in Supabase
-- Settings → Database → Backups

-- Manual backup (run locally)
pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
```

#### 11.2 Environment Variables Backup
```bash
# Save all environment variables to secure location
vercel env pull .env.production
# Store .env.production in password manager (NOT in git)
```

## Post-Launch Checklist

### Week 1
- [ ] Monitor error rates daily
- [ ] Check Stripe webhook success rate
- [ ] Verify all user signups successful
- [ ] Monitor Instagram API rate limits
- [ ] Check AI API usage and costs

### Week 2-4
- [ ] Review user feedback
- [ ] Optimize slow queries (if any)
- [ ] Adjust cache TTL if needed
- [ ] Monitor subscription conversion rate

### Month 2+
- [ ] Review and adjust pricing
- [ ] Add new features based on feedback
- [ ] Optimize AI prompts for better suggestions
- [ ] Implement automatic Instagram token refresh

## Common Production Issues & Solutions

### Issue: Stripe webhook not firing
**Solution**:
1. Check webhook URL is correct
2. Verify endpoint is publicly accessible
3. Check Stripe logs for errors
4. Use `stripe listen --forward-to` for testing

### Issue: Instagram OAuth fails
**Solution**:
1. Verify redirect URI matches exactly
2. Check Meta app is in Live mode
3. Verify all permissions approved
4. Check user is Page admin

### Issue: Signup errors
**Solution**:
1. Check database trigger exists
2. Verify RLS policies allow insert
3. Look for profile creation errors in logs
4. Use retry logic (already implemented)

### Issue: AI suggestions not generating
**Solution**:
1. Verify Anthropic API key valid
2. Check API usage limits not exceeded
3. Monitor API response times
4. Implement fallback responses

### Issue: Cache not working
**Solution**:
1. Check localStorage enabled in production
2. Verify Zustand store persisting
3. Clear cache and test again
4. Check for console errors

## Rollback Plan

If critical issues found in production:

```bash
# Option 1: Rollback to previous deployment
vercel rollback

# Option 2: Redeploy previous git commit
git log # find previous commit
git revert <commit-hash>
git push origin main
vercel --prod

# Option 3: Emergency maintenance mode
# Create pages/maintenance.tsx with message
# Deploy immediately
```

## Support & Monitoring

### Daily Checks (First Month)
- [ ] Vercel error logs
- [ ] Supabase error logs
- [ ] Stripe webhook delivery status
- [ ] User signup success rate
- [ ] Instagram API errors

### Weekly Checks
- [ ] User feedback and support tickets
- [ ] Performance metrics
- [ ] Cost monitoring (API usage)
- [ ] Subscription analytics
- [ ] Feature usage tracking

---

## Quick Reference

### Important URLs
- **Production App**: https://yourdomain.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Meta Developers**: https://developers.facebook.com

### Emergency Contacts
- Vercel Support: support@vercel.com
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Version**: _____________
**Status**: ✅ SUCCESS / ❌ ISSUES / 🔄 IN PROGRESS
