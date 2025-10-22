# Database Reset Scripts

⚠️ **WARNING**: These scripts will **DELETE ALL DATA** from your database including users, messages, subscriptions, and authentication. Use only for testing purposes!

## Available Scripts

### 1. SQL Script (Supabase SQL Editor)

**File:** `reset-database.sql`

**Usage:**
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `reset-database.sql`
4. Click "Run" to execute

**What it does:**
- Deletes all rows from application tables
- Deletes all users from `auth.users`
- Verifies deletion by counting remaining rows

### 2. Node.js Script (CLI)

**File:** `reset-database.js`

**Prerequisites:**
```bash
npm install @supabase/supabase-js dotenv
```

**Usage:**
```bash
node scripts/reset-database.js
```

**What it does:**
- Connects to Supabase using service role key from `.env.local`
- Waits 5 seconds (giving you time to cancel with Ctrl+C)
- Deletes all application data in correct order
- Deletes all auth users using admin API
- Verifies deletion and shows remaining row counts

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Tables That Will Be Cleared

1. ✅ `auth.users` - All user accounts and authentication
2. ✅ `profiles` - User profiles and subscription data
3. ✅ `instagram_messages` - All Instagram DMs
4. ✅ `instagram_comments` - All Instagram comments
5. ✅ `message_analytics` - Message analytics data
6. ✅ `follower_insights` - Follower engagement data
7. ✅ `auto_reply_queue` - Pending auto-replies
8. ✅ `automation_rules` - Automation configurations

## When to Use

Use these scripts when you want to:
- 🧪 Start fresh testing with clean database
- 🔄 Reset development environment
- 🐛 Debug issues that require clean state
- 🚀 Prepare for production deployment testing

## ⚠️ Important Notes

1. **Irreversible**: Once data is deleted, it **cannot be recovered**
2. **Production**: **NEVER** run these scripts on production database
3. **Backups**: Consider taking a Supabase backup before running
4. **RLS Policies**: These scripts do **not** delete RLS policies, functions, or triggers
5. **Subscription Plans**: The `subscription_plans` table is **not** cleared (seed data preserved)

## Safety Tips

1. **Always double-check** you're connected to the correct Supabase project
2. **Never** run on production environment
3. **Create a backup** if you have any data you might need
4. **Use version control** to track when resets were performed
5. **Test incrementally** after reset to ensure everything works

## After Reset

After running the reset script:

1. ✅ Database is completely clean
2. ✅ No users exist (you'll need to sign up again)
3. ✅ No messages or data
4. ✅ You can test complete signup → Instagram connect → sync → reply flow
5. ✅ Test Stripe subscription from scratch

## Troubleshooting

### "Permission denied for table auth.users"
- Make sure you're using the **Service Role Key** (not anon key)
- In SQL Editor, you may need to run as superuser

### "Cannot delete from auth.users"
- Use the Node.js script instead (uses admin API)
- Or run SQL script as Supabase superuser

### Script hangs or times out
- Check your internet connection
- Verify Supabase project is running
- Try running table deletions one at a time

## Example Output (Node.js Script)

```
🚨 WARNING: This will DELETE ALL DATA from the database!
📋 Tables to be cleared:
   - auth.users (all users and authentication)
   - profiles
   - instagram_messages
   ...

⏳ Waiting 5 seconds... Press Ctrl+C to cancel.

🔄 Starting database reset...

1️⃣  Deleting follower_insights...
2️⃣  Deleting message_analytics...
...
8️⃣  Deleting auth.users...
   Found 3 users to delete
   ✓ Deleted user: test@example.com
   ✓ Deleted user: admin@example.com
   ✓ Deleted user: user@example.com

✅ Database reset complete!

📊 Verification - Remaining rows:
   profiles: 0 rows
   instagram_messages: 0 rows
   instagram_comments: 0 rows
   message_analytics: 0 rows
   follower_insights: 0 rows
   auto_reply_queue: 0 rows
   automation_rules: 0 rows
   auth.users: 0 rows

🎉 All done! Database is now clean.
```

---

**Last Updated:** 2025-10-22
