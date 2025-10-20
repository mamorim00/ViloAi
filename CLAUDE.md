# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ViloAi is a SaaS application that helps Finnish small businesses manage Instagram DMs with AI-powered analysis and automated reply suggestions. It uses Next.js 14 (App Router), Supabase for database/auth, Stripe for payments, Meta/Instagram Graph API for messaging, and Anthropic Claude for AI analysis.

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (check for type errors)
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Setup
Execute `supabase/schema.sql` in the Supabase SQL Editor to create all required tables, RLS policies, triggers, and functions.

## Architecture

### Database Schema & Relationships

The application uses Supabase (PostgreSQL) with four main tables:

1. **profiles**: User accounts with Instagram connection status and Stripe subscription data
   - RLS enabled: users can only access their own profile
   - Auto-created via `handle_new_user()` trigger on auth.users insert
   - Stores `instagram_access_token` (long-lived page access token) and `instagram_user_id`

2. **instagram_messages**: Instagram DMs with AI analysis results
   - RLS enabled: users can only access their own messages
   - Stores AI intent classification (`intent`, `intent_confidence`)
   - Contains bilingual reply suggestions (`ai_reply_suggestion_fi`, `ai_reply_suggestion_en`)
   - `message_id` is unique Instagram message identifier

3. **message_analytics**: Daily aggregated statistics per user
   - RLS enabled: users can only access their own analytics
   - Unique constraint on `(user_id, date)`
   - Tracks counts by intent type (price_inquiries, availability_questions, etc.)

4. **follower_insights**: Top follower engagement metrics
   - RLS enabled: users can only access their own insights
   - Unique constraint on `(user_id, follower_id)`
   - Indexed by `total_engagement_score DESC` for leaderboard queries

All tables have `updated_at` triggers that automatically update timestamps on modification.

### Instagram API Integration Flow

**Authentication Flow:**
1. User clicks "Connect Instagram" → redirects to `/api/auth/instagram`
2. Backend redirects to Meta OAuth with scopes: `instagram_basic`, `instagram_manage_messages`, `pages_show_list`, `business_management`
3. Meta redirects back to `/api/auth/instagram/callback` with code
4. Backend exchanges code for short-lived token
5. Backend exchanges for long-lived token (60 days)
6. Backend fetches Facebook Pages → gets Instagram Business Account ID
7. Stores page access token and IG user ID in profiles table

**Message Sync Flow:**
1. Client calls `POST /api/messages/sync`
2. Backend retrieves long-lived token from profiles
3. Fetches conversations via `/{ig_user_id}/conversations`
4. For each conversation, fetches messages via `/{conversation_id}/messages`
5. For each new message, calls AI analyzer
6. Stores messages with AI analysis in instagram_messages table
7. Updates analytics and follower_insights tables

**Critical Instagram API Details:**
- Uses Instagram Business Account (not Personal), must be connected to Facebook Page
- Uses Page Access Token (not User Access Token) for API calls
- API version: v21.0 (see `lib/instagram/client.ts`)
- All API calls go through `https://graph.facebook.com/v21.0`
- Access tokens are long-lived (60 days) but need refresh mechanism for production

### AI Analysis System

**Message Intent Analysis** (`lib/ai/message-analyzer.ts`):
- Uses Anthropic Claude (`claude-3-5-sonnet-20241022`) by default
- Classifies messages into 7 intent types: `price_inquiry`, `availability`, `location`, `general_question`, `complaint`, `compliment`, `other`
- Returns structured JSON with intent, confidence score (0-1), and bilingual replies
- Fallback responses provided if AI call fails or JSON parsing fails

**Available Analyzers:**
- `lib/ai/message-analyzer.ts` - Anthropic Claude (production)
- `lib/ai/message-analyzer-openai.ts` - OpenAI alternative
- `lib/ai/message-analyzer-mock.ts` - Mock for testing without API calls
- Switch analyzer via `lib/ai/index.ts`

**AI Prompt Structure:**
The analyzer sends the message text and asks for JSON response with specific format. Parses response using regex `/{[\s\S]*}/` to extract JSON block.

### Environment Configuration

