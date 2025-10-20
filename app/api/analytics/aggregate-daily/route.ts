import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verify request has authorization (in production, use API key or cron secret)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting daily analytics aggregation');

    // Get all users with Instagram connected
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('instagram_connected', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let processedUsers = 0;
    let updatedFollowers = 0;

    // Process each user
    for (const user of users || []) {
      try {
        await aggregateUserInsights(user.id);
        processedUsers++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        continue;
      }
    }

    // Update job status
    await supabaseAdmin
      .from('analytics_jobs')
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: getNextRunDate(),
        status: 'completed',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('job_type', 'daily_aggregation');

    console.log(`✅ Daily aggregation completed: ${processedUsers} users processed`);

    return NextResponse.json({
      success: true,
      processed_users: processedUsers,
      updated_followers: updatedFollowers,
    });
  } catch (error) {
    console.error('Error in daily aggregation:', error);

    // Update job status to failed
    await supabaseAdmin
      .from('analytics_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('job_type', 'daily_aggregation');

    return NextResponse.json(
      { error: 'Daily aggregation failed' },
      { status: 500 }
    );
  }
}

async function aggregateUserInsights(userId: string) {
  // Get all messages for this user grouped by sender
  const { data: messages, error } = await supabaseAdmin
    .from('instagram_messages')
    .select('sender_id, sender_username, sender_name, timestamp, replied_at')
    .eq('user_id', userId);

  if (error || !messages || messages.length === 0) {
    return;
  }

  // Group messages by sender
  const senderStats = new Map<string, {
    username?: string;
    name?: string;
    message_count: number;
    last_message_at: string;
    replied_count: number;
  }>();

  for (const message of messages) {
    const existing = senderStats.get(message.sender_id) || {
      username: message.sender_username,
      name: message.sender_name,
      message_count: 0,
      last_message_at: message.timestamp,
      replied_count: 0,
    };

    existing.message_count += 1;
    if (message.replied_at) {
      existing.replied_count += 1;
    }

    // Update last message timestamp if more recent
    if (new Date(message.timestamp) > new Date(existing.last_message_at)) {
      existing.last_message_at = message.timestamp;
    }

    senderStats.set(message.sender_id, existing);
  }

  // Upsert follower insights
  for (const [senderId, stats] of senderStats.entries()) {
    // Calculate engagement score:
    // - Base score from message count
    // - Bonus for responses
    // - Recency factor
    const baseScore = stats.message_count * 10;
    const responseBonus = stats.replied_count * 5;
    const daysSinceLastMessage = Math.floor(
      (Date.now() - new Date(stats.last_message_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyFactor = Math.max(0, 100 - daysSinceLastMessage * 2);

    const totalEngagementScore = baseScore + responseBonus + recencyFactor;

    await supabaseAdmin
      .from('follower_insights')
      .upsert({
        user_id: userId,
        follower_id: senderId,
        follower_username: stats.username,
        follower_name: stats.name,
        message_count: stats.message_count,
        last_message_at: stats.last_message_at,
        total_engagement_score: totalEngagementScore,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,follower_id',
      });
  }
}

function getNextRunDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0); // Run at 2 AM
  return tomorrow.toISOString();
}
