import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { analyzeMessageWithContext, analyzeMessageIntent } from '@/lib/ai';
import { canAnalyzeMessage, incrementMessageCount } from '@/lib/utils/usage';

/**
 * On-demand AI analysis endpoint
 * This endpoint is called when the user views a message/comment that hasn't been analyzed yet
 * This makes sync much faster by deferring AI analysis until it's actually needed
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, userId, type = 'dm' } = await request.json();

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'Message ID and User ID required' },
        { status: 400 }
      );
    }

    // Check usage limits
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

    // Fetch business rules for context
    const { data: businessRules } = await supabaseAdmin
      .from('business_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (type === 'comment') {
      // Handle comment analysis
      const { data: comment, error: commentError } = await supabaseAdmin
        .from('instagram_comments')
        .select('*')
        .eq('comment_id', messageId)
        .eq('user_id', userId)
        .single();

      if (commentError || !comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      // Check if already analyzed
      if (comment.intent && comment.ai_reply_suggestion_fi && comment.ai_reply_suggestion_en) {
        return NextResponse.json({
          success: true,
          cached: true,
          analysis: {
            intent: comment.intent,
            confidence: comment.intent_confidence,
            suggestedReplyFi: comment.ai_reply_suggestion_fi,
            suggestedReplyEn: comment.ai_reply_suggestion_en,
          },
        });
      }

      // Run AI analysis
      const analysis = await analyzeMessageIntent(comment.comment_text, businessRules || []);

      // Update the comment with AI analysis
      await supabaseAdmin
        .from('instagram_comments')
        .update({
          intent: analysis.intent,
          intent_confidence: analysis.confidence,
          ai_reply_suggestion_fi: analysis.suggestedReplyFi,
          ai_reply_suggestion_en: analysis.suggestedReplyEn,
        })
        .eq('comment_id', messageId)
        .eq('user_id', userId);

      // Increment usage counter
      await incrementMessageCount(userId);

      console.log(`✅ Lazy-loaded AI analysis for comment: ${messageId}`);

      return NextResponse.json({
        success: true,
        cached: false,
        analysis: {
          intent: analysis.intent,
          confidence: analysis.confidence,
          suggestedReplyFi: analysis.suggestedReplyFi,
          suggestedReplyEn: analysis.suggestedReplyEn,
          detectedLanguage: analysis.detectedLanguage,
        },
      });
    } else {
      // Handle DM analysis
      const { data: message, error: messageError } = await supabaseAdmin
        .from('instagram_messages')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single();

      if (messageError || !message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Check if already analyzed
      if (message.intent && message.ai_reply_suggestion_fi && message.ai_reply_suggestion_en) {
        return NextResponse.json({
          success: true,
          cached: true,
          analysis: {
            intent: message.intent,
            confidence: message.intent_confidence,
            suggestedReplyFi: message.ai_reply_suggestion_fi,
            suggestedReplyEn: message.ai_reply_suggestion_en,
          },
        });
      }

      // Run AI analysis with conversation context
      const analysis = await analyzeMessageWithContext(
        message.message_text,
        userId,
        message.conversation_id,
        message.timestamp,
        businessRules || []
      );

      // Update the message with AI analysis
      await supabaseAdmin
        .from('instagram_messages')
        .update({
          intent: analysis.intent,
          intent_confidence: analysis.confidence,
          ai_reply_suggestion_fi: analysis.suggestedReplyFi,
          ai_reply_suggestion_en: analysis.suggestedReplyEn,
        })
        .eq('message_id', messageId)
        .eq('user_id', userId);

      // Increment usage counter
      await incrementMessageCount(userId);

      console.log(`✅ Lazy-loaded AI analysis for message: ${messageId}`);

      return NextResponse.json({
        success: true,
        cached: false,
        analysis: {
          intent: analysis.intent,
          confidence: analysis.confidence,
          suggestedReplyFi: analysis.suggestedReplyFi,
          suggestedReplyEn: analysis.suggestedReplyEn,
          detectedLanguage: analysis.detectedLanguage,
        },
      });
    }
  } catch (error) {
    console.error('Error analyzing message:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
