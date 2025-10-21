# ViloAi Features

## Overview
ViloAi is an AI-powered SaaS platform designed specifically for Finnish small businesses to manage Instagram Direct Messages with intelligent automation and analytics.

---

## Core Features

### 1. Instagram Integration
- **Business Account Connection**: Seamless OAuth integration with Instagram Business accounts
- **Automatic Message Sync**: Real-time synchronization of Instagram DMs
- **Conversation Management**: View and manage all Instagram conversations in one dashboard
- **Long-lived Access Tokens**: 60-day token management for uninterrupted service

### 2. AI-Powered Message Analysis
- **Intent Classification**: Automatically categorizes messages into 7 intent types:
  - Price Inquiries
  - Availability Questions
  - Location Requests
  - General Questions
  - Complaints
  - Compliments
  - Other
- **Confidence Scoring**: AI provides confidence levels (0-1) for each classification
- **Multi-language Support**: Analyzes messages in both Finnish and English
- **Powered by Open Ai**: Uses Anthropic's Open ai for accurate understanding

### 3. Smart Reply Suggestions
- **Bilingual Responses**: Auto-generates professional replies in both Finnish and English
- **Context-Aware**: Replies tailored to message intent and content
- **Language Detection**: Automatically detects customer's language preference
- **Professional Tone**: Maintains business-appropriate communication style

### 4. Analytics & Insights Dashboard
- **Real-time Statistics**: Track key metrics at a glance
  - Total messages received
  - Price inquiries count
  - Availability questions
  - Location requests
- **Message Trends**: Visualize message patterns over time
- **Intent Distribution**: See breakdown of customer inquiry types
- **Daily Aggregation**: Automated daily analytics compilation

### 5. Follower Insights
- **Top Followers Leaderboard**: Identify most engaged customers
- **Engagement Scoring**: Track follower interaction levels
- **Message Count Tracking**: Monitor conversation frequency per follower
- **Customer Intelligence**: Understand who your most valuable followers are

### 6. Subscription Management
- **Flexible Plans**: 4 tier structure (Free, Basic, Premium, Enterprise)
- **Usage Tracking**: Real-time message quota monitoring
- **Visual Usage Indicators**: Progress bars and warnings for approaching limits
- **Stripe Integration**: Secure payment processing
- **Customer Portal**: Self-service subscription management

### 7. Onboarding Experience
- **Guided Setup Flow**: Step-by-step onboarding for new users
- **Progress Tracking**: Visual checklist showing completion status
- **Interactive Tutorials**: Help users get started quickly
- **Onboarding Steps**:
  1. Account creation and business info
  2. Plan selection
  3. Instagram account connection
  4. First message sync

### 8. Multi-language Interface
- **Finnish & English**: Full application available in both languages
- **Language Toggle**: Easy switching between languages
- **Localized Content**: All UI elements, messages, and documentation translated
- **Cultural Adaptation**: Tailored specifically for Finnish business context

### 9. Message Management
- **Message History**: Complete archive of all Instagram DMs
- **Reply Status Tracking**: Mark messages as replied/pending
- **Search & Filter**: Find specific messages or conversation types
- **Recent Messages View**: Quick access to latest conversations

### 10. Business Rules (Advanced)
- **Custom Automation**: Define business-specific rules for message handling
- **Rule Management API**: Create, update, and delete automation rules
- **Condition-based Actions**: Trigger specific responses based on message content

---

## Subscription Tiers

### Free Plan (14-Day Trial)
- 50 messages/month
- AI message analysis
- Basic reply suggestions
- Email support

### Basic Plan
- 500 messages/month
- AI message analysis
- Bilingual reply suggestions
- Business rules
- Basic analytics
- Email support

### Premium Plan (Most Popular)
- 2,000 messages/month
- AI message analysis
- Bilingual reply suggestions
- Business rules
- Advanced analytics
- Follower insights
- Priority support

### Enterprise Plan
- Unlimited messages
- All Premium features
- API access
- Custom integrations
- Dedicated support

---

## Technical Features

### Security & Privacy
- **Row Level Security (RLS)**: Database-level user isolation
- **Supabase Authentication**: Secure user authentication and session management
- **Token Encryption**: Secure storage of Instagram access tokens
- **GDPR Compliance**: User data protection and privacy controls

### Performance
- **Optimized Database**: Indexed queries for fast data retrieval
- **Caching Strategy**: Efficient data loading and synchronization
- **Background Sync**: Non-blocking message synchronization
- **Responsive UI**: Fast, modern React-based interface

### Integration APIs
- **Instagram Graph API**: v21.0 integration for messaging
- **Stripe API**: Payment and subscription management
- **Anthropic API**: Claude AI for message analysis
- **Supabase APIs**: Database, auth, and real-time features

### Developer Features
- **RESTful API**: Clean API endpoints for all operations
- **TypeScript**: Fully typed codebase for reliability
- **Next.js 14**: Modern app router architecture
- **Webhook Support**: Stripe webhook integration for payment events

---

## User Experience Features

### Dashboard
- Clean, intuitive interface
- Real-time data updates
- Mobile-responsive design
- Quick actions and shortcuts

### Notifications & Alerts
- Usage limit warnings (80% threshold)
- Over-limit notifications
- Subscription expiry alerts
- Connection status indicators

### Support & Documentation
- Comprehensive setup guides
- Instagram API integration docs
- Troubleshooting resources
- Multi-channel support (email, priority)

---

## Coming Soon / Roadmap Ideas
- Automated reply sending (one-click)
- Message templates library
- Scheduled message responses
- Sentiment analysis
- Product catalog integration
- Multi-account management
- Mobile app (iOS/Android)
- WhatsApp integration
- Advanced reporting & exports
- Team collaboration features

---

## Target Market
- Finnish small businesses
- Instagram-based businesses
- E-commerce sellers on Instagram
- Service providers using Instagram DMs
- Retail shops with Instagram presence
- Local businesses engaging customers via social media

---

Last Updated: January 2025
