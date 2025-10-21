import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getInstagramConversationsSince, getConversationMessages } from '@/lib/instagram/client';
import { sendConversationMessage } from '@/lib/instagram/messaging';
import { analyzeMessageIntent, analyzeMessageWithContext } from '@/lib/ai';
import { findMatchingAutomationRule } from '@/lib/automation/matcher';
import { AutomationRule, BusinessRule } from '@/lib/types';
import { canAnalyzeMessage, incrementMessageCount } from '@/lib/utils/usage';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's Instagram credentials and last sync timestamp
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('instagram_access_token, instagram_user_id, facebook_page_id, last_instagram_sync, auto_reply_dms_enabled')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.instagram_access_token || !profile?.facebook_page_id) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting Instagram message sync for user:', userId);
    console.log('📄 Using Facebook Page ID:', profile.facebook_page_id);
    console.log('⏰ Last sync:', profile.last_instagram_sync || 'never (first sync)');
    console.log('🤖 DM Auto-reply enabled:', profile.auto_reply_dms_enabled);

    // Check if user can analyze more messages (usage limits)
    const usageCheck = await canAnalyzeMessage(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          usage: usageCheck.usageStats,
          upgrade_required: true,
        },
        { status: 403 }
      );
    }

    // Fetch user's active business rules
    const { data: businessRules, error: rulesError } = await supabaseAdmin
      .from('business_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeRules: BusinessRule[] = businessRules || [];
    console.log(`📋 Loaded ${activeRules.length} active business rules for context`);

    // Fetch active automation rules for DMs
    const { data: automationRules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('trigger_type', ['dm', 'both']);

    const activeAutomations: AutomationRule[] = automationRules || [];
    console.log(`🤖 Loaded ${activeAutomations.length} active automation rules for DMs`);

    // Fetch Instagram conversations (only new/updated ones since last sync)
    // IMPORTANT: Use Page ID, not Instagram User ID
    const conversations = await getInstagramConversationsSince(
      profile.facebook_page_id,
      profile.instagram_access_token,
      profile.last_instagram_sync
    );

    let syncedCount = 0;
    let analyzedCount = 0;
    let skippedCount = 0;
    let autoRepliedCount = 0;
    let queuedCount = 0;
    const syncStartTime = new Date().toISOString();

    // Process each conversation
    for (const conversation of conversations) {
      try {
        const conversationData = await getConversationMessages(
          conversation.id,
          profile.instagram_access_token
        );

        // Process each message in the conversation
        if (conversationData.messages?.data) {
          for (const msg of conversationData.messages.data) {
            // Check if message already exists
            const { data: existing } = await supabaseAdmin
              .from('instagram_messages')
              .select('id')
              .eq('message_id', msg.id)
              .single();

            if (!existing) {
              // Check usage limit before analyzing
              const canAnalyze = await canAnalyzeMessage(userId);
              if (!canAnalyze.allowed) {
                console.log('⚠️ Usage limit reached, stopping sync');
                break; // Stop processing more messages
              }

              const messageText = msg.message || '';

              // Step 1: Check automation rules first (exact match auto-reply)
              const matchedRule = findMatchingAutomationRule(
                messageText,
                'dm',
                activeAutomations
              );

              if (matchedRule && profile.auto_reply_dms_enabled) {
                // Auto-reply immediately
                try {
                  const replyId = await sendConversationMessage(
                    profile.facebook_page_id, // Use page ID
                    msg.from.id, // Use sender ID (recipient)
                    matchedRule.reply_text,
                    profile.instagram_access_token
                  );

                  // Store message with reply info
                  await supabaseAdmin.from('instagram_messages').insert({
                    user_id: userId,
                    message_id: msg.id,
                    conversation_id: conversationData.conversationId,
                    sender_id: msg.from.id,
                    sender_username: msg.from.username,
                    sender_name: msg.from.name,
                    message_text: messageText,
                    timestamp: msg.created_time,
                    intent: 'other',
                    intent_confidence: 1.0,
                    replied_at: new Date().toISOString(),
                    replied_by: 'instagram_auto',
                    reply_text: matchedRule.reply_text,
                  });

                  // Log the auto-reply
                  await supabaseAdmin.from('auto_reply_logs').insert({
                    user_id: userId,
                    message_type: 'dm',
                    message_id: msg.id,
                    original_message_text: messageText,
                    sender_username: msg.from.username,
                    reply_text: matchedRule.reply_text,
                    reply_type: 'automation',
                    automation_rule_id: matchedRule.id,
                    instagram_reply_id: replyId,
                    success: true,
                  });

                  // Update automation rule usage count
                  await supabaseAdmin
                    .from('automation_rules')
                    .update({
                      usage_count: matchedRule.usage_count + 1,
                      last_used_at: new Date().toISOString(),
                    })
                    .eq('id', matchedRule.id);

                  autoRepliedCount++;
                  syncedCount++;
                  await incrementMessageCount(userId);
                  console.log(`✅ Auto-replied to DM via automation: "${messageText}"`);
                  continue; // Skip to next message
                } catch (error) {
                  console.error('Error auto-replying to DM:', error);
                  // Continue to AI analysis if auto-reply fails
                }
              }

              // Step 2: AI analysis with conversation context
              const analysis = await analyzeMessageWithContext(
                messageText,
                userId,
                conversationData.conversationId,
                msg.created_time,
                activeRules
              );

              // Store message with conversation_id
              await supabaseAdmin.from('instagram_messages').insert({
                user_id: userId,
                message_id: msg.id,
                conversation_id: conversationData.conversationId,
                sender_id: msg.from.id,
                sender_username: msg.from.username,
                sender_name: msg.from.name,
                message_text: messageText,
                timestamp: msg.created_time,
                intent: analysis.intent,
                intent_confidence: analysis.confidence,
                ai_reply_suggestion_fi: analysis.suggestedReplyFi,
                ai_reply_suggestion_en: analysis.suggestedReplyEn,
              });

              // Step 3: Add AI-generated reply to approval queue if auto-reply is enabled
              if (profile.auto_reply_dms_enabled) {
                const suggestedReply =
                  analysis.detectedLanguage === 'fi'
                    ? analysis.suggestedReplyFi
                    : analysis.suggestedReplyEn;

                await supabaseAdmin.from('auto_reply_queue').insert({
                  user_id: userId,
                  message_type: 'dm',
                  message_id: msg.id,
                  conversation_id: conversationData.conversationId, // Add conversation ID for replying
                  sender_id: msg.from.id, // Add sender ID as alternative
                  message_text: messageText,
                  sender_username: msg.from.username,
                  suggested_reply: suggestedReply,
                  detected_language: analysis.detectedLanguage || 'en',
                  status: 'pending',
                });

                queuedCount++;
                console.log(`📝 Queued DM AI reply for approval: "${messageText}"`);
              }

              // Increment message count
              await incrementMessageCount(userId);

              syncedCount++;
              analyzedCount++;
            } else {
              skippedCount++;
            }
          }
        }

        // NOTE: Follower insights are now updated by daily aggregation job
        // This improves sync performance and ensures accurate calculations
      } catch (error) {
        console.error('Error processing conversation:', error);
        continue;
      }
    }

    // Update last sync timestamp
    await supabaseAdmin
      .from('profiles')
      .update({ last_instagram_sync: syncStartTime })
      .eq('id', userId);

    console.log('✅ Sync complete:', { syncedCount, skippedCount, analyzedCount, autoRepliedCount, queuedCount });

    return NextResponse.json({
      success: true,
      syncedMessages: syncedCount,
      skippedMessages: skippedCount,
      analyzedMessages: analyzedCount,
      autoReplied: autoRepliedCount,
      queuedForApproval: queuedCount,
    });
  } catch (error) {
    console.error('Error syncing messages:', error);
    return NextResponse.json(
      { error: 'Failed to sync messages' },
      { status: 500 }
    );
  }
}
