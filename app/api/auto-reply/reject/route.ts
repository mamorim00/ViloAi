import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST - Reject a queued reply
export async function POST(request: NextRequest) {
  try {
    const { queueItemId, userId, reason } = await request.json();

    if (!queueItemId || !userId) {
      return NextResponse.json(
        { error: 'Queue item ID and user ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('auto_reply_queue')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Rejected by user',
      })
      .eq('id', queueItemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting queue item:', error);
      return NextResponse.json({ error: 'Failed to reject item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    console.error('Error in POST /api/auto-reply/reject:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