Required environment variables (see `.env.example`):
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **AI**: `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)
- **Meta/Instagram**: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- **App**: `NEXT_PUBLIC_APP_URL`

Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that bypass RLS (admin operations).

### TypeScript Types

All shared types are defined in `lib/types.ts`:
- `Profile`, `InstagramMessage`, `MessageAnalytics`, `FollowerInsight` - match database schema
- `MessageIntent` - union type of 7 intent classifications
- `IntentAnalysisResult` - AI analyzer return type

### API Routes Structure

- `app/api/auth/instagram/route.ts` - Initiates Instagram OAuth flow
- `app/api/auth/instagram/callback/route.ts` - Handles OAuth callback, exchanges tokens
- `app/api/messages/sync/route.ts` - Syncs Instagram messages and runs AI analysis
- `app/api/stripe/create-checkout/route.ts` - Creates Stripe checkout session

All API routes use `lib/supabase/server.ts` for authenticated Supabase client and `lib/supabase/admin.ts` pattern for service role operations.

### Frontend Structure

- **App Router**: Uses Next.js 14 App Router (not Pages Router)
- **Layouts**: `app/layout.tsx` is root layout with TailwindCSS
- **Pages**:
  - `/` - Landing page
  - `/login` - Login page (Supabase Auth)
  - `/signup` - Signup page
  - `/dashboard` - Main dashboard with analytics
  - `/dashboard/messages` - Message management UI with reply suggestions
- **UI Libraries**: Uses lucide-react for icons, recharts for charts
- **Styling**: TailwindCSS with config in `tailwind.config.ts`

## Important Development Notes

### Supabase Client Patterns
- **Client components**: Use `lib/supabase/client.ts` (browser-safe)
- **Server components/API routes**: Use `lib/supabase/server.ts` (reads auth cookie)
- **Admin operations**: Create admin client with service role key to bypass RLS

### Instagram API Limitations
- Requires Business account connected to Facebook Page
- User must be Page admin (not just editor)
- App needs Meta approval for production use
- Rate limits apply - implement exponential backoff for sync operations
- Page access tokens expire after 60 days - needs refresh logic

### Row Level Security (RLS)
All tables have RLS enabled. Policies enforce:
- Users can only SELECT/INSERT/UPDATE their own data (WHERE `auth.uid() = user_id`)
- No DELETE policies defined
- Service role key bypasses RLS for admin operations

### Path Aliases
Uses `@/*` alias mapped to root directory (see `tsconfig.json`). Example: `import { analyzeMessageIntent } from '@/lib/ai/message-analyzer'`

### Testing AI Without API Costs
Switch to mock analyzer:
```typescript
// In lib/ai/index.ts or component
import { analyzeMessageIntent } from '@/lib/ai/message-analyzer-mock';
```

### Meta App Configuration
For Instagram Messaging to work:
1. App must have Instagram Messaging product added
2. App must be in Development or Live mode
3. OAuth redirect URI must exactly match `META_REDIRECT_URI` env var
4. Required permissions: `instagram_basic`, `instagram_manage_messages`, `pages_show_list`, `business_management`
5. Test users must have their Instagram accounts connected to a Facebook Page

### Stripe Integration
- Create subscription products in Stripe Dashboard
- Webhook endpoint: `/api/stripe/webhook` (not yet implemented in codebase)
- Store `stripe_customer_id` in profiles table for subscription management

## Common Gotchas

1. **Instagram API returns empty pages list**: User may not be Page admin or missing `pages_show_list` permission
2. **AI analysis fails silently**: Check `ANTHROPIC_API_KEY` is set and valid, fallback responses will be used
3. **RLS policy errors**: Ensure server-side code uses authenticated Supabase client with proper user context
4. **Message sync duplicates**: Check unique constraint on `message_id` in instagram_messages table
5. **Token expiration**: Long-lived tokens last 60 days - implement refresh mechanism before production

## Additional Resources

Refer to setup documentation:
- `README.md` - Full project overview and deployment guide
- `SETUP.md` - Step-by-step setup instructions
- `AI_SETUP.md` - Anthropic API setup details
- `META_APP_SETUP.md` - Meta/Instagram app configuration
- `INSTAGRAM_MESSAGING_SETUP.md` - Instagram Messaging API setup
