import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAutomationRule } from '@/lib/automation/matcher';

// GET - List all automation rules for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching automation rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    return NextResponse.json({ rules: data || [] });
  } catch (error) {
    console.error('Error in GET /api/automation-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new automation rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, trigger_type, trigger_text, reply_text, match_type } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate the rule
    const validationErrors = validateAutomationRule({
      trigger_type,
      trigger_text,
      reply_text,
      match_type,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .insert({
        user_id: userId,
        trigger_type: trigger_type || 'both',
        trigger_text,
        reply_text,
        match_type: match_type || 'exact',
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating automation rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ rule: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/automation-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
