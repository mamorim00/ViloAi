import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, itemType, sourceId } = await request.json();

    if (!userId || !itemType || !sourceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update the message/comment to mark it as archived
    const table = itemType === 'comment' ? 'instagram_comments' : 'instagram_messages';
    const idColumn = itemType === 'comment' ? 'comment_id' : 'message_id';

    const { error } = await supabaseAdmin
      .from(table)
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq(idColumn, sourceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error ignoring message:', error);
      return NextResponse.json(
        { error: 'Failed to ignore message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in ignore endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
