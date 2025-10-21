import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MessageIntent } from '@/lib/types';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all messages in date range
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('instagram_messages')
      .select('intent, replied_at, timestamp, response_time_minutes')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Calculate summary statistics
    const totalMessages = messages?.length || 0;
    const repliedMessages = messages?.filter(m => m.replied_at !== null).length || 0;
    const responseRate = totalMessages > 0 ? (repliedMessages / totalMessages) * 100 : 0;

    // Calculate average response time (only for replied messages)
    const responseTimes = messages
      ?.filter(m => m.response_time_minutes !== null)
      .map(m => m.response_time_minutes!) || [];
    const avgResponseTimeMinutes = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    const avgResponseTimeHours = avgResponseTimeMinutes / 60;

    // Group messages by intent
    const messagesByIntent: Record<string, number> = {
      price_inquiry: 0,
      availability: 0,
      location: 0,
      general_question: 0,
      complaint: 0,
      compliment: 0,
      other: 0,
    };

    messages?.forEach(msg => {
      const intent = msg.intent || 'other';
      messagesByIntent[intent] = (messagesByIntent[intent] || 0) + 1;
    });

    // Group messages by date
    const messagesByDateMap = new Map<string, { count: number; replied: number }>();
    messages?.forEach(msg => {
      const date = new Date(msg.timestamp).toISOString().split('T')[0];
      const existing = messagesByDateMap.get(date) || { count: 0, replied: 0 };
      existing.count += 1;
      if (msg.replied_at) {
        existing.replied += 1;
      }
      messagesByDateMap.set(date, existing);
    });

    // Convert to array and fill missing dates
    const messagesByDate = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const data = messagesByDateMap.get(dateStr) || { count: 0, replied: 0 };
      messagesByDate.push({
        date: dateStr,
        count: data.count,
        replied: data.replied,
      });
    }

    return NextResponse.json({
      totalMessages,
      repliedMessages,
      responseRate: Math.round(responseRate * 10) / 10, // Round to 1 decimal
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
      messagesByIntent,
      messagesByDate,
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
}
