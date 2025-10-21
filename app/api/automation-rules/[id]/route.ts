import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { validateAutomationRule } from '@/lib/automation/matcher';

// PUT - Update an automation rule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id;
    const body = await request.json();
    const { trigger_type, trigger_text, reply_text, match_type, is_active } = body;

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

    const updateData: any = {};
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (trigger_text !== undefined) updateData.trigger_text = trigger_text;
    if (reply_text !== undefined) updateData.reply_text = reply_text;
    if (match_type !== undefined) updateData.match_type = match_type;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('automation_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating automation rule:', error);
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error('Error in PUT /api/automation-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an automation rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ruleId = params.id;

    const { error } = await supabaseAdmin
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting automation rule:', error);
      return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/automation-rules/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
