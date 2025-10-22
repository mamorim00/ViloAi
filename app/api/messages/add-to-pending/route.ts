import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemType, sourceId, aiSuggestion } = await request.json();

    if (!userId || !itemType || !sourceId || !aiSuggestion) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get message/comment details
    const table = itemType === 'comment' ? 'instagram_comments' : 'instagram_messages';
    const idColumn = itemType === 'comment' ? 'comment_id' : 'message_id';

    const { data: item, error: fetchError } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq(idColumn, sourceId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !item) {
      console.error('Error fetching item:', fetchError);
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Add to auto_reply_queue
    const { error: queueError } = await supabaseAdmin
      .from('auto_reply_queue')
      .insert({
        user_id: userId,
        message_id: itemType === 'dm' ? sourceId : null,
        comment_id: itemType === 'comment' ? sourceId : null,
        suggested_reply: aiSuggestion,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (queueError) {
      console.error('Error adding to queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to add to pending' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in add-to-pending endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
