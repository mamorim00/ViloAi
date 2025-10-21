# Auto-Reply System - Complete Testing Checklist

## Prerequisites

- [ ] Database migration executed (`supabase/migrations/007_auto_reply_system.sql`)
- [ ] Meta App has `instagram_manage_comments` permission
- [ ] Instagram Business Account connected
- [ ] Development server running (`npm run dev`)

---

## Part 1: Backend API Testing

### Test Auto-Reply Settings API

```bash
# Get current settings
curl http://localhost:3000/api/settings/auto-reply?userId=YOUR_USER_ID

# Enable comment auto-replies
curl -X PUT http://localhost:3000/api/settings/auto-reply \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID", "auto_reply_comments_enabled": true}'

# Enable DM auto-replies
curl -X PUT http://localhost:3000/api/settings/auto-reply \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID", "auto_reply_dms_enabled": true}'
```

**Expected Results:**
- [ ] GET returns current settings
- [ ] PUT updates settings successfully
- [ ] Settings persist in database

---

### Test Automation Rules API

```bash
# Create automation rule
curl -X POST http://localhost:3000/api/automation-rules \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "trigger_type": "both",
    "trigger_text": "test",
    "reply_text": "This is an automated test reply!",
    "match_type": "exact"
  }'

# List all rules
curl http://localhost:3000/api/automation-rules?userId=YOUR_USER_ID

# Update rule (get ID from list above)
curl -X PUT http://localhost:3000/api/automation-rules/RULE_ID \
  -H "Content-Type: application/json" \
  -d '{"reply_text": "Updated reply text"}'

# Delete rule
curl -X DELETE http://localhost:3000/api/automation-rules/RULE_ID
```

**Expected Results:**
- [ ] Rules are created successfully
- [ ] Rules appear in list
- [ ] Updates work correctly
- [ ] Deletion removes rule

---

### Test Comment Sync

```bash
# Sync Instagram comments
curl -X POST http://localhost:3000/api/comments/sync \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

**Expected Results:**
- [ ] API fetches recent Instagram posts
- [ ] Comments are retrieved from each post
- [ ] Comments stored in `instagram_comments` table
- [ ] Automation rules checked and matched
- [ ] AI-generated replies added to queue
- [ ] Response shows counts: `syncedComments`, `autoReplied`, `queuedForApproval`

---

### Test DM Sync

```bash
# Sync Instagram DMs (existing endpoint enhanced)
curl -X POST http://localhost:3000/api/messages/sync \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

**Expected Results:**
- [ ] DMs fetched from Instagram
- [ ] Automation rules checked first
- [ ] Exact matches trigger auto-reply
- [ ] AI analyzes non-matches
- [ ] AI replies added to approval queue
- [ ] Response includes `autoReplied` and `queuedForApproval` counts

---

### Test Approval Queue

```bash
# Get pending approvals
curl http://localhost:3000/api/auto-reply/queue?userId=YOUR_USER_ID

# Approve a reply
curl -X POST http://localhost:3000/api/auto-reply/approve \
  -H "Content-Type: application/json" \
  -d '{
    "queueItemId": "QUEUE_ITEM_ID",
    "userId": "YOUR_USER_ID"
  }'

# Approve with edited text
curl -X POST http://localhost:3000/api/auto-reply/approve \
  -H "Content-Type: application/json" \
  -d '{
    "queueItemId": "QUEUE_ITEM_ID",
    "userId": "YOUR_USER_ID",
    "editedReply": "This is my edited version of the reply"
  }'

# Reject a reply
curl -X POST http://localhost:3000/api/auto-reply/reject \
  -H "Content-Type: application/json" \
  -d '{
    "queueItemId": "QUEUE_ITEM_ID",
    "userId": "YOUR_USER_ID",
    "reason": "Not appropriate"
  }'
```

**Expected Results:**
- [ ] Queue shows pending items
- [ ] Approval sends reply to Instagram
- [ ] Instagram shows the posted reply/comment
- [ ] Queue item status updated to 'approved'
- [ ] Log entry created in `auto_reply_logs`
- [ ] Rejected items marked as 'rejected'

---

### Test Auto-Reply Logs

```bash
# Get recent logs
curl http://localhost:3000/api/auto-reply/logs?userId=YOUR_USER_ID&limit=20
```

**Expected Results:**
- [ ] Logs show all auto-replies sent
- [ ] Includes both automation and AI-approved
- [ ] Shows success/failure status
- [ ] Contains full reply text and original message

---

## Part 2: Frontend UI Testing

### Settings Page (`/dashboard/settings`)

- [ ] Navigate to `/dashboard/settings`
- [ ] Auto-Reply Settings section visible at top
- [ ] Comment Auto-Reply toggle works
- [ ] DM Auto-Reply toggle works
- [ ] "Manage Automation Rules →" link works
- [ ] "View Approval Queue →" link works
- [ ] Info box appears when toggles are enabled
- [ ] Settings persist after page reload

