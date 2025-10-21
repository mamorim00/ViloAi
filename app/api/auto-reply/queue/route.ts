import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Fetch pending approval queue
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('auto_reply_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching queue:', error);
      return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }

    return NextResponse.json({ queue: data || [] });
  } catch (error) {
    console.error('Error in GET /api/auto-reply/queue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
