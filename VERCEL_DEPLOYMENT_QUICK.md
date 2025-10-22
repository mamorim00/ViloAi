# Quick Vercel Deployment Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Push to GitHub (Already Done ✅)
Your code is already pushed to: `https://github.com/mamorim00/ViloAi`

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import" next to your `ViloAi` repository
3. Click "Import" again
4. **DO NOT deploy yet** - need to add environment variables first

### Step 3: Add Environment Variables

In Vercel project settings, add these variables:

#### Required Variables:

```bash
# 1. Supabase (same as local)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Stripe - USE LIVE KEYS FOR PRODUCTION!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... # NOT pk_test_!
STRIPE_SECRET_KEY=sk_live_... # NOT sk_test_!
STRIPE_WEBHOOK_SECRET=whsec_... # Will configure later

# 3. Meta/Instagram (same as local)
META_APP_ID=1234567890123456
META_APP_SECRET=abc123...
META_REDIRECT_URI=https://YOUR_VERCEL_URL.vercel.app/api/auth/instagram/callback # UPDATE!
META_WEBHOOK_VERIFY_TOKEN=viloai_webhook_token

# 4. AI (same as local)
ANTHROPIC_API_KEY=sk-ant-api03-...

# 5. App URL - CRITICAL!
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_URL.vercel.app # UPDATE!
```

### Step 4: Get Your Vercel URL

After adding environment variables:
1. Click "Deploy"
2. Wait for deployment to complete
3. Click "Visit" to get your URL
4. Copy the URL (e.g., `https://vilo-ai-xyz123.vercel.app`)

### Step 5: Update Environment Variables with Vercel URL

Go back to Settings → Environment Variables and update:

```bash
# Update these two variables:
NEXT_PUBLIC_APP_URL=https://your-actual-vercel-url.vercel.app
META_REDIRECT_URI=https://your-actual-vercel-url.vercel.app/api/auth/instagram/callback
```

Then click "Redeploy" to apply changes.

### Step 6: Update Meta App Settings

1. Go to https://developers.facebook.com
2. Select your ViloAi app
3. Settings → Basic
4. Find "Valid OAuth Redirect URIs"
5. Add: `https://your-vercel-url.vercel.app/api/auth/instagram/callback`
6. Click "Save Changes"

### Step 7: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com
2. Make sure you're in **LIVE MODE** (toggle top right)
3. Go to Developers → Webhooks
4. Click "Add endpoint"
5. Endpoint URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
6. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
7. Click "Add endpoint"
8. Copy the "Signing secret" (starts with `whsec_`)
9. Go back to Vercel → Settings → Environment Variables
10. Update `STRIPE_WEBHOOK_SECRET` with the new value
11. Redeploy

### Step 8: Update Stripe Products

In Supabase, update subscription plans with LIVE price IDs:

```sql
-- In Supabase SQL Editor
UPDATE subscription_plans
SET stripe_price_id = 'price_YOUR_LIVE_GROWTH_PRICE_ID'
WHERE name = 'growth';

UPDATE subscription_plans
SET stripe_price_id = 'price_YOUR_LIVE_PRO_PRICE_ID'
WHERE name = 'pro';
```

Get Price IDs from Stripe Dashboard → Products → [Your Product] → Pricing

---

## ✅ Verification Checklist

After deployment, test:

- [ ] Visit your Vercel URL - homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Click "View Plans" - redirects to pricing
- [ ] Click "Get Started" - goes to Stripe checkout
- [ ] Complete checkout - redirects back to dashboard (NOT localhost!)
- [ ] Subscription shows in dashboard within 20 seconds
- [ ] Click "Connect Instagram" - OAuth works
- [ ] Instagram connection successful
- [ ] Message sync works

---

## 🐛 Common Issues

### Issue: Redirects to localhost after Stripe checkout
**Cause:** `NEXT_PUBLIC_APP_URL` still set to `http://localhost:3000`
**Fix:** Update to your Vercel URL and redeploy

### Issue: "Invalid OAuth redirect URI" from Meta
**Cause:** `META_REDIRECT_URI` doesn't match what's in Meta app settings
**Fix:**
1. Check exact URL in Meta app settings
2. Ensure environment variable matches exactly
3. Redeploy

### Issue: Stripe webhook not firing
**Cause:** Webhook not configured or wrong secret
**Fix:**
1. Configure webhook in Stripe dashboard (Live mode!)
2. Copy signing secret
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel
4. Redeploy

### Issue: Subscription not showing after checkout
**Causes:**
1. Using test mode keys in production
2. Webhook secret incorrect
3. Polling not working

**Fix:**
1. Verify using LIVE keys (`pk_live_`, `sk_live_`)
2. Check webhook secret is correct
3. Wait up to 20 seconds (polling will catch it)
4. Check Vercel logs for errors

---

## 📋 Quick Command Reference

```bash
# Check Vercel deployment logs
vercel logs

# Redeploy after env var changes
vercel --prod

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.production
```

---

## 🎯 Final Checklist Before Go-Live

- [ ] All environment variables set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` = your Vercel URL (NOT localhost)
- [ ] `META_REDIRECT_URI` = your Vercel URL + callback path
- [ ] Stripe using LIVE keys (`pk_live_`, `sk_live_`)
- [ ] Stripe webhook configured with Vercel URL
- [ ] `STRIPE_WEBHOOK_SECRET` updated from Live webhook
- [ ] Meta app redirect URI includes Vercel URL
- [ ] Supabase subscription_plans has LIVE price IDs
- [ ] Tested complete signup → subscription → Instagram flow

---

**Estimated Time:** 15-20 minutes
**Difficulty:** Easy (if following steps exactly)

Need help? Check `ENV_VARIABLES_COMPLETE.md` for detailed variable explanations.
