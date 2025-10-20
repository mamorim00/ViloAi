# ViloAi Quick Setup Guide

## Prerequisites Checklist

Before you begin, make sure you have:

- [ x] Node.js 18+ installed
- [ x] A Supabase account ([Sign up here](https://supabase.com))
- [x] A Stripe account ([Sign up here](https://stripe.com))
- [ x] A Meta Developer account ([Sign up here](https://developers.facebook.com))
- [ ] An Anthropic API key ([Get one here](https://console.anthropic.com))
- [ x] An Instagram Business account connected to a Facebook Page

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL in the editor
5. Go to **Settings** → **API** to get your credentials:
   - Copy the **Project URL**
   - Copy the **anon public** key
   - Copy the **service_role** key (keep this secret!)

### 3. Configure Stripe

1. Go to https://dashboard.stripe.com
2. Get your **Publishable key** and **Secret key** from the Developers section
3. (Optional) Set up webhook endpoint for `/api/stripe/webhook`
4. Create subscription products/prices in Stripe dashboard

### 4. Configure Meta/Instagram API

1. Go to https://developers.facebook.com/apps
2. Create a new app → Choose "Business" type
3. Add **Instagram Basic Display** product
4. Add **Instagram Messaging** product (requires Business verification)
5. Configure OAuth Redirect URIs:
   - Add: `http://localhost:3000/api/auth/instagram/callback`
   - Add: `https://yourdomain.com/api/auth/instagram/callback` (for production)
6. Get your **App ID** and **App Secret**

**Important Instagram Requirements:**
- Your Instagram account MUST be a Business account
- It must be connected to a Facebook Page
- For production, your Meta app needs to be approved

### 5. Get AI API Key

Choose one:

**Option A: Anthropic (Recommended for this project)**
1. Go to https://console.anthropic.com
2. Create an API key
3. Add to ANTHROPIC_API_KEY in .env.local

**Option B: OpenAI**
1. Go to https://platform.openai.com
2. Create an API key
3. Add to OPENAI_API_KEY in .env.local
4. Update `lib/ai/message-analyzer.ts` to use OpenAI

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all values in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Meta/Instagram
META_APP_ID=1234567890
META_APP_SECRET=abc123...
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run the Application

Development mode:
```bash
npm run dev
```

Open http://localhost:3000 in your browser

Build for production:
```bash
npm run build
npm start
```

## Testing the App

1. **Sign Up**: Create a new account at `/signup`
2. **Connect Instagram**: Click "Connect Instagram" in the dashboard
3. **Authorize**: Grant permissions to your Instagram Business account
4. **Sync Messages**: Click the "Sync" button to fetch Instagram DMs
5. **View Analysis**: Check the dashboard for AI insights and message analysis
6. **Reply Suggestions**: Go to "Messages" to see Finnish and English reply suggestions

## Common Issues

### Instagram Connection Fails
- Verify your Instagram account is a Business account
- Ensure it's connected to a Facebook Page
- Check that OAuth redirect URI matches exactly
- Confirm app has required permissions

### Supabase Errors
- Double-check all environment variables
- Ensure SQL schema was executed successfully
- Verify RLS policies are enabled

### AI Analysis Not Working
- Confirm API key is correct and has credits
- Check rate limits on your AI provider
- Review error logs in the console

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

## Next Steps

After successful setup:

1. **Customize Branding**: Update colors, logo, and text in the landing page
2. **Configure Stripe Products**: Set up your subscription tiers
3. **Test Message Sync**: Connect a test Instagram account
4. **Deploy to Production**: Use Vercel, Netlify, or your preferred platform
5. **Set Up Meta App Review**: Submit for production Instagram API access

## Production Deployment

### Environment Variables
Make sure to set all environment variables in your hosting platform:
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Update `META_REDIRECT_URI` to your production callback URL
- Use production API keys (not test keys)

### Meta App Review
Before going live:
1. Submit your Meta app for review
2. Request required permissions (instagram_basic, instagram_manage_messages)
3. Provide test credentials and use case explanation
4. Wait for approval (can take several days)

## Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Meta Instagram API](https://developers.facebook.com/docs/instagram-api)
- [Anthropic Documentation](https://docs.anthropic.com)

## Need Help?

If you encounter issues:
1. Check the troubleshooting section in README.md
2. Review the API documentation for each service
3. Check the browser console for error messages
4. Verify all environment variables are set correctly

---

**Good luck building with ViloAi!** 🚀
