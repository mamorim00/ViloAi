# Unified Dashboard - Complete Guide

## Overview

The main dashboard has been completely rebuilt as an **all-in-one unified inbox** that combines Instagram DMs, comments, and pending AI approvals into a single, streamlined workflow. The `/dashboard/messages` page has been removed - everything now happens on the main dashboard.

## Key Features

### 1. **Unified Inbox View**
- **Single feed** showing all DMs, comments, and pending approvals together
- **Smart sorting**: Leads first → Pending approvals → Unanswered → Answered
- **Real-time filtering**: Switch between All, Leads, Pending, Unanswered, Answered
- **Visual indicators**: Lead badges (🔥), type badges (DM/Comment), intent badges

### 2. **Lead Identification System**
Messages are automatically scored as leads based on intent:
- **🔥🔥 High Priority (Score: 10)** - `price_inquiry`
- **🔥 Medium-High Priority (Score: 8)** - `availability`, `location`
- **🔥 Medium Priority (Score: 5)** - `general_question`, `complaint`

### 3. **Inline Actions**
Each message card includes context-appropriate actions:

**For Pending Approvals:**
- ✅ **Approve & Send** - Send AI-generated reply as-is
- ✏️ **Edit** - Modify AI suggestion before sending
- ❌ **Reject** - Dismiss the suggestion

**For Regular Messages:**
- 💬 **Reply** - Open quick reply box to type custom response

**For All Messages:**
- View original message text
- See AI suggestions (if available)
- Check reply status and history

### 4. **Stats Dashboard**
Five key metrics at the top:
- **Total Messages** - All DMs + comments
- **Leads** - High-value messages (price, availability, location)
- **Pending Approval** - AI replies waiting for review
- **Unanswered** - Messages not yet replied to
- **Answered** - Completed conversations

## Files Created/Modified

### New Files
1. **`app/api/unified-inbox/route.ts`** - API endpoint that fetches and combines all inbox items
2. **`app/api/quick-reply/route.ts`** - API for sending custom replies from dashboard
3. **`components/UnifiedInboxItem.tsx`** - Main message card component with inline actions
4. **`components/LeadBadge.tsx`** - Visual lead indicator (flame icons)
5. **`components/QuickReplyBox.tsx`** - Inline reply textarea component

### Modified Files
6. **`lib/types.ts`** - Added `LeadInfo`, `LeadScore`, `UnifiedInboxItem` types
7. **`app/dashboard/page.tsx`** - Completely rebuilt as unified inbox

### Deleted Files
8. **`app/dashboard/messages/page.tsx`** - No longer needed (functionality merged into dashboard)

## How It Works

### Unified Inbox API (`/api/unified-inbox`)

**Endpoint**: `GET /api/unified-inbox?userId={id}&filter={filter}`

**What it does:**
1. Fetches all Instagram DMs from `instagram_messages` table
2. Fetches all Instagram comments from `instagram_comments` table
3. Fetches all pending approvals from `auto_reply_queue` table
4. Calculates lead score for each item based on intent
5. Combines everything into a single array
6. Applies filter (all, leads, pending_approval, unanswered, answered)
7. Sorts by: Lead score → Pending status → Answered status → Timestamp

**Returns:**
```json
{
  "success": true,
  "items": [...], // Array of UnifiedInboxItem
  "total": 100,
  "stats": {
    "total": 100,
    "leads": 25,
    "pending_approval": 10,
    "unanswered": 40,
    "answered": 60
  }
}
```

### Quick Reply API (`/api/quick-reply`)

**Endpoint**: `POST /api/quick-reply`

**Request body:**
```json
{
  "userId": "user-uuid",
  "itemType": "dm" | "comment",
  "sourceId": "message_id or comment_id",
  "replyText": "Your custom reply text",
  "conversationId": "...", // For DMs
  "senderId": "..." // For DMs
}
```

**What it does:**
1. Validates user has Instagram connected
2. For comments: Calls `replyToComment()` from Instagram API
3. For DMs: Calls `sendConversationMessage()` with page ID + sender ID
4. Updates the database record with `replied_at`, `replied_by: 'manual'`, `reply_text`
5. Returns success confirmation

### Lead Scoring Logic

```typescript
function calculateLeadInfo(intent?: string): LeadInfo {
  switch (intent) {
    case 'price_inquiry':
      return { isLead: true, score: 10, reason: 'High-value: Price inquiry' };
    case 'availability':
    case 'location':
      return { isLead: true, score: 8, reason: 'High-value: ...' };
    case 'general_question':
    case 'complaint':
      return { isLead: true, score: 5, reason: 'Medium-value: ...' };
    default:
      return { isLead: false, score: 0, reason: 'Low priority' };
  }
}
```

## User Workflow

### Daily Usage Flow

1. **User logs into dashboard** → Sees unified inbox automatically
2. **Clicks "Sync Messages"** → Fetches new DMs and comments from Instagram
3. **Sees leads highlighted** → 🔥🔥 badges for high-value messages
4. **Reviews pending approvals** → Click "Pending" filter to see AI-generated replies
5. **Approves/edits/rejects** → Inline actions for each pending item
6. **Replies to other messages** → Click "Reply" button to type custom response
7. **Filters by status** → Toggle between All, Leads, Unanswered, Answered

### Example: Approving AI Reply

1. User sees a pending approval item in the inbox
2. Reviews the original message: "What are your prices?"
3. Sees AI suggestion: "Our prices start at €49/month..."
4. Options:
   - **Approve** → Click "Approve & Send" → Reply sent to Instagram
   - **Edit** → Click "Edit" → Modify text → Click "Send Edited" → Reply sent
   - **Reject** → Click "Reject" → Item removed from queue

### Example: Quick Reply