---

### Automation Rules Page (`/dashboard/automation-rules`)

#### Create Rule:
- [ ] Navigate to `/dashboard/automation-rules`
- [ ] Fill in trigger text: "send hi"
- [ ] Fill in reply text: "Here's your free ebook: https://example.com/ebook.pdf"
- [ ] Select match type: "Exact Match"
- [ ] Select apply to: "Both Comments & DMs"
- [ ] Click "Create Automation Rule"
- [ ] Rule appears in list below
- [ ] Usage count shows 0

#### Edit Rule:
- [ ] Click pencil icon on a rule
- [ ] Modify trigger or reply text
- [ ] Click "Save"
- [ ] Changes reflected immediately
- [ ] Click "Cancel" to abort changes

#### Toggle Active/Inactive:
- [ ] Click toggle switch
- [ ] Rule becomes inactive (grayed out)
- [ ] Toggle again to reactivate

#### Delete Rule:
- [ ] Click trash icon
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Rule removed from list

#### Visual Elements:
- [ ] Emoji icons show for trigger types (💬,✉️,🔄)
- [ ] Match type badges display correctly (blue/green/purple)
- [ ] Active/inactive badges show correct color
- [ ] Usage statistics display properly

---

### Auto-Reply Queue Page (`/dashboard/auto-reply-queue`)

#### View Queue:
- [ ] Navigate to `/dashboard/auto-reply-queue`
- [ ] Pending count shows in header
- [ ] Each item shows customer message
- [ ] Each item shows AI-generated reply
- [ ] Language badge shows (Finnish/English)
- [ ] Message type badge shows (Comment/DM)
- [ ] Timestamp displays ("2h ago", etc.)

#### Approve Reply:
- [ ] Click "Approve & Send"
- [ ] Confirm alert appears
- [ ] Reply posts to Instagram
- [ ] Item removed from queue
- [ ] Appears in logs

#### Edit Before Sending:
- [ ] Click "Edit" button
- [ ] Textarea becomes editable
- [ ] Modify the text
- [ ] Click "Send Edited Reply"
- [ ] Modified version posts to Instagram

#### Reject Reply:
- [ ] Click "Reject"
- [ ] Confirmation dialog appears
- [ ] Confirm rejection
- [ ] Item removed from queue
- [ ] NOT posted to Instagram

#### Empty State:
- [ ] When queue is empty, shows checkmark icon
- [ ] Displays "All caught up!" message

---

### Auto-Reply Logs Page (`/dashboard/auto-reply-logs`)

#### Statistics:
- [ ] Stats cards show at top
- [ ] Total Replies count correct
- [ ] Automation count correct
- [ ] AI Approved count correct
- [ ] Successful count correct
- [ ] Failed count correct

#### Filter:
- [ ] "All" button shows everything
- [ ] "Automation" button filters to automation rules only
- [ ] "AI Approved" button filters to AI-approved only
- [ ] Counts update when filtering

#### Log Entries:
- [ ] Each log shows success/failure icon
- [ ] Original message displayed
- [ ] Reply text displayed
- [ ] Timestamp shown
- [ ] Type badge shown (Automation/AI Approved)
- [ ] Failed entries show error message

---

## Part 3: End-to-End Testing

### Scenario 1: Automation Rule Auto-Reply (Comment)

1. **Setup:**
   - [ ] Go to `/dashboard/automation-rules`
   - [ ] Create rule: "test" → "This is an automated reply!"
   - [ ] Match type: Exact
   - [ ] Apply to: Comments
   - [ ] Go to `/dashboard/settings`
   - [ ] Enable Comment Auto-Replies

2. **Test:**
   - [ ] Comment "test" on one of your Instagram posts
   - [ ] Wait 1 minute
   - [ ] Manually trigger sync OR wait for cron job
   - [ ] Call `/api/comments/sync` with your userId

3. **Verify:**
   - [ ] Check Instagram - automated reply should appear
   - [ ] Go to `/dashboard/auto-reply-logs`
   - [ ] See log entry with type "Automation Rule"
   - [ ] Status shows "Successful"
   - [ ] Go to `/dashboard/automation-rules`
   - [ ] Usage count incremented to 1

---

### Scenario 2: AI-Generated Reply with Approval (DM)

1. **Setup:**
   - [ ] Go to `/dashboard/settings`
   - [ ] Enable DM Auto-Replies

2. **Test:**
   - [ ] Send DM to your Instagram account: "What are your prices?"
   - [ ] Wait 1 minute
   - [ ] Call `/api/messages/sync` with your userId

