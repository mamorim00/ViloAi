# Production Testing Checklist

## Pre-Deployment Checks

### 1. Environment Variables
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL (not localhost)
- [ ] `META_REDIRECT_URI` set to production URL + `/api/auth/instagram/callback`
- [ ] Stripe keys are LIVE keys (`pk_live_...`, `sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` is from LIVE webhook
- [ ] `ANTHROPIC_API_KEY` is valid
- [ ] Supabase URLs and keys are correct

### 2. Database Setup
- [ ] Run migration: `UPDATE_STRIPE_PRICE_IDS.sql` with LIVE Price IDs
- [ ] Run migration: `011_add_archived_at.sql`
- [ ] Verify subscription_plans table has LIVE Stripe Price IDs
- [ ] Test Supabase connection from production

### 3. External Services
- [ ] Meta App: Add production URL to Valid OAuth Redirect URIs
- [ ] Stripe: Configure webhook endpoint with production URL
- [ ] Stripe: Verify LIVE products and prices exist

### 4. Build Test
- [ ] Run `npm run build` - check for errors
- [ ] Fix any TypeScript errors
- [ ] Fix any ESLint warnings
- [ ] Test `npm run start` locally

---

## Post-Deployment Tests

### Authentication & Onboarding
- [ ] **Signup Flow**
  - [ ] Create new account
  - [ ] Verify email validation works
  - [ ] Check profile created in database
  - [ ] Onboarding flow appears

- [ ] **Login Flow**
  - [ ] Login with existing account
  - [ ] Logout works
  - [ ] Session persists on refresh

---

### Subscription & Billing

- [ ] **View Plans Page**
  - [ ] All plans display correctly
  - [ ] Prices show in correct currency (€)
  - [ ] Feature lists are accurate

- [ ] **Subscribe to Basic Plan**
  - [ ] Click "Get Started" on Basic plan
  - [ ] Redirects to Stripe checkout (LIVE mode!)
  - [ ] Complete payment with test card: `4242 4242 4242 4242`
  - [ ] Redirects back to dashboard (NOT localhost!)
  - [ ] Subscription shows as "Basic" within 20 seconds
  - [ ] Check Supabase: subscription_plan_id updated
  - [ ] Check Supabase: subscription_tier = 'basic'
  - [ ] Check Supabase: subscription_status = 'active'

- [ ] **Upgrade Subscription**
  - [ ] Go to Settings → Subscription
  - [ ] Click "Upgrade to Premium"
  - [ ] Complete Stripe checkout
  - [ ] Old subscription is canceled automatically
  - [ ] New subscription shows as "Premium"
  - [ ] Only ONE active subscription in Stripe

- [ ] **Manage Subscription (Billing Portal)**
  - [ ] Click "Manage Subscription" button
  - [ ] Opens Stripe Billing Portal
  - [ ] Can view invoices
  - [ ] Can update payment method
  - [ ] Can cancel subscription
  - [ ] After cancel: downgrades to Free plan

- [ ] **Usage Limits**
  - [ ] Dashboard shows current usage
  - [ ] Free plan: 50 messages limit shown
  - [ ] Basic plan: 500 messages limit shown
  - [ ] Premium plan: 2000 messages limit shown
  - [ ] Enterprise plan: "Unlimited" shown

---

### Instagram Integration

- [ ] **Connect Instagram**
  - [ ] Click "Connect Instagram"
  - [ ] Redirects to Meta OAuth
  - [ ] Asks for ALL required permissions:
    - pages_show_list
    - pages_read_engagement
    - business_management
    - instagram_basic
    - instagram_manage_messages
    - instagram_manage_comments
  - [ ] Can select Facebook Page
  - [ ] Redirects back to dashboard
  - [ ] Shows "Instagram Connected" status
  - [ ] Check database: instagram_connected = true

- [ ] **Sync Messages**
  - [ ] Click "Sync Messages"
  - [ ] Shows loading state
  - [ ] Fetches DMs and comments
  - [ ] Messages appear in inbox (under 10 seconds)
  - [ ] No duplicate messages on second sync

- [ ] **Disconnect Instagram**
  - [ ] Click "Disconnect"
  - [ ] Confirms disconnection
  - [ ] Status changes to "Not Connected"
  - [ ] Check database: instagram_connected = false

---

### Message Management

- [ ] **View Messages**
  - [ ] Dashboard shows unanswered messages only
  - [ ] Messages page shows all messages
  - [ ] Filter by: All, Leads, Pending, Unanswered, Answered
  - [ ] Filters work correctly

- [ ] **AI Analysis**
  - [ ] Finnish messages show Finnish suggestions
  - [ ] English messages show English suggestions
  - [ ] Intent classification is accurate
  - [ ] Confidence scores display
  - [ ] Language detection badge shows correct language

- [ ] **Reply to Message**
  - [ ] Click "Reply" button
  - [ ] AI suggestion pre-fills reply box
  - [ ] Can edit reply text
  - [ ] Send reply successfully
  - [ ] Message sent to Instagram
  - [ ] Message marked as "Replied" in UI
  - [ ] Reply text shown in message card

- [ ] **Add to Pending**
  - [ ] Click "Add to Pending"
  - [ ] Message moves to Pending Approval
  - [ ] Shows in "Pending" filter
  - [ ] Can approve from pending
  - [ ] Can edit before approving
  - [ ] Can reject from pending

- [ ] **Ignore Message**
  - [ ] Click "Ignore" button
  - [ ] Message disappears from inbox
  - [ ] Message marked as archived in database
  - [ ] Does not appear in sync again

---

### Analytics & Insights

- [ ] **Dashboard Stats**
  - [ ] Total messages count correct
  - [ ] Leads count accurate
  - [ ] Pending count accurate
  - [ ] Unanswered count accurate
  - [ ] Answered count accurate

- [ ] **Analytics Page**
  - [ ] Charts load correctly
  - [ ] Data is accurate
  - [ ] Date filters work
  - [ ] Export functionality (if implemented)

---

### Automation (if applicable)

- [ ] **Automation Rules**
  - [ ] Can create new rule
  - [ ] Can edit existing rule
  - [ ] Can delete rule
  - [ ] Can enable/disable rule
  - [ ] Auto-replies work for DMs
  - [ ] Auto-replies work for comments

---

### Performance & UX

- [ ] **Page Load Times**
  - [ ] Homepage loads < 2 seconds
  - [ ] Dashboard loads < 3 seconds
  - [ ] Messages page loads < 3 seconds
  - [ ] No console errors in browser

- [ ] **Caching**
  - [ ] Inbox loads instantly from cache
  - [ ] Manual refresh updates data
  - [ ] Realtime updates work (new messages appear)

- [ ] **Mobile Responsiveness**
  - [ ] Dashboard works on mobile
  - [ ] Messages readable on small screens
  - [ ] Buttons are tappable
  - [ ] No horizontal scroll

---

### Error Handling

- [ ] **Network Errors**
  - [ ] Offline: Shows error message
  - [ ] API timeout: Shows error message
  - [ ] Retry functionality works

- [ ] **User Errors**
  - [ ] Invalid login: Shows error
  - [ ] Duplicate signup: Shows error
  - [ ] Missing required fields: Shows validation
  - [ ] Payment fails: Shows error message

- [ ] **Rate Limiting**
  - [ ] Exceeds message limit: Shows upgrade prompt
  - [ ] Trial expired: Shows subscribe prompt

---

### Security

- [ ] **Authentication**
  - [ ] Can't access dashboard when logged out
  - [ ] Redirects to login page
  - [ ] Protected routes work
  - [ ] RLS policies enforced (can only see own data)

- [ ] **API Security**
  - [ ] API routes require authentication
  - [ ] Can't access other users' data
  - [ ] Webhooks verify signatures

---

### Multi-Language Support

- [ ] **Finnish Language**
  - [ ] Can switch to Finnish
  - [ ] All UI text translates
  - [ ] Finnish messages get Finnish replies
  - [ ] Dashboard text in Finnish

- [ ] **English Language**
  - [ ] Can switch to English
  - [ ] All UI text translates
  - [ ] English messages get English replies

---

## Critical Production Issues to Watch

### Issue 1: Localhost Redirects
**Symptom:** After Stripe checkout, redirects to `localhost:3000`
**Cause:** `NEXT_PUBLIC_APP_URL` not updated
**Fix:** Update env var to production URL and redeploy

### Issue 2: Subscription Not Updating
**Symptom:** Payment succeeds but tier stays "free"
**Cause:** Stripe Price IDs don't match database
**Fix:** Update subscription_plans table with LIVE Price IDs

### Issue 3: Multiple Active Subscriptions
**Symptom:** User has 3+ active subscriptions
**Cause:** Creating new subscription without canceling old one
**Fix:** Implement upgrade flow that cancels old subscription (see below)

### Issue 4: Instagram OAuth Fails
**Symptom:** "Not admin of any pages"
**Cause:** Missing permissions or wrong redirect URI
**Fix:** Add all scopes + update Meta app settings

### Issue 5: Messages Not Syncing
**Symptom:** No messages appear after sync
**Cause:** Instagram token expired or invalid
**Fix:** Reconnect Instagram account

---

## Quick Smoke Test (5 minutes)

After deployment, run this quick test:

1. ✅ Sign up → Works
2. ✅ Subscribe to Basic → Shows "Basic" plan
3. ✅ Connect Instagram → Shows "Connected"
4. ✅ Sync Messages → Messages appear
5. ✅ Reply to message → Sends successfully
6. ✅ Check Stripe Dashboard → 1 active subscription only

If all 6 pass → Production is good! 🚀

---

## Rollback Plan

If critical issues found in production:

1. **Quick Fix:** Update environment variables → Redeploy
2. **Rollback:** Revert to previous deployment in Vercel
3. **Emergency:** Disable signup to prevent new users

---

## Post-Launch Monitoring

### Week 1:
- [ ] Check error logs daily
- [ ] Monitor Stripe webhooks (failures?)
- [ ] Check Supabase usage
- [ ] Monitor AI API costs
- [ ] Watch for user feedback

### Week 2-4:
- [ ] Review subscription churn
- [ ] Check message sync reliability
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Plan next features

---

**Good luck with the launch! 🚀**
