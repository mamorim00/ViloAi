# Instagram Messaging API Setup Guide

Your app is now configured to use **Instagram Messaging API** which gives you access to Instagram DMs!

## Prerequisites

Before you start, make sure you have:

✅ **Instagram Professional Account** (Business or Creator)
✅ **Facebook Page** connected to your Instagram
✅ **Admin access** to that Facebook Page
✅ **Meta Developer Account** with app created

---

## Step 1: Configure Your Meta App

### Your App Details:
- **App ID**: `1483027173029324`
- **Dashboard**: https://developers.facebook.com/apps/1483027173029324/

### 1.1 Add Required Use Cases

**CRITICAL**: Your app needs these Use Cases enabled:

1. Go to your app dashboard
2. Click **"Use Cases"** in the left sidebar
3. Add these use cases if not already added:
   - **"Authenticate and request data from users"** - For Facebook Login
   - **"Instagram Messaging"** or **"Messaging"** - For Instagram DMs access

### 1.2 Configure OAuth Redirect URI

1. Still in **"Use Cases"**
2. Click on **"Authenticate and request data"** use case
3. Click **"Customize"** or **"Configure"** or **"Settings"**
4. Look for **"Valid OAuth Redirect URIs"** section
5. Add this **Valid OAuth Redirect URI**:
   ```
   http://localhost:3000/api/auth/instagram/callback
   ```
6. **Save changes**

### 1.3 Add Required Permissions to Your Use Case

1. Still in the **"Authenticate and request data"** use case
2. Look for **"Permissions"** or **"Add API permissions"** section
3. Add these permissions:
   - ✅ `pages_show_list` - List user's Facebook Pages
   - ✅ `pages_read_engagement` - Read page engagement
   - ✅ `instagram_basic` - Basic Instagram access
   - ✅ `instagram_manage_messages` - Read/send DMs
   - ✅ `pages_manage_metadata` - Manage page settings
4. Click **"Add"** or **"Save"** for each permission

---

## Step 2: Connect Instagram to Facebook Page

This is **CRITICAL** - Instagram Messaging API requires a Facebook Page.

### 2.1 Convert Instagram to Professional Account

1. Open Instagram app
2. Go to **Settings** → **Account**
3. Tap **"Switch to Professional Account"**
4. Choose **Business** or **Creator**
5. Complete the setup

### 2.2 Link Instagram to Facebook Page

1. Still in Instagram Settings
2. Go to **Business** → **Linked Accounts**
3. Tap **Facebook**
4. Log in and select your Facebook Page
5. Complete the linking

### 2.3 Verify the Connection

1. Go to your Facebook Page
2. Click **Settings**
3. In left sidebar, click **Instagram**
4. You should see your Instagram account connected
5. Make sure it says **"Connected"** with a green checkmark

---

## Step 3: Grant Page Permissions

### 3.1 Add Yourself as Page Admin

1. Go to your Facebook Page settings
2. Click **"Page roles"** or **"Page access"**
3. Make sure your Facebook account is listed as **Admin**

### 3.2 Test in Meta Console

Before testing in your app, verify it works in Meta:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Click **"Generate Access Token"**
4. Grant all requested permissions
5. If you can get a token → setup is correct!

---

## Step 4: Required Permissions

Your app needs these permissions (already configured in the code):

- ✅ `instagram_basic` - Basic Instagram access
- ✅ `instagram_manage_messages` - Read and send DMs
- ✅ `pages_manage_metadata` - Page management
- ✅ `pages_read_engagement` - Read page engagement
- ✅ `pages_show_list` - List user's pages

**Note**: Some permissions may require App Review for production, but work in Development Mode for testing.

---

## Step 5: Test the Connection

### 5.1 Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 5.2 Test in Your App

1. Go to http://localhost:3000
2. Login/Signup
3. Click **"Connect Instagram"**
4. You'll be redirected to Facebook OAuth
5. **Grant all permissions** when asked
6. You'll be redirected back to dashboard

### 5.3 Expected Flow

```
Your App → Facebook OAuth → Permission Request → Callback → Dashboard
```

You should see:
- Permission screen listing all scopes
- Request for access to your Facebook Page
- Request for Instagram messaging access