3. **Verify AI Analysis:**
   - [ ] Check database `instagram_messages` table
   - [ ] Message should have `intent: 'price_inquiry'`
   - [ ] Both Finnish and English suggestions populated

4. **Approve & Send:**
   - [ ] Go to `/dashboard/auto-reply-queue`
   - [ ] See the pending approval
   - [ ] Message text shows: "What are your prices?"
   - [ ] AI reply suggestion appears
   - [ ] Click "Approve & Send"

5. **Verify Sent:**
   - [ ] Check Instagram DMs - reply should appear
   - [ ] Go to `/dashboard/auto-reply-logs`
   - [ ] See log entry with type "AI Approved"
   - [ ] Status shows "Successful"

---

### Scenario 3: Edit AI Reply Before Sending

1. **Test:**
   - [ ] Generate an AI reply (send question to Instagram)
   - [ ] Sync messages
   - [ ] Go to `/dashboard/auto-reply-queue`
   - [ ] Click "Edit" on pending item
   - [ ] Modify the suggested text
   - [ ] Click "Send Edited Reply"

2. **Verify:**
   - [ ] Check Instagram - EDITED version posted
   - [ ] Go to `/dashboard/auto-reply-logs`
   - [ ] Log shows the edited text, not original suggestion

---

### Scenario 4: Reject AI Reply

1. **Test:**
   - [ ] Generate an AI reply
   - [ ] Go to `/dashboard/auto-reply-queue`
   - [ ] Click "Reject"
   - [ ] Confirm rejection

2. **Verify:**
   - [ ] Item removed from queue
   - [ ] Check Instagram - NO reply posted
   - [ ] Logs do NOT show this item

---

### Scenario 5: Comment Filtering (Casual Comments)

1. **Test:**
   - [ ] Comment "❤️" (just an emoji) on Instagram post
   - [ ] Call `/api/comments/sync`

2. **Verify:**
   - [ ] Check logs - should show "Skipped casual comment"
   - [ ] Check `instagram_comments` table
   - [ ] Comment stored with `is_question: false`
   - [ ] NO entry in approval queue
   - [ ] NO reply posted

---

### Scenario 6: Multiple Automation Rules

1. **Setup:**
   - [ ] Create rule 1: "price" (contains) → "€49/month"
   - [ ] Create rule 2: "hello" (starts_with) → "Hi! How can I help?"
   - [ ] Create rule 3: "send ebook" (exact) → "Download here: [link]"

2. **Test:**
   - [ ] Comment "What's the price?" on Instagram
   - [ ] DM "hello there"
   - [ ] DM "send ebook"

3. **Verify:**
   - [ ] Sync and check Instagram
   - [ ] All 3 should have auto-replies
   - [ ] Logs show 3 automation entries
   - [ ] Usage counts incremented

---

## Database Verification

### Check Tables Directly:

```sql
-- Auto-reply settings
SELECT auto_reply_comments_enabled, auto_reply_dms_enabled
FROM profiles WHERE id = 'YOUR_USER_ID';

-- Automation rules
SELECT * FROM automation_rules WHERE user_id = 'YOUR_USER_ID';

-- Instagram comments
SELECT comment_id, comment_text, is_question, replied_at, replied_by
FROM instagram_comments WHERE user_id = 'YOUR_USER_ID'
ORDER BY timestamp DESC LIMIT 10;

-- Approval queue
SELECT * FROM auto_reply_queue
WHERE user_id = 'YOUR_USER_ID' AND status = 'pending';

-- Auto-reply logs
SELECT message_type, reply_type, success, sent_at, reply_text
FROM auto_reply_logs WHERE user_id = 'YOUR_USER_ID'
ORDER BY sent_at DESC LIMIT 20;
```

---

## Performance Testing

- [ ] Create 10 automation rules
- [ ] Sync 50+ comments
- [ ] Verify page load times < 2 seconds
- [ ] Check database queries are indexed
- [ ] Verify RLS policies don't leak data between users

---

## Error Handling

### Test Invalid Inputs:
- [ ] Create automation rule with empty trigger text
- [ ] Create automation rule with empty reply text
- [ ] Approve non-existent queue item
- [ ] Sync without Instagram connection

**Expected:**
- [ ] Validation errors displayed
- [ ] User-friendly error messages
- [ ] System doesn't crash
- [ ] Logs capture errors

---

## Checklist Summary

- [ ] All backend API endpoints tested
- [ ] All frontend pages load correctly
- [ ] Automation rules work end-to-end
- [ ] AI approval flow works end-to-end
- [ ] Comments auto-reply successfully
- [ ] DMs auto-reply successfully
- [ ] Logs track everything correctly
- [ ] UI matches design specifications
- [ ] No console errors
- [ ] Database migrations applied
- [ ] RLS policies secure
- [ ] Ready for production! 🚀
