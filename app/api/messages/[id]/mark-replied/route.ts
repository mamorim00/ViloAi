import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { replied, reply_text } = await request.json();

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

    // Verify message belongs to user
    const { data: message, error: messageError } = await supabaseAdmin
      .from('instagram_messages')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update message reply status
    const updates: any = {
      replied_at: replied ? new Date().toISOString() : null,
      replied_by: replied ? 'manual' : null,
      reply_text: reply_text || null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from('instagram_messages')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking message as replied:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as replied' },
      { status: 500 }
    );
  }
}
