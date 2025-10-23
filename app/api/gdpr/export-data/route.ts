import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GDPR Right to Data Portability (Article 20)
 *
 * This endpoint allows users to export all their personal data in a machine-readable format (JSON).
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the authorization header or session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization header' },
        { status: 401 }
      );
    }

    // Extract the user ID from the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = user.id;

    console.log(`📦 GDPR Data Export Request for user: ${userId}`);

    // Fetch all user data
    const [
      profileResult,
      messagesResult,
      commentsResult,
      analyticsResult,
      followersResult,
      rulesResult,
      automationRulesResult,
      queueResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('instagram_messages').select('*').eq('user_id', userId),
      supabaseAdmin.from('instagram_comments').select('*').eq('user_id', userId),
      supabaseAdmin.from('message_analytics').select('*').eq('user_id', userId),
      supabaseAdmin.from('follower_insights').select('*').eq('user_id', userId),
      supabaseAdmin.from('business_rules').select('*').eq('user_id', userId),
      supabaseAdmin.from('automation_rules').select('*').eq('user_id', userId),
      supabaseAdmin.from('auto_reply_queue').select('*').eq('user_id', userId),
    ]);

    // Compile all data into a single export object
    const exportData = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        userId: userId,
        email: user.email,
        format: 'JSON',
        gdprCompliant: true,
      },
      profile: profileResult.data || null,
      instagramMessages: messagesResult.data || [],
      instagramComments: commentsResult.data || [],
      messageAnalytics: analyticsResult.data || [],
      followerInsights: followersResult.data || [],
      businessRules: rulesResult.data || [],
      automationRules: automationRulesResult.data || [],
      autoReplyQueue: queueResult.data || [],
      statistics: {
        totalMessages: (messagesResult.data || []).length,
        totalComments: (commentsResult.data || []).length,
        totalAnalytics: (analyticsResult.data || []).length,
        totalFollowers: (followersResult.data || []).length,
        totalRules: (rulesResult.data || []).length,
        totalAutomationRules: (automationRulesResult.data || []).length,
        totalQueueItems: (queueResult.data || []).length,
      },
    };

    console.log('✅ Data export prepared successfully');

    // Return JSON data
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="viloai-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('💥 Error exporting GDPR data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
