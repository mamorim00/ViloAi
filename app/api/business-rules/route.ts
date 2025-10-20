import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { BusinessRule, RuleType } from '@/lib/types';

// GET /api/business-rules - Fetch all business rules for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleType = searchParams.get('rule_type') as RuleType | null;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user from session (simplified - in production, verify JWT properly)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabaseAdmin
      .from('business_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Optional filter by rule_type
    if (ruleType) {
      query = query.eq('rule_type', ruleType);
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching business rules:', error);
      return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error('Error in GET /api/business-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/business-rules - Create new business rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rule_type, rule_key, rule_value, rule_metadata, is_active } = body;

    // Validation
    if (!rule_type || !rule_key || !rule_value) {
      return NextResponse.json(
        { error: 'Missing required fields: rule_type, rule_key, rule_value' },
        { status: 400 }
      );
    }

    // Validate rule_type
    const validTypes: RuleType[] = ['price', 'business_info', 'inventory', 'faq', 'other'];
    if (!validTypes.includes(rule_type)) {
      return NextResponse.json(
        { error: 'Invalid rule_type. Must be one of: price, business_info, inventory, faq, other' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert rule
    const { data: newRule, error } = await supabaseAdmin
      .from('business_rules')
      .insert({
        user_id: user.id,
        rule_type,
        rule_key,
        rule_value,
        rule_metadata: rule_metadata || {},
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating business rule:', error);
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/business-rules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
