import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getConversationMessages } from '@/lib/instagram/client';
import { sendConversationMessage } from '@/lib/instagram/messaging';
import { replyToComment } from '@/lib/instagram/comments';
import { analyzeMessageIntent, analyzeMessageWithContext } from '@/lib/ai';
import { findMatchingAutomationRule } from '@/lib/automation/matcher';
import { AutomationRule, BusinessRule } from '@/lib/types';
import { canAnalyzeMessage, incrementMessageCount } from '@/lib/utils/usage';
import crypto from 'crypto';

/**
 * Instagram Webhook Handler - Receives real-time notifications from Instagram
 *
 * This enables INSTANT automation replies instead of waiting for manual sync.
 *
 * Instagram sends webhooks for:
 * - New DMs (messages field)
 * - New comments (comments field)
 * - Story mentions, etc.
 *
 * Webhook Setup:
 * 1. Register webhook URL in Meta App Dashboard
 * 2. Subscribe to 'messages' and 'comments' fields
 * 3. Provide verify token (set in META_WEBHOOK_VERIFY_TOKEN env var)
 * 4. Instagram will send GET request to verify, then POST for events
 */

// Webhook verification (Instagram sends this on setup)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'viloai_webhook_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('❌ Webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// Webhook event handler (Instagram sends POST for new messages/comments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature (security)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && process.env.META_APP_SECRET) {
      const isValid = verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        process.env.META_APP_SECRET
      );
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    console.log('📨 Received Instagram webhook:', JSON.stringify(body, null, 2));

    // Process each entry in the webhook
    for (const entry of body.entry || []) {
      // Handle messaging events (DMs)
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await handleDMEvent(event, entry.id);
        }
      }

      // Handle comment events
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleCommentEvent(change.value);
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Instagram from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Verify webhook signature to ensure request is from Instagram
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle incoming DM event from webhook
 */
