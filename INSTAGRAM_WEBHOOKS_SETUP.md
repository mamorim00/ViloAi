# Instagram Webhooks Setup Guide

This guide explains how to set up real-time Instagram webhooks for **instant automation replies** instead of waiting for manual sync.

## 🚀 Why Webhooks?

**Before (Manual Sync):**
- User clicks "Sync Messages" button
- App fetches new messages from Instagram API
- Automation rules check messages
- Replies sent
- **Total time: 1-5 minutes** (depending on when user syncs)

**After (Webhooks):**
- Customer sends message on Instagram
- Instagram sends webhook to your app **instantly**
- Automation rules check message
- Reply sent automatically
- **Total time: < 5 seconds** ⚡

## 📋 Prerequisites

1. Meta App with Instagram Messaging product enabled
2. App must be in **Development Mode** or **Live Mode**
3. HTTPS-enabled server (webhooks require HTTPS)
4. Environment variables configured

## 🔧 Setup Steps

### 1. Add Webhook Verify Token to Environment Variables

Add this to your `.env.local`:

```bash
# Instagram Webhook Configuration
META_WEBHOOK_VERIFY_TOKEN=your_secure_random_token_here
```

**Generate a secure token:**
```bash
# On Mac/Linux
openssl rand -hex 32

# Or use any random string (min 20 characters recommended)
```

### 2. Deploy Your Webhook Endpoint

Your webhook endpoint is already implemented at:
```
https://your-domain.com/api/webhooks/instagram
```

**Local Development:**
For testing locally, use **ngrok** to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Run your Next.js dev server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Your webhook URL would be: https://abc123.ngrok.io/api/webhooks/instagram
```

### 3. Configure Webhook in Meta App Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **Products** → **Webhooks**
4. Click **Add Subscription** for Instagram

**Configuration:**
- **Callback URL**: `https://your-domain.com/api/webhooks/instagram`
- **Verify Token**: Use the same token from your `.env.local`

**Subscribe to Fields:**
- ✅ `messages` - For DMs
- ✅ `messaging_postbacks` - For interactive messages
- ✅ `comments` - For comment replies (optional)

5. Click **Verify and Save**

Meta will send a GET request to verify your endpoint. If configured correctly, you'll see:
```
✅ Webhook verified successfully
```

### 4. Test the Webhook

**Test with Instagram:**

1. Send a DM to your Instagram Business Account
2. Check your server logs for:
   ```
   📨 Received Instagram webhook: {...}
   📩 New DM from 1234567890: "Hello"
   ```

3. If automation rule matches:
   ```
   ✅ Instant automation reply sent: "Thanks for your message!"
   ```

**Test Verification Endpoint:**

```bash
curl "https://your-domain.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123"

# Should return: test123
```

### 5. Monitor Webhook Events

**Check Webhook Delivery in Meta Dashboard:**

1. Go to **Products** → **Webhooks**
2. Click **Test** next to your subscription
3. Send a test message
4. Check **Recent Deliveries** for status

**Common Webhook Event Types:**

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "messaging": [
        {
          "sender": {"id": "SENDER_ID"},
          "recipient": {"id": "PAGE_ID"},
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Hello, what's your price?"
          }
        }
      ]
    }
  ]
}
```

## 🔒 Security

### Webhook Signature Verification

The webhook endpoint automatically verifies Instagram's signature using:
```typescript
x-hub-signature-256: sha256=SIGNATURE
```

This ensures requests are from Instagram and not malicious actors.

**Required Environment Variable:**
```bash
META_APP_SECRET=your_app_secret_from_meta_dashboard
```

### Rate Limiting

Instagram may send duplicate webhook events. The handler includes duplicate detection:
```typescript
// Check if message already exists
const { data: existing } = await supabaseAdmin
  .from('instagram_messages')
  .select('id')
  .eq('message_id', messageId)
  .single();

if (existing) {
  return; // Skip duplicate
}
```

## 🧪 Testing Webhooks Locally

### Using ngrok

```bash
# Terminal 1: Run Next.js dev server
npm run dev

# Terminal 2: Run ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add /api/webhooks/instagram to the end
# Paste into Meta App Dashboard webhook settings
```

### Test Webhook Verification

```bash
curl "http://localhost:3000/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=TEST"
```

Should return `TEST` if verification succeeds.

### Send Test Webhook Event

```bash
curl -X POST http://localhost:3000/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "PAGE_ID",
      "messaging": [{
        "sender": {"id": "123"},
        "message": {
          "mid": "test_msg_1",
          "text": "price"
        }
      }]
    }]
  }'
```

## 📊 Webhook vs Sync Comparison

| Feature | Manual Sync | Webhooks |
|---------|------------|----------|
| **Speed** | 1-5 minutes | < 5 seconds |
| **User Action** | Required (click button) | None (automatic) |
| **Reliability** | Depends on user | Instant |
| **API Calls** | Fetches ALL conversations | Only new messages |
| **Battery Usage** | Higher (periodic sync) | Lower (event-driven) |
| **Cost** | Higher (more API calls) | Lower (only new events) |

## 🛠️ Troubleshooting

### Webhook Not Receiving Events

**Check:**
1. Is your webhook URL publicly accessible (HTTPS)?
2. Is the verify token correct in both `.env` and Meta Dashboard?
3. Did you subscribe to the correct fields (`messages`)?
4. Is your Meta App in Development or Live mode?

**Debug:**
```bash
# Check server logs
npm run dev

# Send test DM on Instagram
# Look for webhook logs in terminal
```

### Signature Verification Failed

**Check:**
1. Is `META_APP_SECRET` set correctly in `.env`?
2. Is the secret the same as in Meta App Dashboard → Settings → Basic?

**Debug:**
```typescript
// Add logging to webhook handler
console.log('Received signature:', signature);
console.log('Expected signature:', expectedSignature);
```

### Duplicate Messages

Instagram may send duplicate webhook events. The handler has built-in deduplication:
```typescript
if (existingMessageIds.has(messageId)) {
  console.log('⏭️ Message already processed');
  return;
}
```

If you still see duplicates, check your database for:
```sql
SELECT message_id, COUNT(*)
FROM instagram_messages
GROUP BY message_id
HAVING COUNT(*) > 1;
```

## 🚀 Production Deployment

### Vercel (Recommended)

1. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

2. Add environment variables in Vercel Dashboard:
   - `META_WEBHOOK_VERIFY_TOKEN`
   - `META_APP_SECRET`

3. Your webhook URL will be:
   ```
   https://your-app.vercel.app/api/webhooks/instagram
   ```

4. Update Meta App Dashboard webhook URL

### Other Platforms

Ensure your platform supports:
- ✅ HTTPS (required by Instagram)
- ✅ Serverless functions (for API routes)
- ✅ Fast response times (< 2 seconds to acknowledge webhook)

## 📝 Environment Variables Summary

```bash
# Required for webhooks
META_WEBHOOK_VERIFY_TOKEN=your_random_token_here
META_APP_SECRET=your_app_secret_from_meta_dashboard

# Already required (from existing setup)
META_APP_ID=your_app_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 🎯 Next Steps

After setting up webhooks:

1. **Test thoroughly** - Send various test messages to ensure automation rules work
2. **Monitor logs** - Watch webhook events in production
3. **Set up alerts** - Use Sentry or similar to catch webhook errors
4. **Keep sync as backup** - Webhooks handle real-time, sync catches any missed events
5. **Archive old messages** - Use the batch archive endpoint to clean up old data

## 📚 Additional Resources

- [Meta Webhooks Documentation](https://developers.facebook.com/docs/graph-api/webhooks)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Webhook Security Best Practices](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)