---

## Troubleshooting

### Error: "Invalid platform app"

**Cause**: OAuth redirect URI not configured

**Fix**:
1. Go to Use Cases → Configure
2. Add exact redirect URI: `http://localhost:3000/api/auth/instagram/callback`
3. Save and try again

### Error: "No Facebook Pages found"

**Cause**: You don't have admin access to any Facebook Pages

**Fix**:
1. Create a Facebook Page (if you don't have one)
2. Or get admin access to an existing Page
3. Make sure your Instagram is connected to that Page

### Error: "No Instagram Business Account connected"

**Cause**: Instagram not linked to Facebook Page

**Fix**:
1. Instagram Settings → Business → Linked Accounts → Facebook
2. Connect your Instagram to the Facebook Page
3. OR in Facebook Page Settings → Instagram → Connect Account

### Error: "This app is in Development Mode"

**This is CORRECT!** Development Mode allows you to test without App Review.

**What you can do in Development Mode:**
- ✅ Test with your own Instagram account
- ✅ Access DMs and conversations
- ✅ Full app functionality
- ❌ Can't use with other people's accounts (need App Review)

---

## Verification Checklist

Before connecting, verify:

- [ ] Instagram is Professional (Business/Creator) account
- [ ] Instagram is linked to a Facebook Page
- [ ] You are admin of that Facebook Page
- [ ] OAuth redirect URI is configured in Meta app
- [ ] App is in Development Mode
- [ ] Dev server is running

---

## Understanding the Flow

### What Happens When You Connect:

1. **User clicks "Connect Instagram"**
   - App redirects to Facebook OAuth

2. **Facebook OAuth Authorization**
   - User grants permissions
   - Facebook returns authorization code

3. **Token Exchange**
   - App exchanges code for access token
   - Gets long-lived token (60 days)

4. **Get User's Facebook Pages**
   - App fetches pages where user is admin

5. **Get Instagram Business Account**
   - App finds Instagram account linked to page
   - Gets Instagram user ID

6. **Save to Database**
   - Stores access token in Supabase
   - Marks Instagram as connected

7. **Fetch Messages**
   - Can now fetch Instagram DMs
   - Analyze with AI
   - Generate reply suggestions

---

## Next Steps After Connection

Once Instagram is connected:

1. ✅ Click **"Sync"** button to fetch DMs
2. ✅ View messages in dashboard
3. ✅ See AI intent analysis
4. ✅ Get Finnish & English reply suggestions
5. ✅ Check follower insights

---

## Development vs Production

### Development Mode (Current):
- Works with your Instagram account
- Up to 5 test users
- No App Review needed
- All features available

### Production Mode (Future):
When you want to launch to customers:

1. **Complete Business Verification**
   - Verify your business with Meta
   - Provide business documents

2. **Submit for App Review**
   - Request `instagram_manage_messages` permission
   - Provide use case description
   - Record demo video
   - Wait 3-7 days for approval

3. **Switch to Live Mode**
   - After approval, switch app to Live
   - Can now work with any Instagram account

---

## Common Questions

### Q: Do I need App Review to test?
**A**: No! Development Mode lets you test with your own account.

### Q: Can I test with multiple Instagram accounts?
**A**: Yes, add them as test users in Meta Developer Console (up to 5).

### Q: What if I don't have a Facebook Page?
**A**: Create one! It's free and takes 2 minutes:
1. Go to https://facebook.com/pages/create
2. Follow the steps
3. Then link your Instagram to it

### Q: Will this work with Personal Instagram accounts?
**A**: No, you must convert to Business or Creator account first.

---

## Quick Reference

**Your App ID**: `1483027173029324`

**App Dashboard**: https://developers.facebook.com/apps/1483027173029324/

**Graph API Explorer**: https://developers.facebook.com/tools/explorer/

**Redirect URI**: `http://localhost:3000/api/auth/instagram/callback`

---

## Support Links

- [Instagram Messaging API Docs](https://developers.facebook.com/docs/messenger-platform/instagram)
- [Instagram Platform API](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api)

---

**You're all set! The app is now configured for Instagram Messaging API.** 🎉

Just make sure your Instagram is connected to a Facebook Page and you're good to go!
