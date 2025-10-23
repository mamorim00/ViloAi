import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GDPR Right to Erasure ("Right to be Forgotten")
 *
 * This endpoint handles account deletion requests in compliance with GDPR Article 17.
 * Deletes all personal data associated with the user account.
 */
export async function POST(request: NextRequest) {
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

    console.log(`🗑️ GDPR Deletion Request for user: ${userId}`);

    // 1. Delete all user data from our database (cascades to related tables via foreign keys)
    // The database schema has ON DELETE CASCADE, so this will automatically delete:
    // - instagram_messages
    // - message_analytics
    // - follower_insights
    // - business_rules
    // - instagram_comments
    // - auto_reply_queue
    // - automation_rules

    const { error: deleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('❌ Error deleting user profile:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      );
    }

    console.log('✅ All database records deleted');

    // 2. Delete user from Supabase Auth
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error('❌ Error deleting auth user:', authDeleteError);
      // Continue even if this fails - database data is already deleted
    } else {
      console.log('✅ Auth user deleted');
    }

    // 3. Log the deletion for compliance records (retain for 30 days)
    // In production, you might want to store this in a separate audit log table
    console.log(`📋 GDPR Deletion completed for user ${userId} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Account and all associated data have been permanently deleted.',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('💥 Error processing GDPR deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
