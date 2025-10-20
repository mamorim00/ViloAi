import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const metaAppId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!metaAppId || !redirectUri) {
    return NextResponse.json(
      { error: 'Meta app credentials not configured. Please check your .env.local file.' },
      { status: 500 }
    );
  }

  // Get the current user session
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // No-op for GET requests
        },
        remove(name: string, options: CookieOptions) {
          // No-op for GET requests
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('🔍 Checking user session...');
  console.log('User:', user?.id);
  console.log('Error:', userError);

  if (!user) {
    console.log('❌ No user found, redirecting to login');
    return NextResponse.redirect(new URL('/login?error=session_required', request.url));
  }

  // Generate a state parameter to verify the callback and associate it with the user
  const state = `${user.id}:${Date.now()}`;

  console.log('✅ User authenticated, redirecting to Facebook OAuth');

  // Instagram Messaging API OAuth URL (via Facebook Login)
  // Required scopes:
  // - pages_show_list: See user's Facebook Pages
  // - pages_read_engagement: Read page engagement data
  // - instagram_basic: Access basic Instagram account info
  // - instagram_manage_messages: Read and send Instagram DMs
  const scopes = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_messages';

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(authUrl);
}
