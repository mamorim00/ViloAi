# Quick Fix for "Invalid App ID" Error

## What Was Wrong

The app was trying to use **Facebook OAuth** instead of **Instagram Basic Display API**.

## What I Fixed

✅ **Updated OAuth flow** to use Instagram's API endpoints
✅ **Fixed token exchange** to use correct Instagram endpoints
✅ **Updated user data fetching** to use Instagram Graph API
✅ **Added environment validation** to catch config issues early
✅ **Created detailed setup guide** (see META_APP_SETUP.md)

---

## Next Steps for You

### 1. Verify Your Meta App Settings

Go to: https://developers.facebook.com/apps/784307037713683/instagram-basic-display/basic-display/

**Check these settings:**

#### A. Valid OAuth Redirect URIs
Must include (exactly):
```
http://localhost:3000/api/auth/instagram/callback
```

#### B. Instagram Testers
1. Click "Add Instagram Testers"
2. Add your Instagram username
3. **CRITICAL**: Open Instagram app on phone → Settings → Apps and Websites → Tester Invites
4. Accept the invitation!

### 2. Restart Your Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Test the Connection

1. Go to http://localhost:3000
2. Login/Signup
3. Click "Connect Instagram"
4. Should redirect to Instagram authorization
5. Authorize the app
6. Get redirected back to dashboard

---

## Still Getting "Invalid App ID"?

### Check 1: App ID Matches
```bash
# In .env.local, your App ID is:
META_APP_ID=784307037713683

# Verify this matches in Meta Developer Console:
# Settings → Basic → App ID
```

### Check 2: Instagram Tester Invitation
This is the #1 most common issue!

1. Go to: https://developers.facebook.com/apps/784307037713683/instagram-basic-display/basic-display/
2. Scroll to "Instagram Testers"
3. Make sure your Instagram account is listed
4. Open Instagram app on phone
5. Settings → Apps and Websites → Tester Invites
6. **Accept the invitation** (if you haven't already)

### Check 3: Instagram Account Type
- Must be Business or Creator account
- Must be linked to a Facebook Page
- You must be admin of that Page

To check:
1. Instagram app → Settings → Account
2. Should say "Business" or "Creator"
3. Settings → Business → Linked Accounts → Facebook
4. Should show your Facebook Page

---

## Test Manually in Meta Console

Before testing in your app, verify it works in Meta:

1. Go to Instagram Basic Display settings
2. Find "User Token Generator" section
3. Click "Generate Token" next to your account
4. If this works → your app will work
5. If this fails → fix the setup first

---

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid App ID | App ID mismatch | Check Step 1 above |
| Redirect URI mismatch | URI not configured | Add exact URI in Meta console |
| User is not a tester | Invitation not accepted | Accept invitation in Instagram app |
| Account not eligible | Not Business/Creator | Convert to Business account |

---

## Quick Reference

**Your App ID**: 784307037713683

**Meta Dashboard**: https://developers.facebook.com/apps/784307037713683/dashboard/

**Instagram Basic Display**: https://developers.facebook.com/apps/784307037713683/instagram-basic-display/basic-display/

**Detailed Guide**: See `META_APP_SETUP.md`

---

## Changes Made to Code

If you're curious what was fixed:

1. **app/api/auth/instagram/route.ts**
   - Changed from Facebook OAuth to Instagram OAuth
   - Now uses: `https://api.instagram.com/oauth/authorize`

2. **lib/instagram/client.ts**
   - Updated `exchangeCodeForToken()` to use Instagram endpoint
   - Updated `getLongLivedToken()` to use `ig_exchange_token`
   - Updated `getInstagramUser()` to use Instagram Graph API

3. **New Files**
   - `META_APP_SETUP.md` - Detailed setup guide
   - `lib/env-check.ts` - Environment validation
   - `QUICK_FIX_INSTAGRAM.md` - This file!

---

**The app is now configured correctly for Instagram Basic Display API!** 🎉

Just complete the Meta app setup and you're good to go!
