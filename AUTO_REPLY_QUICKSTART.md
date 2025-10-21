# Auto-Reply System - Quick Start Guide

## Step 1: Run Database Migration

Open Supabase SQL Editor and execute:

```bash
supabase/migrations/007_auto_reply_system.sql
```

This creates:
- 4 new tables with RLS policies
- Helper functions
- Indexes for performance

## Step 2: Test the Backend

### Test Comment Sync

```bash
# Call the API
curl -X POST http://localhost:3000/api/comments/sync \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

### Test Creating an Automation Rule

```bash
curl -X POST http://localhost:3000/api/automation-rules \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "trigger_type": "both",
    "trigger_text": "send hi",
    "reply_text": "Hello! Here is your free ebook: https://example.com/ebook",
    "match_type": "exact"
  }'
```

### Test Getting Approval Queue

```bash
curl http://localhost:3000/api/auto-reply/queue?userId=YOUR_USER_ID
```

### Test Enabling Auto-Reply

```bash
curl -X PUT http://localhost:3000/api/settings/auto-reply \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "auto_reply_comments_enabled": true,
    "auto_reply_dms_enabled": true
  }'
```

## Step 3: Verify Instagram Permissions

Ensure your Meta App has these permissions:
- ✅ `instagram_basic` (already have)
- ✅ `instagram_manage_messages` (already have)
- ✅ `instagram_manage_comments` (ADD THIS)
- ✅ `pages_show_list` (already have)

## Step 4: Test End-to-End

1. **Create an automation rule** (via API or future UI):
   - Trigger: "test"
   - Reply: "This is an automated test reply!"

2. **Enable auto-reply for comments**:
   - Call `/api/settings/auto-reply` with `auto_reply_comments_enabled: true`

3. **Comment "test" on one of your Instagram posts**

4. **Sync comments**:
   - Call `/api/comments/sync` with your userId
   - Check logs - should see "Auto-replied to comment via automation"

5. **Verify on Instagram**:
   - Your account should have replied to the comment automatically

6. **Check auto-reply logs**:
   - Call `/api/auto-reply/logs?userId=YOUR_USER_ID`
   - Should see the logged auto-reply

## Step 5: Test AI Approval Flow

1. **Comment a question** on your Instagram post:
   - "What are your prices?"

2. **Sync comments**:
   - Call `/api/comments/sync`
   - Should NOT auto-reply (no automation rule matched)
   - AI will analyze and add to queue

3. **Check approval queue**:
   - Call `/api/auto-reply/queue?userId=YOUR_USER_ID`
   - Should see pending AI-generated reply

4. **Approve the reply**:
   ```bash
   curl -X POST http://localhost:3000/api/auto-reply/approve \
     -H "Content-Type: application/json" \
     -d '{
       "queueItemId": "QUEUE_ITEM_ID",
       "userId": "YOUR_USER_ID"
     }'
   ```

5. **Verify on Instagram**:
   - Your account should have replied to the comment

## Common Use Cases

### Use Case 1: Auto-send ebook on trigger

```javascript
// Automation Rule
{
  trigger_text: "ebook",
  reply_text: "Thanks for your interest! Download our free ebook here: https://yoursite.com/ebook.pdf",
  match_type: "contains",
  trigger_type: "both"
}
```

### Use Case 2: Auto-reply to price inquiries

```javascript
// Automation Rule
{
  trigger_text: "price",
  reply_text: "Our pricing starts at €49/month. See all plans: https://yoursite.com/pricing",
  match_type: "contains",
  trigger_type: "dm"
}
```

### Use Case 3: Auto-greet new followers

```javascript
// Automation Rule
{
  trigger_text: "hi",
  reply_text: "Hello! Thanks for reaching out. How can we help you today?",
  match_type: "exact",
  trigger_type: "dm"
}
```

## Debugging Tips

### Check if comments are being fetched

```bash
# Enable detailed logging
# Check terminal for logs like:
# "📸 Fetching recent media for Instagram user: ..."
# "💬 Fetching comments for media: ..."
```

### Check if automation rules are matching

```bash
# Look for logs like:
# "✅ Automation rule matched: 'test' -> 'This is a test reply'"
# "✅ Auto-replied to comment via automation: 'test'"
```

### Check if AI is filtering comments correctly

```bash
# Look for logs like:
# "⏭️ Skipped casual comment: '❤️' (Just emojis)"
# "📝 Queued AI reply for approval: 'What's the price?'"
```

### Check database directly

```sql
-- See all automation rules
SELECT * FROM automation_rules WHERE user_id = 'YOUR_USER_ID';

-- See recent comments
SELECT * FROM instagram_comments WHERE user_id = 'YOUR_USER_ID' ORDER BY timestamp DESC LIMIT 10;

-- See approval queue
SELECT * FROM auto_reply_queue WHERE user_id = 'YOUR_USER_ID' AND status = 'pending';

-- See auto-reply logs
SELECT * FROM auto_reply_logs WHERE user_id = 'YOUR_USER_ID' ORDER BY sent_at DESC LIMIT 20;
```

## API Reference Quick Guide

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/comments/sync` | POST | Sync Instagram comments |
| `/api/messages/sync` | POST | Sync Instagram DMs (enhanced) |
| `/api/automation-rules` | GET | List automation rules |
| `/api/automation-rules` | POST | Create automation rule |
| `/api/automation-rules/[id]` | PUT | Update automation rule |
| `/api/automation-rules/[id]` | DELETE | Delete automation rule |
| `/api/auto-reply/queue` | GET | Get pending approvals |
| `/api/auto-reply/approve` | POST | Approve & send reply |
| `/api/auto-reply/reject` | POST | Reject queued reply |
| `/api/auto-reply/logs` | GET | Get auto-reply audit logs |
| `/api/settings/auto-reply` | GET | Get auto-reply settings |
| `/api/settings/auto-reply` | PUT | Update auto-reply settings |

## Next Steps

Once backend is tested and working:

1. Build the Settings UI (toggle switches)
2. Build the Automation Rules management page
3. Build the Approval Queue page
4. Add auto-reply logs to dashboard
5. Set up cron jobs for periodic syncing

See `AUTO_REPLY_IMPLEMENTATION.md` for complete details.
