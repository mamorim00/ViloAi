# Instagram Graph API Message Retrieval Fix

## Problem Identified

The Instagram message retrieval was failing due to **using the wrong endpoint**. The code was attempting to fetch conversations using the Instagram User ID instead of the Facebook Page ID.

## Root Cause

The Instagram Messaging API requires calls to be made using the **Facebook Page ID**, not the Instagram Business Account ID. This is because Instagram Business Accounts are connected to Facebook Pages, and the Graph API routes messaging through the page.

### Incorrect Implementation (Before)
```typescript
// ❌ WRONG - Using Instagram User ID
const response = await axios.get(
  `https://graph.facebook.com/v21.0/${instagramUserId}/conversations`,
  { params: { platform: 'instagram', access_token: accessToken } }
);
```

### Correct Implementation (After)
```typescript
// ✅ CORRECT - Using Facebook Page ID
const response = await axios.get(
  `https://graph.facebook.com/v21.0/${pageId}/conversations`,
  { params: { platform: 'instagram', access_token: accessToken } }
);
```

## Changes Made

### 1. Database Schema Update
Added `facebook_page_id` column to the `profiles` table:

**File:** `supabase/schema.sql`
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  instagram_connected BOOLEAN DEFAULT FALSE,
  instagram_access_token TEXT,
  instagram_user_id TEXT,
  facebook_page_id TEXT,  -- NEW FIELD
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. OAuth Callback Update
Updated to store the Facebook Page ID during Instagram connection:

**File:** `app/api/auth/instagram/callback/route.ts`
```typescript
const { error: updateError } = await supabaseAdmin
  .from('profiles')
  .update({
    instagram_connected: true,
    instagram_access_token: instagramUser.page_access_token,
    instagram_user_id: instagramUser.id,
    facebook_page_id: instagramUser.page_id,  // NEW FIELD
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId);
```

### 3. Instagram Client API Update
Changed the `getInstagramConversations` function to use Page ID:

**File:** `lib/instagram/client.ts`
```typescript
export async function getInstagramConversations(
  pageId: string,  // Changed from instagramUserId
  accessToken: string
) {
  const response = await axios.get(
    `${META_API_BASE}/${pageId}/conversations`,  // Using pageId
    {
      params: {
        platform: 'instagram',
        access_token: accessToken,
        fields: 'id,updated_time,participants',
      },
    }
  );
  return response.data.data || [];
}
```

### 4. Message Sync Route Update
Updated to fetch and use the Facebook Page ID:

**File:** `app/api/messages/sync/route.ts`
```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('instagram_access_token, instagram_user_id, facebook_page_id')  // Added facebook_page_id
  .eq('id', userId)
  .single();

const conversations = await getInstagramConversations(
  profile.facebook_page_id,  // Using Page ID instead of Instagram User ID
  profile.instagram_access_token
);
```

### 5. TypeScript Types Update
Added the new field to the Profile interface:

**File:** `lib/types.ts`
```typescript
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  instagram_connected: boolean;
  instagram_access_token?: string;
  instagram_user_id?: string;
  facebook_page_id?: string;  // NEW FIELD
  stripe_customer_id?: string;
  subscription_status: string;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}
```

### 6. Added Debug Logging
Enhanced error visibility with detailed console logs:
- Log when fetching conversations with Page ID
- Log number of conversations found
- Log detailed error messages from Graph API
- Log message sync progress

## Migration Steps

### For New Installations
1. Run the updated `supabase/schema.sql` in your Supabase SQL Editor
2. Deploy the code changes
3. Connect Instagram accounts normally

### For Existing Installations
1. Run the migration SQL:
   ```bash
   # In Supabase SQL Editor, execute:
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS facebook_page_id TEXT;
   ```

2. **Existing users must reconnect their Instagram accounts** to populate the `facebook_page_id` field:
   - Go to Dashboard
   - Disconnect Instagram (if connected)
   - Connect Instagram again
   - The new OAuth flow will save the Page ID

Alternatively, run: `supabase/migration_add_facebook_page_id.sql`

## Testing the Fix

1. **Reconnect Instagram:**
   - Navigate to `/dashboard`
   - Click "Connect Instagram"
   - Complete OAuth flow
   - Verify in database that `facebook_page_id` is populated

2. **Test Message Sync:**
   - Click "Sync Messages" in dashboard
   - Check browser console for logs:
     ```
     🔄 Starting Instagram message sync for user: [user-id]
     📄 Using Facebook Page ID: [page-id]
     🔍 Fetching Instagram conversations for page: [page-id]
     📬 Conversations found: [count]
     💬 Fetching messages for conversation: [conversation-id]
     ✉️ Messages in conversation: [count]
     ```

3. **Verify Data:**
   - Check `instagram_messages` table in Supabase
   - Verify messages are being stored with AI analysis
   - Check dashboard for message analytics

## Common Errors & Solutions

### Error: "Instagram not connected"
**Cause:** `facebook_page_id` is missing from profile
**Solution:** Reconnect Instagram account

### Error: Graph API returns 400/403
**Cause:** Missing permissions or wrong token
**Solution:**
- Verify app has `instagram_manage_messages` permission
- Ensure user is Page Admin (not Editor)
- Check that Page Access Token is being used (not User Access Token)

### Error: "No conversations found" (empty array)
**Possible Causes:**
1. No DMs exist in the Instagram Business Account
2. App doesn't have message permissions
3. Instagram account is not a Business account
4. Account not properly connected to Facebook Page

**Solution:**
- Send a test DM to the Instagram account
- Verify permissions in Meta App Dashboard
- Confirm Instagram Business Account setup

## Key Takeaways

1. **Always use Facebook Page ID** for Instagram Messaging API calls, not Instagram User ID
2. **Store the Page Access Token** (not the user's access token) for API calls
3. **Page ID is different from Instagram User ID** - both are needed for different purposes:
   - Page ID: For making API calls to conversations/messages
   - Instagram User ID: For identifying the Instagram account
4. **Test with actual DMs** - the API won't return data if there are no conversations

## Additional Resources

- [Meta Instagram Messaging API Documentation](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Platform - Conversations API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/conversations-api/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/) - Test API calls directly

## Verification Checklist

- [ ] Database has `facebook_page_id` column in profiles table
- [ ] OAuth callback stores `facebook_page_id` when connecting Instagram
- [ ] Message sync route uses `facebook_page_id` for API calls
- [ ] TypeScript types updated to include `facebook_page_id`
- [ ] Console logs show "Using Facebook Page ID: [id]" during sync
- [ ] Messages appear in database after sync
- [ ] Dashboard displays synced messages with AI analysis
