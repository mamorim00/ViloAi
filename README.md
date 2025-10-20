# ViloAi - AI-Powered Social Assistant for Finnish Businesses

ViloAi is a full-stack SaaS application that helps small Finnish businesses manage their Instagram direct messages with AI-powered insights, intent analysis, and automated reply suggestions in both Finnish and English.

## Features

- **Instagram Integration**: Connect your Instagram Business account via Meta API
- **AI Message Analysis**: Automatically analyze incoming DMs for intent (price inquiries, availability, location requests)
- **Smart Reply Suggestions**: Get AI-generated professional replies in Finnish and English
- **Analytics Dashboard**: View top followers, message trends, and product interest insights
- **Subscription Management**: Stripe integration for managing user subscriptions
- **Secure Authentication**: Supabase-powered user authentication and data storage

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: Anthropic Claude API (with OpenAI support)
- **Social Media**: Meta/Instagram Graph API

## Project Structure

```
ViloAi/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── instagram/        # Instagram OAuth flow
│   │   ├── messages/
│   │   │   └── sync/              # Message synchronization
│   │   └── stripe/
│   │       └── create-checkout/   # Stripe checkout
│   ├── dashboard/
│   │   ├── messages/              # Message management UI
│   │   └── page.tsx               # Main dashboard
│   ├── login/                     # Login page
│   ├── signup/                    # Signup page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── lib/
│   ├── ai/
│   │   └── message-analyzer.ts   # AI intent analysis
│   ├── instagram/
│   │   └── client.ts              # Instagram API client
│   ├── stripe/
│   │   ├── client.ts              # Stripe client-side
│   │   └── server.ts              # Stripe server-side
│   ├── supabase/
│   │   ├── client.ts              # Supabase client
│   │   └── server.ts              # Supabase admin client
│   └── types.ts                   # TypeScript types
├── supabase/
│   └── schema.sql                 # Database schema
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Stripe account
- A Meta Developer account with Instagram Business API access
- An Anthropic API key (or OpenAI API key)

### 2. Clone and Install

```bash
cd mybot
npm install
```

### 3. Environment Configuration

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Meta/Instagram API
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL to create all tables, indexes, and policies
5. Copy your project URL and keys to `.env.local`

### 5. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create product prices in Stripe for subscriptions
4. Add the keys to `.env.local`

### 6. Meta/Instagram Setup

1. Go to https://developers.facebook.com
2. Create a new app and add Instagram Basic Display and Instagram Messaging products
3. Configure OAuth redirect URIs to include `http://localhost:3000/api/auth/instagram/callback`
4. Add the App ID and App Secret to `.env.local`
5. **Important**: You need an Instagram Business Account connected to a Facebook Page

### 7. AI API Setup

1. Get an Anthropic API key from https://console.anthropic.com
2. Alternatively, get an OpenAI API key from https://platform.openai.com
3. Add the key to `.env.local`

### 8. Run the Application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles with business information and Instagram connection status
- **instagram_messages**: Stored Instagram DMs with AI analysis results
- **message_analytics**: Daily aggregated message statistics
- **follower_insights**: Top follower engagement metrics

All tables have Row Level Security (RLS) enabled for data protection.

## API Routes

### Authentication
- `GET /api/auth/instagram` - Initiate Instagram OAuth
- `GET /api/auth/instagram/callback` - Instagram OAuth callback

### Messages
- `POST /api/messages/sync` - Sync Instagram messages and analyze with AI

### Stripe
- `POST /api/stripe/create-checkout` - Create Stripe checkout session

## Key Features Explained

### Message Intent Analysis

The AI analyzes each Instagram DM to determine:
- **Price Inquiry**: Customer asking about prices
- **Availability**: Questions about product/service availability
- **Location**: Requests for business location/address
- **General Question**: Other information requests
- **Complaint/Compliment**: Customer feedback

### AI Reply Suggestions

For each message, the system generates:
- Professional Finnish reply (Suomi)
- Professional English reply
- Confidence score for intent classification

### Dashboard Analytics

The dashboard shows:
- Total message count
- Breakdown by intent type
- Top engaged followers
- Message trends over time

## Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Lint Code

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## Important Notes

### Instagram API Limitations

- Requires Instagram Business Account
- Must be connected to a Facebook Page
- App needs to be approved by Meta for production use
- Rate limits apply to API calls

### Security Considerations

- Never commit `.env.local` to version control
- Use environment variables for all secrets
- Enable RLS policies in Supabase
- Validate all user inputs
- Keep dependencies updated

## Troubleshooting

### Instagram Connection Issues

- Ensure your Instagram account is a Business account
- Verify the account is linked to a Facebook Page
- Check that redirect URIs are correctly configured
- Confirm the app has the required permissions

### Database Errors

- Verify Supabase credentials are correct
- Ensure RLS policies are properly configured
- Check that the schema was executed successfully

### AI Analysis Not Working

- Confirm your Anthropic API key is valid
- Check API usage limits
- Verify the model name is correct

## Future Enhancements

- [ ] Automated response scheduling
- [ ] Multi-language support beyond Finnish/English
- [ ] WhatsApp integration
- [ ] Email notifications for high-priority messages
- [ ] Advanced analytics with charts
- [ ] Team collaboration features
- [ ] Mobile app

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase, Stripe, and Meta documentation
3. Open an issue in the repository

## License

MIT License - see LICENSE file for details

---

Built with ❤️ for Finnish small businesses
