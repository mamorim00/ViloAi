import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { replyToComment } from '@/lib/instagram/comments';
import { sendConversationMessage } from '@/lib/instagram/messaging';

// POST - Approve and send a reply
export async function POST(request: NextRequest) {
  try {
    const { queueItemId, userId, editedReply } = await request.json();

    if (!queueItemId || !userId) {
      return NextResponse.json(
        { error: 'Queue item ID and user ID required' },
        { status: 400 }
      );
    }

    // Get queue item
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('auto_reply_queue')
      .select('*')
      .eq('id', queueItemId)
      .eq('user_id', userId)
      .single();

    if (queueError || !queueItem) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    if (queueItem.status !== 'pending') {
      return NextResponse.json(
        { error: 'Queue item already processed' },
        { status: 400 }
      );
    }

    // Get user's access token
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

    const replyText = editedReply || queueItem.suggested_reply;

    try {
      let instagramReplyId: string;

      // Send reply based on message type
      if (queueItem.message_type === 'comment') {
        instagramReplyId = await replyToComment(
          queueItem.message_id,
          replyText,
          profile.instagram_access_token
        );

        // Update the comment record
        await supabaseAdmin
          .from('instagram_comments')
          .update({
            replied_at: new Date().toISOString(),
            replied_by: 'ai_approved',
            reply_text: replyText,
            reply_comment_id: instagramReplyId,
          })
          .eq('comment_id', queueItem.message_id);
      } else {
        // DM - Use page_id + sender_id to send the reply
        if (!queueItem.sender_id) {
          throw new Error('Sender ID missing for DM reply');
        }

        if (!profile.facebook_page_id) {
          throw new Error('Facebook Page ID missing');
        }

        instagramReplyId = await sendConversationMessage(
          profile.facebook_page_id, // Use page ID
          queueItem.sender_id, // Use sender ID (recipient)
          replyText,
          profile.instagram_access_token
        );

        // Update the message record
        await supabaseAdmin
          .from('instagram_messages')
          .update({
            replied_at: new Date().toISOString(),
            replied_by: 'instagram_auto',
            reply_text: replyText,
          })
          .eq('message_id', queueItem.message_id);
      }

      // Update queue item status
      await supabaseAdmin
        .from('auto_reply_queue')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          final_reply: editedReply || null,
        })
        .eq('id', queueItemId);

      // Log the reply
      await supabaseAdmin.from('auto_reply_logs').insert({
        user_id: userId,
        message_type: queueItem.message_type,
        message_id: queueItem.message_id,
        original_message_text: queueItem.message_text,
        sender_username: queueItem.sender_username,
        reply_text: replyText,
        reply_type: 'ai_approved',
        instagram_reply_id: instagramReplyId,
        success: true,
      });

      return NextResponse.json({
        success: true,
        replyId: instagramReplyId,
      });
    } catch (error: any) {
      console.error('Error sending reply:', error);

      // Update queue status to rejected with error
      await supabaseAdmin
        .from('auto_reply_queue')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: error.message || 'Failed to send reply',
        })
        .eq('id', queueItemId);

      // Log failed attempt
      await supabaseAdmin.from('auto_reply_logs').insert({
        user_id: userId,
        message_type: queueItem.message_type,
        message_id: queueItem.message_id,
        original_message_text: queueItem.message_text,
        sender_username: queueItem.sender_username,
        reply_text: replyText,
        reply_type: 'ai_approved',
        success: false,
        error_message: error.message,
      });

      return NextResponse.json(
        { error: 'Failed to send reply', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/auto-reply/approve:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
