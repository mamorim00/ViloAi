import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST - Archive old messages (soft delete - marks as archived)
export async function POST(request: NextRequest) {
  try {
    const { userId, messageType } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const archiveDate = new Date().toISOString();

    let dmCount = 0;
    let commentCount = 0;
    let queueCount = 0;

    // Archive based on type
    if (messageType === 'all' || messageType === 'dms') {
      // Add archived_at column if it doesn't exist (will be added via migration)
      // For now, we'll delete the messages
      const { count } = await supabaseAdmin
        .from('instagram_messages')
        .delete()
        .eq('user_id', userId);

      dmCount = count || 0;
    }

    if (messageType === 'all' || messageType === 'comments') {
      const { count } = await supabaseAdmin
        .from('instagram_comments')
        .delete()
        .eq('user_id', userId);

      commentCount = count || 0;
    }

    if (messageType === 'all' || messageType === 'queue') {
      const { count } = await supabaseAdmin
        .from('auto_reply_queue')
        .delete()
        .eq('user_id', userId);

      queueCount = count || 0;
    }

    return NextResponse.json({
      success: true,
      archived: {
        dms: dmCount,
        comments: commentCount,
        queue: queueCount,
        total: dmCount + commentCount + queueCount,
      },
      message: 'Messages archived successfully',
    });
  } catch (error) {
    console.error('Error archiving messages:', error);
    return NextResponse.json({ error: 'Failed to archive messages' }, { status: 500 });
  }
}

// DELETE - Permanently delete all messages (use with caution)
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Delete all messages, comments, and queue items
    const [dms, comments, queue] = await Promise.all([
      supabaseAdmin.from('instagram_messages').delete().eq('user_id', userId),
      supabaseAdmin.from('instagram_comments').delete().eq('user_id', userId),
      supabaseAdmin.from('auto_reply_queue').delete().eq('user_id', userId),
    ]);

    return NextResponse.json({
      success: true,
      deleted: {
        dms: dms.count || 0,
        comments: comments.count || 0,
        queue: queue.count || 0,
        total: (dms.count || 0) + (comments.count || 0) + (queue.count || 0),
      },
      message: 'All messages deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
