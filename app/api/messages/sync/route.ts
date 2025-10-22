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

    const syncStartTime = new Date().toISOString();

    // Fetch all existing UNARCHIVED message IDs for this user in ONE query
    // This is MUCH faster than checking timestamp for every message
    // Archived messages are skipped entirely (already answered and older than 30 days)
    const { data: existingMessages } = await supabaseAdmin
      .from('instagram_messages')
      .select('message_id')
      .eq('user_id', userId)
      .eq('is_archived', false);

    const existingMessageIds = new Set(
      (existingMessages || []).map((m) => m.message_id)
    );

    console.log(`📋 Found ${existingMessageIds.size} unarchived messages in database`);

    // Process conversations concurrently (but messages within each conversation sequentially to maintain context)
    const results = await Promise.all(
      conversations.map(async (conversation: any) => {
        let convSyncedCount = 0;
        let convAnalyzedCount = 0;
        let convSkippedCount = 0;
        let convAutoRepliedCount = 0;
        let convQueuedCount = 0;
        try {
          const conversationData = await getConversationMessages(
            conversation.id,
            profile.instagram_access_token
          );

          // Process each message in the conversation
          if (conversationData.messages?.data) {
            for (const msg of conversationData.messages.data) {
              // Skip if message already exists (fast Set lookup)
              // Archived messages are not in the Set, so they won't be re-processed
              if (existingMessageIds.has(msg.id)) {
                convSkippedCount++;
                continue;
              }

              // Message is new and unarchived, should be processed
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

                  // Store message with reply info (NO AI analysis needed)
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

                  convAutoRepliedCount++;
                  convSyncedCount++;
                  await incrementMessageCount(userId);
                  console.log(`✅ Auto-replied to DM via automation: "${messageText}"`);
                  continue; // Skip to next message
                } catch (error) {
                  console.error('Error auto-replying to DM:', error);
                  // Continue to basic message storage if auto-reply fails
                }
              }

              // Step 2: Store message WITHOUT AI analysis (lazy load AI on demand)
              // This makes sync MUCH faster - AI will run when user views the message
              await supabaseAdmin.from('instagram_messages').insert({
                user_id: userId,
                message_id: msg.id,
                conversation_id: conversationData.conversationId,
                sender_id: msg.from.id,
                sender_username: msg.from.username,
                sender_name: msg.from.name,
                message_text: messageText,
                timestamp: msg.created_time,
                intent: null, // Will be filled by on-demand AI analysis
                intent_confidence: null,
                ai_reply_suggestion_fi: null,
                ai_reply_suggestion_en: null,
              });

              convSyncedCount++;
              console.log(`💾 Stored message (AI deferred): "${messageText.substring(0, 50)}..."`)
            }
          }

          // NOTE: Follower insights are now updated by daily aggregation job
          // This improves sync performance and ensures accurate calculations
        } catch (error) {
          console.error('Error processing conversation:', error);
        }

        return {
          syncedCount: convSyncedCount,
          analyzedCount: convAnalyzedCount,
          skippedCount: convSkippedCount,
          autoRepliedCount: convAutoRepliedCount,
          queuedCount: convQueuedCount,
        };
      })
    );

    // Aggregate results from all conversations
    const totals = results.reduce(
      (acc, result) => ({
        syncedCount: acc.syncedCount + result.syncedCount,
        analyzedCount: acc.analyzedCount + result.analyzedCount,
        skippedCount: acc.skippedCount + result.skippedCount,
        autoRepliedCount: acc.autoRepliedCount + result.autoRepliedCount,
        queuedCount: acc.queuedCount + result.queuedCount,
      }),
      { syncedCount: 0, analyzedCount: 0, skippedCount: 0, autoRepliedCount: 0, queuedCount: 0 }
    );

    // Update last sync timestamp
    await supabaseAdmin
      .from('profiles')
      .update({ last_instagram_sync: syncStartTime })
      .eq('id', userId);

    console.log('✅ Sync complete:', totals);

    return NextResponse.json({
      success: true,
      syncedMessages: totals.syncedCount,
      skippedMessages: totals.skippedCount,
      analyzedMessages: totals.analyzedCount,
      autoReplied: totals.autoRepliedCount,
      queuedForApproval: totals.queuedCount,
    });
  } catch (error) {
    console.error('Error syncing messages:', error);
    return NextResponse.json(
      { error: 'Failed to sync messages' },
      { status: 500 }
    );
  }
}
