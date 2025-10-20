import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getInstagramConversations, getConversationMessages } from '@/lib/instagram/client';
import { analyzeMessageIntent } from '@/lib/ai';

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
              // Analyze message intent
              const analysis = await analyzeMessageIntent(msg.message || '');

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

              syncedCount++;
              analyzedCount++;
            }
          }
        }

        // Update follower insights
        if (conversationData.participants?.data) {
          for (const participant of conversationData.participants.data) {
            const messageCount = conversationData.messages?.data?.filter(
              (m: any) => m.from.id === participant.id
            ).length || 0;

            await supabaseAdmin
              .from('follower_insights')
              .upsert({
                user_id: userId,
                follower_id: participant.id,
                follower_username: participant.username,
                follower_name: participant.name,
                message_count: messageCount,
                last_message_at: conversationData.messages?.data?.[0]?.created_time,
                total_engagement_score: messageCount * 10,
              });
          }
        }
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
