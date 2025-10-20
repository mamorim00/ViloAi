import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// PATCH /api/business-rules/[id] - Update existing business rule
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { rule_type, rule_key, rule_value, rule_metadata, is_active } = body;

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

    // Build update object (only include provided fields)
    const updates: any = { updated_at: new Date().toISOString() };
    if (rule_type !== undefined) updates.rule_type = rule_type;
    if (rule_key !== undefined) updates.rule_key = rule_key;
    if (rule_value !== undefined) updates.rule_value = rule_value;
    if (rule_metadata !== undefined) updates.rule_metadata = rule_metadata;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update rule (RLS ensures user can only update their own rules)
    const { data: updatedRule, error } = await supabaseAdmin
      .from('business_rules')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    if (!updatedRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ rule: updatedRule });
  } catch (error) {
    console.error('Error in PATCH /api/business-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/business-rules/[id] - Delete business rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Delete rule (RLS ensures user can only delete their own rules)
    const { error } = await supabaseAdmin
      .from('business_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting business rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/business-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
