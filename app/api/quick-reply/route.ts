import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { replyToComment } from '@/lib/instagram/comments';
import { sendConversationMessage } from '@/lib/instagram/messaging';

// POST - Send a quick reply from the dashboard
export async function POST(request: NextRequest) {
  try {
    const { userId, itemType, sourceId, replyText, conversationId, senderId } = await request.json();

    if (!userId || !itemType || !sourceId || !replyText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, itemType, sourceId, replyText' },
        { status: 400 }
      );
    }

    // Get user's profile with access tokens
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('instagram_access_token, facebook_page_id')
      .eq('id', userId)
      .single();

    if (!profile?.instagram_access_token) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 }
      );
    }

    try {
      let instagramReplyId: string;

      if (itemType === 'comment') {
        // Reply to Instagram comment
        instagramReplyId = await replyToComment(
          sourceId, // comment_id
          replyText,
          profile.instagram_access_token
        );

        // Update the comment record
        await supabaseAdmin
          .from('instagram_comments')
          .update({
            replied_at: new Date().toISOString(),
            replied_by: 'manual',
            reply_text: replyText,
            reply_comment_id: instagramReplyId,
          })
          .eq('comment_id', sourceId);

      } else if (itemType === 'dm') {
        // Reply to Instagram DM
        if (!senderId || !profile.facebook_page_id) {
          throw new Error('Sender ID and Page ID required for DM reply');
        }

        instagramReplyId = await sendConversationMessage(
          profile.facebook_page_id,
          senderId,
          replyText,
          profile.instagram_access_token
        );

        // Update the message record
        await supabaseAdmin
          .from('instagram_messages')
          .update({
            replied_at: new Date().toISOString(),
            replied_by: 'manual',
            reply_text: replyText,
          })
          .eq('message_id', sourceId);

      } else {
        throw new Error('Invalid item type. Must be "comment" or "dm"');
      }

      return NextResponse.json({
        success: true,
        replyId: instagramReplyId,
        message: 'Reply sent successfully',
      });

    } catch (error: any) {
      console.error('Error sending quick reply:', error);
      return NextResponse.json(
        { error: 'Failed to send reply', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/quick-reply:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
