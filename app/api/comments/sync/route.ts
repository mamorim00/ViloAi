import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { syncInstagramComments, replyToComment } from '@/lib/instagram/comments';
import { analyzeMessageIntent, shouldReplyToComment } from '@/lib/ai';
import { findMatchingAutomationRule } from '@/lib/automation/matcher';
import { AutomationRule, BusinessRule } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's profile and settings
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('instagram_access_token, instagram_user_id, facebook_page_id, auto_reply_comments_enabled')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.instagram_access_token || !profile?.instagram_user_id) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 }
      );
    }

    console.log('🔄 Starting comment sync for user:', userId);
    console.log('🤖 Auto-reply enabled:', profile.auto_reply_comments_enabled);

    // Fetch active automation rules
    const { data: automationRules } = await supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('trigger_type', ['comment', 'both']);

    const activeAutomations: AutomationRule[] = automationRules || [];
    console.log(`📋 Loaded ${activeAutomations.length} active automation rules`);

    // Fetch business rules for AI context
    const { data: businessRules } = await supabaseAdmin
      .from('business_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const activeBusinessRules: BusinessRule[] = businessRules || [];

    // Sync comments from Instagram
    const commentData = await syncInstagramComments(
      profile.instagram_user_id,
      profile.instagram_access_token,
      10 // Last 10 posts
    );

    let syncedCount = 0;
    let autoRepliedCount = 0;
    let queuedCount = 0;
    let skippedCount = 0;

    // Process each comment
    for (const post of commentData) {
      for (const comment of post.comments) {
        try {
          // Check if comment already exists
          const { data: existing } = await supabaseAdmin
            .from('instagram_comments')
            .select('id')
            .eq('comment_id', comment.id)
            .single();

          if (existing) {
            skippedCount++;
            continue;
          }

          const commentText = comment.text || '';

          // Step 1: Check automation rules first (exact match auto-reply)
          const matchedRule = findMatchingAutomationRule(
            commentText,
            'comment',
            activeAutomations
          );

          if (matchedRule && profile.auto_reply_comments_enabled) {
            // Auto-reply immediately
            try {
              const replyId = await replyToComment(
                comment.id,
                matchedRule.reply_text,
                profile.instagram_access_token
              );

              // Store comment with reply info
              await supabaseAdmin.from('instagram_comments').insert({
                user_id: userId,
                comment_id: comment.id,
                post_id: post.mediaId,
                media_id: post.mediaId,
                sender_id: comment.from?.id || comment.username || 'unknown',
                sender_username: comment.username || comment.from?.username,
                comment_text: commentText,
                timestamp: comment.timestamp,
                is_question: false, // Automation rule matched, not analyzing
                replied_at: new Date().toISOString(),
                replied_by: 'automation',
                reply_text: matchedRule.reply_text,
                reply_comment_id: replyId,
              });

              // Log the auto-reply
              await supabaseAdmin.from('auto_reply_logs').insert({
                user_id: userId,
                message_type: 'comment',
                message_id: comment.id,
                original_message_text: commentText,
                sender_username: comment.username || comment.from?.username,
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
              console.log(`✅ Auto-replied to comment via automation: "${commentText}"`);
              continue;
            } catch (error) {
              console.error('Error auto-replying:', error);
              // Continue to AI analysis if auto-reply fails
            }
          }

          // Step 2: Check if comment needs a reply (filter casual comments)
          const replyCheck = await shouldReplyToComment(commentText);

          if (!replyCheck.shouldReply) {
            // Store comment but mark as not needing reply
            await supabaseAdmin.from('instagram_comments').insert({
              user_id: userId,
              comment_id: comment.id,
              post_id: post.mediaId,
              media_id: post.mediaId,
              sender_id: comment.from?.id || comment.username || 'unknown',
              sender_username: comment.username || comment.from?.username,
              comment_text: commentText,
              timestamp: comment.timestamp,
              is_question: false,
            });

            syncedCount++;
            console.log(`⏭️ Skipped casual comment: "${commentText}" (${replyCheck.reason})`);
            continue;
          }

          // Step 3: AI analysis for questions/inquiries
          const analysis = await analyzeMessageIntent(commentText, activeBusinessRules);

          // Store comment
          await supabaseAdmin.from('instagram_comments').insert({
            user_id: userId,
            comment_id: comment.id,
            post_id: post.mediaId,
            media_id: post.mediaId,
            sender_id: comment.from?.id || comment.username || 'unknown',
            sender_username: comment.username || comment.from?.username,
            comment_text: commentText,
            timestamp: comment.timestamp,
            is_question: true,
            intent: analysis.intent,
            intent_confidence: analysis.confidence,
            ai_reply_suggestion_fi: analysis.suggestedReplyFi,
            ai_reply_suggestion_en: analysis.suggestedReplyEn,
          });

          // Step 4: Add AI-generated reply to approval queue
          const suggestedReply =
            analysis.detectedLanguage === 'fi'
              ? analysis.suggestedReplyFi
              : analysis.suggestedReplyEn;

          await supabaseAdmin.from('auto_reply_queue').insert({
            user_id: userId,
            message_type: 'comment',
            message_id: comment.id,
            sender_id: comment.from?.id || comment.username || 'unknown', // Add sender ID
            message_text: commentText,
            sender_username: comment.username || comment.from?.username,
            suggested_reply: suggestedReply,
            detected_language: analysis.detectedLanguage || 'en',
            status: 'pending',
          });

          queuedCount++;
          syncedCount++;
          console.log(`📝 Queued AI reply for approval: "${commentText}"`);
        } catch (error) {
          console.error('Error processing comment:', error);
          continue;
        }
      }
    }

    // Update last sync timestamp
    await supabaseAdmin
      .from('profiles')
      .update({ last_comment_sync: new Date().toISOString() })
      .eq('id', userId);

    console.log('✅ Comment sync complete:', {
      syncedCount,
      autoRepliedCount,
      queuedCount,
      skippedCount,
    });

    return NextResponse.json({
      success: true,
      syncedComments: syncedCount,
      autoReplied: autoRepliedCount,
      queuedForApproval: queuedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error('Error syncing comments:', error);
    return NextResponse.json(
      { error: 'Failed to sync comments' },
      { status: 500 }
    );
  }
}
