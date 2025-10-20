import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getUserUsageStats } from '@/lib/utils/usage';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get usage statistics
    const usageStats = await getUserUsageStats(user.id);

    if (!usageStats) {
      return NextResponse.json(
        { error: 'Could not fetch usage statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}
