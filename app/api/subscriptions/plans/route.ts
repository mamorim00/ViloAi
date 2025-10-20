import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get all active subscription plans
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
