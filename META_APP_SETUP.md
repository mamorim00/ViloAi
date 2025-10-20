# Meta App Setup Guide for ViloAi

This guide will walk you through setting up your Meta (Facebook) app to work with Instagram Basic Display API for ViloAi.

## ⚠️ Important Prerequisites

Before you start:
- ✅ You have a Meta (Facebook) Developer account
- ✅ Your Instagram account is converted to a **Business** or **Creator** account
- ✅ Your Instagram Business account is linked to a Facebook Page
- ✅ You are an admin of that Facebook Page

## Step 1: Create a Meta App

### 1.1 Go to Meta for Developers
Visit: https://developers.facebook.com/apps

### 1.2 Create New App
1. Click **"Create App"** button
2. Select **"Business"** as the app type
3. Click **"Next"**

### 1.3 App Details
1. **App Name**: `ViloAi` (or your preferred name)
2. **App Contact Email**: Your email address
3. **Business Account**: Select your business (or create one)
4. Click **"Create App"**

### 1.4 Get Your App ID and Secret
1. After creation, you'll see your **App ID** on the dashboard
2. Go to **Settings** → **Basic**
3. Copy your **App ID**
4. Click **"Show"** next to **App Secret** and copy it
5. Save these for later!

---

## Step 2: Add Instagram Basic Display Product

### 2.1 Add Product
1. In your app dashboard, scroll down to **"Add a Product"**
2. Find **"Instagram Basic Display"**
3. Click **"Set Up"**

### 2.2 Configure Instagram Basic Display
1. You'll be redirected to Instagram Basic Display settings
2. Scroll down to **"User Token Generator"** section

### 2.3 Add Instagram Testers (IMPORTANT!)
1. Still in Instagram Basic Display page
2. Scroll to **"Instagram Testers"** section
3. Click **"Add Instagram Testers"**
4. Enter your Instagram **username**
5. Click **"Submit"**

### 2.4 Accept Tester Invitation
1. Open Instagram app on your phone
2. Go to **Settings** → **Apps and Websites** → **Tester Invites**
3. Accept the invitation from your app
4. *This step is critical - the app won't work without it!*

---

## Step 3: Configure OAuth Redirect URIs

### 3.1 Set Valid OAuth Redirect URIs
1. In Instagram Basic Display settings
2. Scroll to **"Client OAuth Settings"**
3. Find **"Valid OAuth Redirect URIs"** field
4. Add these URLs (one per line):
   ```
   http://localhost:3000/api/auth/instagram/callback
   https://yourdomain.com/api/auth/instagram/callback
   ```
5. Find **"Deauthorize Callback URL"** field:
   ```
   http://localhost:3000/api/auth/instagram/deauthorize
   ```
6. Find **"Data Deletion Request URL"** field:
   ```
   http://localhost:3000/api/auth/instagram/delete
   ```
7. Click **"Save Changes"** at the bottom

---

## Step 4: Update Your Environment Variables

### 4.1 Open .env.local
Edit `/Users/amorimm1/Documents/mybot/.env.local`

### 4.2 Add Meta Credentials
```bash
# Meta/Instagram API
META_APP_ID=your_app_id_here          # From Step 1.4
META_APP_SECRET=your_app_secret_here   # From Step 1.4
META_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
```

### 4.3 Your Current Values
Based on your `.env.local`, you have:
```bash
META_APP_ID=784307037713683
META_APP_SECRET=ff77d18e4f991abf99467d3bd147f191
```

Make sure these match what's in your Meta Developer Console!

---

## Step 5: Verify Your Setup

### 5.1 Check App Mode
1. In Meta Developer Console, top of the page
2. You should see **"Development Mode"** toggle (in green)
3. This is correct for testing - DO NOT switch to Live mode yet

### 5.2 Test Instagram Connection
1. In Instagram Basic Display settings
2. Go to **"User Token Generator"** section
3. Click **"Add or Remove Instagram Testers"**
4. Make sure your Instagram account is listed
5. Click **"Generate Token"** next to your account
6. If it works here, it will work in your app!

---

## Step 6: Test in Your App

### 6.1 Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 6.2 Test the Flow
1. Open http://localhost:3000
2. Sign up / Log in
3. Click **"Connect Instagram"** in dashboard
4. You should be redirected to Instagram authorization
5. Authorize the app
6. You'll be redirected back to your dashboard

---

## Troubleshooting

### Error: "Invalid App ID"

**Cause**: Mismatch between your .env.local and Meta console

**Fix**:
1. Go to https://developers.facebook.com/apps
2. Select your app
3. Go to Settings → Basic
4. Copy the **exact** App ID
5. Update `META_APP_ID` in `.env.local`
6. Restart dev server

### Error: "Redirect URI Mismatch"

**Cause**: OAuth redirect URI not configured correctly

**Fix**:
1. Go to Instagram Basic Display settings
2. Check **"Valid OAuth Redirect URIs"**
3. Make sure it includes EXACTLY: `http://localhost:3000/api/auth/instagram/callback`
4. No trailing slashes, no typos
5. Save changes

### Error: "User is not a tester"

**Cause**: You haven't accepted the tester invitation

**Fix**:
1. Go to Instagram Basic Display
2. Add yourself as Instagram Tester
3. Open Instagram app on phone
4. Settings → Apps and Websites → Tester Invites
5. Accept the invitation
6. Try connecting again

### Error: "Instagram account not linked to Facebook Page"

**Cause**: Your Instagram Business account isn't properly linked

**Fix**:
1. Go to Facebook Page settings
2. Click "Instagram" in left sidebar
3. Connect your Instagram Business account
4. Make sure you're an admin of the Page

---

## Common Questions

### Q: Do I need to publish my app?
**A**: No! For development and testing with up to 5 Instagram accounts, Development Mode is perfect.

### Q: When do I need App Review?
**A**: Only when you want to:
- Support more than 5 Instagram accounts
- Make the app available to the public
- Go into production

### Q: What about Instagram Messaging API?
**A**: Instagram Basic Display is for user profile and media. For DM access, you'll need Instagram Messaging API which requires:
- Facebook Page with Instagram Professional account
- App Review for `instagram_manage_messages` permission
- Business verification

### Q: Can I test with multiple Instagram accounts?
**A**: Yes! Add up to 5 testers in the Instagram Testers section. Each must accept the invitation.

---

## Next Steps After Setup

1. ✅ Test Instagram connection in your app
2. ✅ Verify user data is fetched correctly
3. ✅ Test with different Instagram accounts (add more testers)
4. 📝 When ready for production:
   - Complete business verification
   - Submit for App Review
   - Request `instagram_manage_messages` permission
   - Switch to Live Mode after approval

---

## Quick Reference

### Your App Dashboard
https://developers.facebook.com/apps/784307037713683/dashboard/

### Instagram Basic Display Settings
https://developers.facebook.com/apps/784307037713683/instagram-basic-display/basic-display/

### Settings → Basic
https://developers.facebook.com/apps/784307037713683/settings/basic/

---

## Still Having Issues?

1. **Check Meta Status**: https://developers.facebook.com/status/
2. **Review Error Logs**: Check browser console and terminal
3. **Verify All Steps**: Go through this guide again
4. **Test Token Generator**: Try generating a token manually in Meta console

**Remember**: The most common issue is forgetting to accept the tester invitation in the Instagram app!

---

**Good luck! 🚀**
