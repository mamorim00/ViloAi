# Fix: Instagram DM Reply Error - Conversation ID Missing

## Problem

When trying to send DM replies from the auto-reply approval queue, the system was failing with this error:

```
❌ Error sending conversation message: {
  error: {
    message: "Unsupported post request. Object with ID 'aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDc3NjI3NDE4Nzc2OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI3NjAyMTc3Mjk2OTY3NDU1NzozMjQ4NTUxMTc1Mzk3Mjc2MzY3MjM4NzI5MTY4NjM3MTMyOAZDZD' does not exist, cannot be loaded due to missing permissions, or does not support this operation.",
    type: 'GraphMethodException',
    code: 100,
    error_subcode: 33
  }
}
```

## Root Cause

The `auto_reply_queue` table was only storing the `message_id` field. When approving a DM reply, the code was trying to call:

```typescript
sendConversationMessage(
  queueItem.message_id, // ❌ This is the MESSAGE ID, not CONVERSATION ID
  replyText,
  accessToken
)
```

The Instagram Graph API endpoint `/{conversation_id}/messages` requires the **conversation ID**, not the **message ID**. The message ID is a unique identifier for a specific message within a conversation, but to send a reply, we need the conversation ID.

## Solution

### 1. Database Migration (`008_add_queue_identifiers.sql`)

Added two new columns to the `auto_reply_queue` table:

```sql
ALTER TABLE auto_reply_queue
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS sender_id TEXT;
```

- **`conversation_id`**: Instagram conversation ID (required to reply to DMs via API)
- **`sender_id`**: Instagram sender user ID (alternative way to reply via page messages endpoint)

### 2. TypeScript Type Update (`lib/types.ts`)

Updated the `AutoReplyQueue` interface:

```typescript
export interface AutoReplyQueue {
  id: string;
  user_id: string;
  message_type: 'comment' | 'dm';
  message_id: string;
  conversation_id?: string; // ✅ NEW - Instagram conversation ID (for DMs)
  sender_id?: string; // ✅ NEW - Instagram sender user ID (IGID)
  message_text: string;
  sender_username?: string;
  suggested_reply: string;
  detected_language: 'fi' | 'en';
  status: QueueStatus;
  // ... other fields
}
```

### 3. Message Sync Update (`app/api/messages/sync/route.ts`)

When inserting DMs into the approval queue, now includes the conversation ID:

```typescript
await supabaseAdmin.from('auto_reply_queue').insert({
  user_id: userId,
  message_type: 'dm',
  message_id: msg.id,
  conversation_id: conversationData.conversationId, // ✅ NEW - For replying
  sender_id: msg.from.id, // ✅ NEW - Alternative method
  message_text: messageText,
  sender_username: msg.from.username,
  suggested_reply: suggestedReply,
  detected_language: analysis.detectedLanguage || 'en',
  status: 'pending',
});
```

### 4. Comment Sync Update (`app/api/comments/sync/route.ts`)

When inserting comments into the approval queue, now includes sender_id:

```typescript
await supabaseAdmin.from('auto_reply_queue').insert({
  user_id: userId,
  message_type: 'comment',
  message_id: comment.id,
  sender_id: comment.from?.id || comment.username || 'unknown', // ✅ NEW
  message_text: commentText,
  sender_username: comment.username || comment.from?.username,
  suggested_reply: suggestedReply,
  detected_language: analysis.detectedLanguage || 'en',
  status: 'pending',
});
```

### 5. Approve Route Fix (`app/api/auto-reply/approve/route.ts`)

Now correctly uses the conversation ID when sending DM replies:

```typescript
if (queueItem.message_type === 'comment') {
  instagramReplyId = await replyToComment(
    queueItem.message_id,
    replyText,
    profile.instagram_access_token
  );
} else {
  // DM - Use conversation_id to send the reply
  if (!queueItem.conversation_id) {
    throw new Error('Conversation ID missing for DM reply');
  }

  instagramReplyId = await sendConversationMessage(
    queueItem.conversation_id, // ✅ FIXED - Use conversation_id, not message_id
    replyText,
    profile.instagram_access_token
  );
}
```

## How to Apply the Fix

### Step 1: Run Database Migration

Execute the migration in your Supabase SQL Editor:

```bash
# File: supabase/migrations/008_add_queue_identifiers.sql
```

Or run this SQL directly:

```sql
ALTER TABLE auto_reply_queue
ADD COLUMN IF NOT EXISTS conversation_id TEXT,
ADD COLUMN IF NOT EXISTS sender_id TEXT;

CREATE INDEX IF NOT EXISTS idx_auto_reply_queue_conversation ON auto_reply_queue(conversation_id);
```

### Step 2: Clear Existing Queue Items (Optional)

Since existing queue items won't have `conversation_id`, you may want to clear them:

```sql
-- Clear pending items that don't have conversation_id
UPDATE auto_reply_queue
SET status = 'expired'
WHERE status = 'pending' AND conversation_id IS NULL;
```

Or delete them entirely:

```sql
DELETE FROM auto_reply_queue WHERE status = 'pending' AND conversation_id IS NULL;
```

### Step 3: Sync New Messages

After applying the fix:

1. Go to your dashboard
2. Run a new DM sync (`/api/messages/sync`)
3. New messages will now include `conversation_id` in the queue
4. Approve a DM reply from the queue
5. ✅ The reply should post successfully to Instagram

## Testing the Fix

### Test DM Auto-Reply Flow:

1. **Send a test DM** to your Instagram account: "What are your prices?"
2. **Sync messages**: Call `/api/messages/sync` with your user ID
3. **Check the queue**: Go to `/dashboard/auto-reply-queue`
4. **Verify data**: Check that the queue item has `conversation_id` populated
5. **Approve & send**: Click "Approve & Send"
6. **Verify on Instagram**: The reply should appear in the DM conversation

### Verify Database:

```sql
-- Check that new queue items have conversation_id
SELECT
  message_type,
  message_id,
  conversation_id,
  sender_id,
  message_text
FROM auto_reply_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;
```

## Technical Details

### Instagram API Endpoints

**Correct way to send DM reply:**
```
POST /{conversation_id}/messages
Body: { "message": { "text": "Reply text" } }
```

**Alternative (using Page ID + recipient):**
```
POST /{page_id}/messages
Body: {
  "recipient": { "id": "{sender_id}" },
  "message": { "text": "Reply text" }
}
```

We're using the first method (conversation-based) which is more reliable for replying within existing conversations.

### Why the Error Occurred

The error `Object with ID '...' does not exist` happened because:
1. We were passing a **message ID** (base64 encoded, starts with `aWdfZAG1f...`)
2. Instagram expected a **conversation ID** (different format)
3. The API couldn't find a conversation with that message ID
4. Error code 100, subcode 33 = "Object doesn't exist or unsupported operation"

## Summary

**Before:**
- ❌ Queue stored only `message_id`
- ❌ Tried to reply using message ID as conversation ID
- ❌ Instagram API rejected the request

**After:**
- ✅ Queue stores `conversation_id` and `sender_id`
- ✅ Uses correct conversation ID to send replies
- ✅ Instagram API accepts the request and posts the reply

**Files Changed:**
1. `supabase/migrations/008_add_queue_identifiers.sql` (NEW)
2. `lib/types.ts` (AutoReplyQueue interface)
3. `app/api/messages/sync/route.ts` (insert conversation_id)
4. `app/api/comments/sync/route.ts` (insert sender_id)
5. `app/api/auto-reply/approve/route.ts` (use conversation_id for DMs)

The fix is now complete and ready to test! 🚀
