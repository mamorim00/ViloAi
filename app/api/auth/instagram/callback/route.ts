import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getLongLivedToken, getInstagramUser } from '@/lib/instagram/client';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  if (error || !code) {
    const errorMsg = errorDescription || 'Authorization failed';
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }

  // Verify state parameter exists
  if (!state) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url)
    );
  }

  // Extract user ID from state
  const [userId] = state.split(':');

  if (!userId) {
    return NextResponse.redirect(
      new URL('/dashboard?error=invalid_state', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);
    const shortLivedToken = tokenData.access_token;

    console.log('✅ Token received:', shortLivedToken.substring(0, 20) + '...');

    // Debug: Check what permissions this token has
    try {
      const permissionsCheck = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions?access_token=${shortLivedToken}`
      );
      const permsData = await permissionsCheck.json();
      console.log('🔐 Granted permissions:', JSON.stringify(permsData, null, 2));
    } catch (e) {
      console.error('Could not check permissions:', e);
    }

    // Get long-lived token
    const longLivedToken = await getLongLivedToken(shortLivedToken);

    // Get Instagram user info (includes page access token)
    const instagramUser = await getInstagramUser(longLivedToken);

    // Update user profile with Instagram credentials using the userId from state
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        instagram_connected: true,
        instagram_access_token: instagramUser.page_access_token,
        instagram_user_id: instagramUser.id,
        facebook_page_id: instagramUser.page_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update profile');
    }

    console.log('✅ Profile updated successfully for user:', userId);

    return NextResponse.redirect(
      new URL(`/dashboard?instagram_connected=true`, request.url)
    );
  } catch (err: any) {
    console.error('Instagram auth callback error:', err);
    const errorMsg = err.message || 'Failed to connect Instagram';
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(errorMsg)}`, request.url)
    );
  }
}
