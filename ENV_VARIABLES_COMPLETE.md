# Complete Environment Variables Guide

## ✅ All Environment Variables Used in Code

### Required Variables

#### 1. Supabase (Database & Auth)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Used in:**
- `lib/supabase/client.ts` - Client-side Supabase
- `lib/supabase/server.ts` - Server-side Supabase with admin access
- All API routes

#### 2. Stripe (Payments)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Used in:**
- `lib/stripe/client.ts` - Stripe client
- `lib/stripe/server.ts` - Stripe server operations
- `app/api/stripe/webhook/route.ts` - Webhook signature verification
- `app/api/stripe/create-checkout/route.ts` - Create checkout sessions
- `app/api/subscriptions/portal/route.ts` - Customer portal

#### 3. Meta/Instagram (Social Media Integration)
```bash
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback # or your production URL
META_WEBHOOK_VERIFY_TOKEN=viloai_webhook_token # Optional, default provided
```

**Used in:**
- `app/api/auth/instagram/route.ts` - OAuth initiation
- `lib/instagram/client.ts` - Token exchange & API calls
- `app/api/webhooks/instagram/route.ts` - Instagram webhooks

#### 4. AI (Message Analysis)
```bash
# Option A: Anthropic Claude (Recommended)
ANTHROPIC_API_KEY=sk-ant-...

# Option B: OpenAI (Alternative)
OPENAI_API_KEY=sk-...
```

**Note:** You need at least ONE of these

**Used in:**
- `lib/ai/message-analyzer.ts` - Anthropic Claude
- `lib/ai/message-analyzer-openai.ts` - OpenAI GPT
- `app/api/messages/analyze/route.ts` - AI analysis endpoint

#### 5. Application URL
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or https://yourdomain.com for production
```

**Used in:**
- `app/api/stripe/create-checkout/route.ts` - Success/cancel redirect URLs
- `app/api/subscriptions/portal/route.ts` - Return URL
- `app/api/cron/daily-analytics/route.ts` - Internal API calls

### Optional Variables

#### 6. Cron Jobs (Optional - for scheduled tasks)
```bash
CRON_SECRET=your_random_secret_string
```

**Used in:**
- `app/api/analytics/aggregate-daily/route.ts` - Daily analytics aggregation
- `app/api/cron/daily-analytics/route.ts` - Cron job trigger

---

## 🎯 Quick Setup Guide

### For Local Development

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (TEST MODE for local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_... # Get from `stripe listen --forward-to localhost:3000/api/stripe/webhook`

# Meta/Instagram
META_APP_ID=1234567890123456
META_APP_SECRET=abc123def456...
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Vercel Production

**Option 1: Via Vercel CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add META_APP_ID production
vercel env add META_APP_SECRET production
vercel env add META_REDIRECT_URI production
vercel env add ANTHROPIC_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

**Option 2: Via Vercel Dashboard**
1. Go to your project → Settings → Environment Variables
2. Add each variable with its value
3. Select "Production" environment
4. Click "Save"

---

## ⚠️ Critical: Production URL Updates

When deploying to production, **MUST UPDATE** these:

### 1. META_REDIRECT_URI
```bash
# LOCAL
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# PRODUCTION (Update to your domain!)
META_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
```

**Also update in Meta App Settings:**
1. Go to https://developers.facebook.com
2. Select your app
3. Settings → Basic → Valid OAuth Redirect URIs
4. Add: `https://yourdomain.com/api/auth/instagram/callback`

### 2. NEXT_PUBLIC_APP_URL
```bash
# LOCAL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# PRODUCTION (Update to your domain!)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 3. Stripe Keys
```bash
# LOCAL (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# PRODUCTION (Live Mode - IMPORTANT!)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🔍 Environment Variable Checklist

