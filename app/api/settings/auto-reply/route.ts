import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// PUT - Update auto-reply settings
export async function PUT(request: NextRequest) {
  try {
    const { userId, auto_reply_comments_enabled, auto_reply_dms_enabled } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (auto_reply_comments_enabled !== undefined) {
      updateData.auto_reply_comments_enabled = auto_reply_comments_enabled;
    }
    if (auto_reply_dms_enabled !== undefined) {
      updateData.auto_reply_dms_enabled = auto_reply_dms_enabled;
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating auto-reply settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        auto_reply_comments_enabled: data.auto_reply_comments_enabled,
        auto_reply_dms_enabled: data.auto_reply_dms_enabled,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/settings/auto-reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get current auto-reply settings
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('auto_reply_comments_enabled, auto_reply_dms_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      settings: {
        auto_reply_comments_enabled: data.auto_reply_comments_enabled || false,
        auto_reply_dms_enabled: data.auto_reply_dms_enabled || false,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/settings/auto-reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
