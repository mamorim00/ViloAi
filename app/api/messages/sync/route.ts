import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getInstagramConversations, getConversationMessages } from '@/lib/instagram/client';
import { analyzeMessageIntent } from '@/lib/ai';
import { BusinessRule } from '@/lib/types';
import { canAnalyzeMessage, incrementMessageCount } from '@/lib/utils/usage';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's Instagram credentials
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('instagram_access_token, instagram_user_id, facebook_page_id')
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

    // Fetch Instagram conversations
    // IMPORTANT: Use Page ID, not Instagram User ID
    const conversations = await getInstagramConversations(
      profile.facebook_page_id,
      profile.instagram_access_token
    );

    let syncedCount = 0;
    let analyzedCount = 0;

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

              // Analyze message intent with business rules context
              const analysis = await analyzeMessageIntent(msg.message || '', activeRules);

              // Store message
              await supabaseAdmin.from('instagram_messages').insert({
                user_id: userId,
                message_id: msg.id,
                sender_id: msg.from.id,
                sender_username: msg.from.username,
                sender_name: msg.from.name,
                message_text: msg.message,
                timestamp: msg.created_time,
                intent: analysis.intent,
                intent_confidence: analysis.confidence,
                ai_reply_suggestion_fi: analysis.suggestedReplyFi,
                ai_reply_suggestion_en: analysis.suggestedReplyEn,
              });

              // Increment message count
              await incrementMessageCount(userId);

              syncedCount++;
              analyzedCount++;
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

    return NextResponse.json({
      success: true,
      syncedMessages: syncedCount,
      analyzedMessages: analyzedCount,
    });
  } catch (error) {
    console.error('Error syncing messages:', error);
    return NextResponse.json(
      { error: 'Failed to sync messages' },
      { status: 500 }
    );
  }
}