1. User sees an unanswered message in inbox
2. Clicks "Reply" button on the message card
3. Quick reply box appears below the message
4. Types custom reply → Presses Ctrl+Enter or clicks "Send"
5. Reply sent to Instagram → Message marked as replied

### Example: Lead Management

1. User clicks "Leads" filter → Sees only high-value messages
2. Messages with 🔥🔥 (price inquiries) appear first
3. Messages with 🔥 (availability, location) appear next
4. User prioritizes responses to these high-value leads
5. Clicks "Reply" to engage with the lead immediately

## Visual Design

### Message Card Layout

```
┌────────────────────────────────────────────────┐
│ 🔥🔥 LEAD   [DM]   [price_inquiry]   [✓ Replied]│
│                                         2h ago  │
├────────────────────────────────────────────────┤
│ @john_smith                                    │
├────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐  │
│ │ "What are your prices for the premium     │  │
│ │  package?"                                │  │
│ └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│ AI Suggestion (English): 95% confidence        │
│ ┌──────────────────────────────────────────┐  │
│ │ "Our premium package starts at €99/month  │  │
│ │  and includes..."                         │  │
│ └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│ [✅ Approve & Send] [✏️ Edit] [❌ Reject]      │
└────────────────────────────────────────────────┘
```

### Filter Bar

```
[All (100)] [🔥 Leads (25)] [⚡ Pending (10)] [Unanswered (40)] [Answered (60)]   [🔄 Sync Messages]
```

### Stats Cards

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Leads        │ Pending      │ Unanswered   │ Answered     │
│ Messages     │              │ Approval     │              │              │
│              │              │              │              │              │
│  💬 100      │  🔥 25       │  ⏰ 10       │  💬 40       │  ✓ 60       │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

## Benefits

### For Users
✅ **Single source of truth** - Everything in one place, no page hopping
✅ **Lead focus** - High-value messages stand out and get prioritized
✅ **Faster workflow** - Inline actions eliminate navigation overhead
✅ **Better context** - See all message types together in chronological flow
✅ **Time savings** - Approve/reject AI replies without leaving the page

### For Development
✅ **Simplified architecture** - One main page instead of multiple separate views
✅ **Unified data model** - `UnifiedInboxItem` type combines all message types
✅ **Consistent UX** - All interactions follow the same pattern
✅ **Easier maintenance** - Less code duplication, single component library

## Testing Checklist

### Prerequisites
- [ ] Run database migration 008 (adds conversation_id, sender_id to queue)
- [ ] Instagram account connected
- [ ] Auto-reply settings enabled (comments and/or DMs)
- [ ] At least one automation rule created

### Test Scenarios

#### 1. **Unified Inbox Loading**
- [ ] Dashboard loads without errors
- [ ] Stats cards show correct counts
- [ ] Filter buttons display proper counts
- [ ] Empty state shows when no messages exist

#### 2. **Syncing Messages**
- [ ] Click "Sync Messages" button
- [ ] Both DMs and comments are synced
- [ ] Inbox refreshes with new messages
- [ ] Stats update correctly

#### 3. **Lead Identification**
- [ ] Messages with `price_inquiry` show 🔥🔥 badge
- [ ] Messages with `availability`/`location` show 🔥 badge
- [ ] Leads appear at the top of the inbox
- [ ] "Leads" filter shows only high-value messages

#### 4. **Pending Approvals**
- [ ] Pending items show with AI suggestion
- [ ] "Approve & Send" button sends reply to Instagram
- [ ] "Edit" button allows modifying reply before sending
- [ ] Edited reply is sent correctly
- [ ] "Reject" button removes item from queue
- [ ] Inbox refreshes after approval/rejection

#### 5. **Quick Reply**
- [ ] "Reply" button appears on unanswered messages
- [ ] Quick reply box opens below message
- [ ] Can type custom reply
- [ ] Ctrl+Enter sends the reply
- [ ] Reply is posted to Instagram (DM or comment)
- [ ] Message is marked as replied
- [ ] Inbox refreshes to show replied status

#### 6. **Filtering**
- [ ] "All" shows everything
- [ ] "Leads" shows only high-value intents
- [ ] "Pending" shows only queue items
- [ ] "Unanswered" shows only unreplied messages
- [ ] "Answered" shows only replied messages
- [ ] Counts update when filtering

## Keyboard Shortcuts

- **Ctrl+Enter** (in quick reply box) - Send reply
- **Escape** (in quick reply box) - Cancel and close

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/unified-inbox` | GET | Fetch all inbox items with filtering |
| `/api/quick-reply` | POST | Send custom reply to DM or comment |
| `/api/auto-reply/approve` | POST | Approve and send AI-generated reply |
| `/api/auto-reply/reject` | POST | Reject AI-generated reply |
| `/api/messages/sync` | POST | Sync Instagram DMs |
| `/api/comments/sync` | POST | Sync Instagram comments |

## Database Tables Used

- `instagram_messages` - DMs from Instagram
- `instagram_comments` - Comments from Instagram posts
- `auto_reply_queue` - Pending AI-generated replies
- `auto_reply_logs` - History of all auto-replies sent
- `automation_rules` - Exact-match automation rules
- `profiles` - User settings (auto_reply_comments_enabled, auto_reply_dms_enabled)

## Next Steps

1. **Test the unified dashboard** with real Instagram data
2. **Fine-tune lead scoring** if needed (adjust score values)
3. **Add more filters** if requested (e.g., by date range, by sender)
4. **Optimize performance** for users with many messages (pagination)
5. **Add notifications** for new leads or pending approvals

---

**Status:** ✅ Complete and ready to use!

The unified dashboard provides a powerful, streamlined workflow for managing Instagram DMs, comments, and AI auto-replies all in one place with intelligent lead identification and inline actions.