async function handleDMEvent(event: any, pageId: string) {
  try {
    // Only process messages sent TO the business (not from business)
    if (!event.message || event.message.is_echo) {
      return;
    }

    const senderId = event.sender.id;
    const messageId = event.message.mid;
    const messageText = event.message.text || '';

    if (!messageText) {
      console.log('⏭️ Skipping message without text');
      return;
    }

    console.log(`📩 New DM from ${senderId}: "${messageText}"`);

    // Find which user owns this Instagram page
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('facebook_page_id', pageId)
      .single();

    if (!profile || !profile.instagram_access_token) {
      console.log('⚠️ No profile found for page:', pageId);
      return;
    }

    // Check if message already exists (prevent duplicates)
    const { data: existing } = await supabaseAdmin
      .from('instagram_messages')
      .select('id')
      .eq('message_id', messageId)
      .eq('is_archived', false)
      .single();

    if (existing) {
      console.log('⏭️ Message already processed:', messageId);
      return;
    }

    // Check usage limits
    const usageCheck = await canAnalyzeMessage(profile.id);
    if (!usageCheck.allowed) {
      console.log('⚠️ Usage limit reached for user:', profile.id);
      return;
    }

    // Fetch active automation rules for DMs
    const { data: automationRules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .in('trigger_type', ['dm', 'both']);

    const activeAutomations: AutomationRule[] = automationRules || [];

    // Fetch business rules for AI context
    const { data: businessRules } = await supabaseAdmin
      .from('business_rules')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true);

    const activeBusinessRules: BusinessRule[] = businessRules || [];

    // Step 1: Check automation rules first (instant exact match reply)
    const matchedRule = findMatchingAutomationRule(
      messageText,
      'dm',
      activeAutomations
    );

    if (matchedRule && profile.auto_reply_dms_enabled) {
      // Send automation reply INSTANTLY
      try {
        const replyId = await sendConversationMessage(
          profile.facebook_page_id,
          senderId,
          matchedRule.reply_text,
          profile.instagram_access_token
        );

        // Store message with reply info
        await supabaseAdmin.from('instagram_messages').insert({
          user_id: profile.id,
          message_id: messageId,
          conversation_id: event.sender.id, // Use sender ID as conversation ID
          sender_id: senderId,
          sender_username: 'webhook_user', // We don't have username in webhook
          message_text: messageText,
          timestamp: new Date().toISOString(),
          intent: 'other',
          intent_confidence: 1.0,
          replied_at: new Date().toISOString(),
          replied_by: 'instagram_auto',
          reply_text: matchedRule.reply_text,
        });

        // Log the auto-reply
        await supabaseAdmin.from('auto_reply_logs').insert({
          user_id: profile.id,
          message_type: 'dm',
          message_id: messageId,
          original_message_text: messageText,
          reply_text: matchedRule.reply_text,
          reply_type: 'automation',
          automation_rule_id: matchedRule.id,
          instagram_reply_id: replyId,
          success: true,
        });

        // Update automation rule usage
        await supabaseAdmin
          .from('automation_rules')
          .update({
            usage_count: matchedRule.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', matchedRule.id);

        await incrementMessageCount(profile.id);
        console.log(`✅ Instant automation reply sent: "${matchedRule.reply_text}"`);
        return;
      } catch (error) {
        console.error('Error sending automation reply:', error);
        // Continue to AI analysis if automation fails
      }
    }

    // Step 2: AI analysis (for non-automation messages)
    // Fetch conversation context (we need conversation ID for this)
    const conversationId = event.sender.id; // For webhooks, sender ID is the conversation
    const analysis = await analyzeMessageWithContext(
      messageText,
      profile.id,
      conversationId,
      new Date().toISOString(),
      activeBusinessRules
    );

    // Store message with AI analysis
    await supabaseAdmin.from('instagram_messages').insert({
      user_id: profile.id,
      message_id: messageId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_username: 'webhook_user',
      message_text: messageText,
      timestamp: new Date().toISOString(),
      intent: analysis.intent,
      intent_confidence: analysis.confidence,
      ai_reply_suggestion_fi: analysis.suggestedReplyFi,
      ai_reply_suggestion_en: analysis.suggestedReplyEn,
    });

    // Step 3: Add to approval queue if auto-reply is enabled
    if (profile.auto_reply_dms_enabled) {
      const suggestedReply =
        analysis.detectedLanguage === 'fi'
          ? analysis.suggestedReplyFi
          : analysis.suggestedReplyEn;

      await supabaseAdmin.from('auto_reply_queue').insert({
        user_id: profile.id,
        message_type: 'dm',
        message_id: messageId,
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: messageText,
        suggested_reply: suggestedReply,
        detected_language: analysis.detectedLanguage || 'en',
        status: 'pending',
      });

      console.log(`📝 Queued AI reply for approval: "${messageText}"`);
    }

    await incrementMessageCount(profile.id);
    console.log(`✅ Webhook DM processed successfully`);
  } catch (error) {
    console.error('Error handling DM event:', error);
  }
}

/**
 * Handle incoming comment event from webhook
 */
async function handleCommentEvent(value: any) {
  try {
    const commentId = value.id;
    const commentText = value.text || '';
    const mediaId = value.media?.id;

    if (!commentText) {
      console.log('⏭️ Skipping comment without text');
      return;
    }

    console.log(`💬 New comment: "${commentText}"`);

    // Find which user owns this Instagram account
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('instagram_user_id', value.from?.id)
      .single();

    if (!profile || !profile.instagram_access_token) {
      console.log('⚠️ No profile found for Instagram user');
      return;
    }

    // Check if comment already exists
    const { data: existing } = await supabaseAdmin
      .from('instagram_comments')
      .select('id')
      .eq('comment_id', commentId)
      .eq('is_archived', false)
      .single();

    if (existing) {
      console.log('⏭️ Comment already processed:', commentId);
      return;
    }

    // Fetch automation rules
    const { data: automationRules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .in('trigger_type', ['comment', 'both']);

    const activeAutomations: AutomationRule[] = automationRules || [];

    // Check automation rules first
    const matchedRule = findMatchingAutomationRule(
      commentText,
      'comment',
      activeAutomations
    );

    if (matchedRule && profile.auto_reply_comments_enabled) {
      try {
        const replyId = await replyToComment(
          commentId,
          matchedRule.reply_text,
          profile.instagram_access_token
        );

        await supabaseAdmin.from('instagram_comments').insert({
          user_id: profile.id,
          comment_id: commentId,
          post_id: mediaId,
          media_id: mediaId,
          sender_id: value.from?.id || 'unknown',
          sender_username: value.from?.username,
          comment_text: commentText,
          timestamp: new Date().toISOString(),
          is_question: false,
          replied_at: new Date().toISOString(),
          replied_by: 'automation',
          reply_text: matchedRule.reply_text,
          reply_comment_id: replyId,
        });

        await supabaseAdmin.from('auto_reply_logs').insert({
          user_id: profile.id,
          message_type: 'comment',
          message_id: commentId,
          original_message_text: commentText,
          sender_username: value.from?.username,
          reply_text: matchedRule.reply_text,
          reply_type: 'automation',
          automation_rule_id: matchedRule.id,
          instagram_reply_id: replyId,
          success: true,
        });

        await supabaseAdmin
          .from('automation_rules')
          .update({
            usage_count: matchedRule.usage_count + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', matchedRule.id);

        console.log(`✅ Instant comment reply sent: "${matchedRule.reply_text}"`);
        return;
      } catch (error) {
        console.error('Error replying to comment:', error);
      }
    }

    console.log(`📝 Webhook comment processed (no automation match)`);
  } catch (error) {
    console.error('Error handling comment event:', error);
  }
}
