# Final Fix: Instagram Messaging API Endpoint Correction

## The Real Problem

Instagram Graph API **does NOT support** sending messages via the `/{conversation_id}/messages` endpoint.

The correct endpoint for sending Instagram DMs is:
```
POST /{page_id}/messages
```

With body:
```json
{
  "recipient": {
    "id": "sender_instagram_id"
  },
  "message": {
    "text": "Your reply text"
  }
}
```

## Error We Were Getting

```
Error: Unsupported post request. Object with ID 'aWdfZAG06MTpJR01lc3NhZA2VUaHJlYWQ...' does not exist
```

This was because we were trying to use the conversation ID (which is a base64-encoded thread identifier) as the endpoint, but Instagram expects the **Page ID** as the endpoint and the **sender's Instagram ID** as the recipient.

## What Was Fixed

### 1. Updated `sendConversationMessage()` function signature

**Before:**
```typescript
export async function sendConversationMessage(
  conversationId: string,
  messageText: string,
  accessToken: string
)
```

**After:**
```typescript
export async function sendConversationMessage(
  pageId: string,
  recipientId: string,
  messageText: string,
  accessToken: string
)
```

### 2. Fixed the API call

**Before:**
```typescript
const response = await axios.post(
  `${META_API_BASE}/${conversationId}/messages`,
  {
    message: {
      text: messageText,
    },
  },
  // ...
);
```

**After:**
```typescript
const response = await axios.post(
  `${META_API_BASE}/${pageId}/messages`, // ✅ Use page ID
  {
    recipient: {
      id: recipientId, // ✅ Specify recipient
    },
    message: {
      text: messageText,
    },
  },
  // ...
);
```

### 3. Updated Approve Route (`app/api/auto-reply/approve/route.ts`)

**Before:**
```typescript
instagramReplyId = await sendConversationMessage(
  queueItem.conversation_id, // ❌ Wrong
  replyText,
  profile.instagram_access_token
);
```

**After:**
```typescript
instagramReplyId = await sendConversationMessage(
  profile.facebook_page_id, // ✅ Page ID
  queueItem.sender_id, // ✅ Sender ID (recipient)
  replyText,
  profile.instagram_access_token
);
```

### 4. Updated Messages Sync Route (`app/api/messages/sync/route.ts`)

For automation rule auto-replies:

**Before:**
```typescript
const replyId = await sendConversationMessage(
  conversationData.conversationId, // ❌ Wrong
  matchedRule.reply_text,
  profile.instagram_access_token
);
```

**After:**
```typescript
const replyId = await sendConversationMessage(
  profile.facebook_page_id, // ✅ Page ID
  msg.from.id, // ✅ Sender ID (recipient)
  matchedRule.reply_text,
  profile.instagram_access_token
);
```

## Files Changed

1. ✅ `lib/instagram/messaging.ts` - Updated function signature and API call
2. ✅ `app/api/auto-reply/approve/route.ts` - Fixed to use page ID + sender ID
3. ✅ `app/api/messages/sync/route.ts` - Fixed automation auto-reply

## How Instagram Messaging Works

### Architecture:
```
Facebook Page
    ↓ (connected to)
Instagram Business Account
    ↓ (receives messages)
Conversations (with followers)
    ↓ (contains)
Messages (individual DMs)
```

### To Send a Message:
1. **Need**: Page ID + Page Access Token
2. **Specify**: Recipient's Instagram User ID (IGID)
3. **Endpoint**: `POST /{page_id}/messages`
4. **Body**: `{"recipient": {"id": "..."}, "message": {"text": "..."}}`

### Why We Store Both conversation_id and sender_id:
- **`conversation_id`**: Used for context tracking and analytics
- **`sender_id`**: **Required** to send replies via the API ✅
- **`message_id`**: Unique identifier for the specific message

## Testing the Fix

### Before Testing:
Make sure you've run the database migration:
```sql
ALTER TABLE auto_reply_queue
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS sender_id TEXT;
```

### Test Steps:

1. **Send a test DM** to your Instagram Business Account
2. **Sync messages**:
   ```bash
   curl -X POST http://localhost:3000/api/messages/sync \
     -H "Content-Type: application/json" \
     -d '{"userId": "YOUR_USER_ID"}'
   ```
3. **Check approval queue**: Go to `/dashboard/auto-reply-queue`
4. **Verify data**: Queue item should have both `conversation_id` and `sender_id`
5. **Approve reply**: Click "Approve & Send"
6. **✅ Success**: Reply should appear in Instagram DMs!

### What to Expect:

**Console logs:**
```
📨 Sending message via page to recipient: 123456789
✅ Message sent successfully: mid.xxx...
```

**Instagram:**
Your reply should appear in the DM conversation immediately!

## Key Takeaway

Instagram Graph API messaging requires:
- ✅ Page ID as the endpoint base
- ✅ Recipient ID in the request body
- ❌ NOT conversation ID as the endpoint

This is different from fetching messages, where you CAN use:
- `GET /{conversation_id}/messages` ✅ (to read)

But you CANNOT use:
- `POST /{conversation_id}/messages` ❌ (to send)

## References

- [Instagram Platform - Conversations API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/conversations-api/)
- [Meta Graph API v21.0 Documentation](https://developers.facebook.com/docs/graph-api)

---

**Status:** ✅ FIXED - Ready to test!
