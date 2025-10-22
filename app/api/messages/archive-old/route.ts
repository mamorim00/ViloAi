import { NextRequest, NextResponse } from 'next/server';
import { archiveOldAnsweredMessages } from '@/lib/utils/archival';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional daysOld parameter (default 30)
    const body = await request.json();
    const daysOld = body.daysOld || 30;

    if (daysOld < 1 || daysOld > 365) {
      return NextResponse.json(
        { error: 'daysOld must be between 1 and 365' },
        { status: 400 }
      );
    }

    console.log(`📦 Archiving answered messages older than ${daysOld} days for user:`, user.id);

    // Archive old answered messages
    const { archivedMessages, archivedComments } = await archiveOldAnsweredMessages(
      user.id,
      daysOld
    );

    console.log(`✅ Archived ${archivedMessages} messages and ${archivedComments} comments`);

    return NextResponse.json({
      success: true,
      archivedMessages,
      archivedComments,
      message: `Archived ${archivedMessages + archivedComments} total items`,
    });
  } catch (error) {
    console.error('Error archiving old messages:', error);
    return NextResponse.json(
      { error: 'Failed to archive old messages' },
      { status: 500 }
    );
  }
}