### Before Starting Development
- [ ] All Supabase variables set
- [ ] Stripe TEST keys set
- [ ] Meta app credentials set
- [ ] At least one AI key set (Anthropic or OpenAI)
- [ ] NEXT_PUBLIC_APP_URL = `http://localhost:3000`
- [ ] META_REDIRECT_URI = `http://localhost:3000/api/auth/instagram/callback`

### Before Production Deployment
- [ ] All Supabase variables updated (production project)
- [ ] Stripe LIVE keys set (`pk_live_` and `sk_live_`)
- [ ] NEXT_PUBLIC_APP_URL updated to production domain
- [ ] META_REDIRECT_URI updated to production domain
- [ ] Meta app redirect URI updated in Facebook dashboard
- [ ] Stripe webhook endpoint configured in Stripe dashboard

---

## 🧪 Testing Environment Variables

### Check if all variables are set:
```bash
# Run this in your terminal
node -e "
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'META_APP_ID',
  'META_APP_SECRET',
  'META_REDIRECT_URI',
  'NEXT_PUBLIC_APP_URL'
];

const ai = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'];

console.log('Required Variables:');
required.forEach(key => {
  const value = process.env[key];
  console.log(\`  \${key}: \${value ? '✅ SET' : '❌ MISSING'}\`);
});

console.log('\\nAI Variables (need at least one):');
ai.forEach(key => {
  const value = process.env[key];
  console.log(\`  \${key}: \${value ? '✅ SET' : '❌ MISSING'}\`);
});
" | tail -20
```

Or use the built-in env checker:
```typescript
// lib/env-check.ts already validates all required variables
import { checkEnvVariables } from '@/lib/env-check';
checkEnvVariables(); // Will throw error if any required variable is missing
```

---

## 🚨 Common Issues

### Issue: "Meta app credentials not configured"
**Fix:** Set `META_APP_ID`, `META_APP_SECRET`, and `META_REDIRECT_URI`

### Issue: "You are not an admin of any Facebook Pages"
**Causes:**
1. Missing `business_management` scope
2. User not actually a Page admin
3. Instagram account not connected to Facebook Page

**Fix:**
1. Clear Instagram app permissions on Facebook
2. Reconnect using updated OAuth (includes `business_management` now)
3. Ensure you're a Page admin

### Issue: Stripe subscription not showing after checkout
**Causes:**
1. Webhook not configured
2. `STRIPE_WEBHOOK_SECRET` incorrect
3. `NEXT_PUBLIC_APP_URL` pointing to wrong domain

**Fix:**
1. Configure webhook in Stripe dashboard
2. Use `stripe listen --forward-to` for local testing
3. Verify `NEXT_PUBLIC_APP_URL` matches your actual domain

### Issue: Redirects to localhost from production
**Cause:** `NEXT_PUBLIC_APP_URL` and `META_REDIRECT_URI` still set to localhost

**Fix:** Update to production URLs in Vercel environment variables

---

## 📝 Example .env.local (Complete)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjI4OTYwMCwiZXhwIjoxOTMxODY1NjAwfQ.abc123def456
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2Mjg5NjAwLCJleHAiOjE5MzE4NjU2MDB9.xyz789uvw456

# Stripe (TEST MODE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123XYZ456
STRIPE_SECRET_KEY=sk_test_51ABC123XYZ456
STRIPE_WEBHOOK_SECRET=whsec_abc123def456

# Meta/Instagram
META_APP_ID=1234567890123456
META_APP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
META_WEBHOOK_VERIFY_TOKEN=viloai_webhook_token_12345

# AI (Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-api03-abc123def456

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Cron jobs
CRON_SECRET=my_super_secret_cron_key_12345
```

---

## 🎯 Ready to Deploy Checklist

### Development → Production Changes

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://yourdomain.com` |
| `META_REDIRECT_URI` | `http://localhost:3000/api/auth/instagram/callback` | `https://yourdomain.com/api/auth/instagram/callback` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` | From Stripe Dashboard |

**Everything else stays the same** (Supabase, Meta App ID/Secret, AI keys)

---

Last Updated: 2025-10-22
