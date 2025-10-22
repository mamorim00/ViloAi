import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { UnifiedInboxItem, LeadInfo, LeadScore, MessageIntent } from '@/lib/types';

// Calculate lead score based on message intent
function calculateLeadInfo(intent?: string): LeadInfo {
  if (!intent) {
    return { isLead: false, score: 0, reason: 'No intent classified' };
  }

  switch (intent as MessageIntent) {
    case 'price_inquiry':
      return { isLead: true, score: 10, reason: 'High-value: Price inquiry' };
    case 'availability':
      return { isLead: true, score: 8, reason: 'High-value: Availability question' };
    case 'location':
      return { isLead: true, score: 8, reason: 'High-value: Location request' };
    case 'general_question':
      return { isLead: true, score: 5, reason: 'Medium-value: General question' };
    case 'complaint':
      return { isLead: true, score: 5, reason: 'Needs attention: Complaint' };
    default:
      return { isLead: false, score: 0, reason: 'Low priority' };
  }
}

// GET - Fetch all messages, comments, and pending approvals in unified format
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const filter = request.nextUrl.searchParams.get('filter') || 'all'; // all, leads, pending_approval, unanswered, answered

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const items: UnifiedInboxItem[] = [];

    // 1. Fetch Instagram DMs
    const { data: messages } = await supabaseAdmin
      .from('instagram_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (messages) {
      for (const msg of messages) {
        const leadInfo = calculateLeadInfo(msg.intent);
        items.push({
          id: `dm-${msg.id}`,
          type: 'dm',
          source_id: msg.message_id,
          user_id: msg.user_id,
          sender_id: msg.sender_id,
          sender_username: msg.sender_username,
          sender_name: msg.sender_name,
          message_text: msg.message_text || '',
          timestamp: msg.timestamp,
          intent: msg.intent,
          intent_confidence: msg.intent_confidence,
          ai_suggestion_fi: msg.ai_reply_suggestion_fi,
          ai_suggestion_en: msg.ai_reply_suggestion_en,
          replied_at: msg.replied_at,
          replied_by: msg.replied_by,
          reply_text: msg.reply_text,
          lead_info: leadInfo,
          conversation_id: msg.conversation_id,
        });
      }
    }

    // 2. Fetch Instagram Comments
    const { data: comments } = await supabaseAdmin
      .from('instagram_comments')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (comments) {
      for (const comment of comments) {
        const leadInfo = calculateLeadInfo(comment.intent);
        items.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          source_id: comment.comment_id,
          user_id: comment.user_id,
          sender_id: comment.sender_id,
          sender_username: comment.sender_username,
          sender_name: comment.sender_name,
          message_text: comment.comment_text || '',
          timestamp: comment.timestamp,
          intent: comment.intent,
          intent_confidence: comment.intent_confidence,
          ai_suggestion_fi: comment.ai_reply_suggestion_fi,
          ai_suggestion_en: comment.ai_reply_suggestion_en,
          replied_at: comment.replied_at,
          replied_by: comment.replied_by,
          reply_text: comment.reply_text,
          lead_info: leadInfo,
          post_id: comment.post_id,
        });
      }
    }

    // 3. Fetch Pending Approvals from Queue
    const { data: queueItems } = await supabaseAdmin
      .from('auto_reply_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (queueItems) {
      for (const queue of queueItems) {
        // Determine intent from related message/comment if available
        let intent: string | undefined;
        let intentConfidence: number | undefined;

        if (queue.message_type === 'dm') {
          const { data: relatedMsg } = await supabaseAdmin
            .from('instagram_messages')
            .select('intent, intent_confidence')
            .eq('message_id', queue.message_id)
            .single();
          if (relatedMsg) {
            intent = relatedMsg.intent;
            intentConfidence = relatedMsg.intent_confidence;
          }
        } else if (queue.message_type === 'comment') {
          const { data: relatedComment } = await supabaseAdmin
            .from('instagram_comments')
            .select('intent, intent_confidence')
            .eq('comment_id', queue.message_id)
            .single();
          if (relatedComment) {
            intent = relatedComment.intent;
            intentConfidence = relatedComment.intent_confidence;
          }
        }

        const leadInfo = calculateLeadInfo(intent);
        items.push({
          id: `pending-${queue.id}`,
          type: 'pending_approval',
          source_id: queue.message_id,
          user_id: queue.user_id,
          sender_id: queue.sender_id || '',
          sender_username: queue.sender_username,
          message_text: queue.message_text,
          timestamp: queue.created_at,
          intent: intent as MessageIntent | undefined,
          intent_confidence: intentConfidence,
          ai_suggestion_fi: queue.detected_language === 'fi' ? queue.suggested_reply : undefined,
          ai_suggestion_en: queue.detected_language === 'en' ? queue.suggested_reply : undefined,
          detected_language: queue.detected_language,
          lead_info: leadInfo,
          queue_item_id: queue.id,
          conversation_id: queue.conversation_id,
          post_id: queue.message_type === 'comment' ? queue.message_id : undefined,
          status: queue.status,
        });
      }
    }

    // 4. Apply Filters
    let filteredItems = items;
    switch (filter) {
      case 'leads':
        filteredItems = items.filter(item => item.lead_info.isLead);
        break;
      case 'pending_approval':
        filteredItems = items.filter(item => item.type === 'pending_approval');
        break;
      case 'unanswered':
        filteredItems = items.filter(item => !item.replied_at);
        break;
      case 'answered':
        filteredItems = items.filter(item => item.replied_at);
        break;
      default: // 'all'
        break;
    }

    // 5. Sort: Leads first (by score desc) → Pending Approvals → Unanswered → Answered
    filteredItems.sort((a, b) => {
      // First: Sort by lead score (highest first)
      if (a.lead_info.score !== b.lead_info.score) {
        return b.lead_info.score - a.lead_info.score;
      }

      // Second: Pending approvals come before others
      if (a.type === 'pending_approval' && b.type !== 'pending_approval') return -1;
      if (a.type !== 'pending_approval' && b.type === 'pending_approval') return 1;

      // Third: Unanswered before answered
      const aAnswered = !!a.replied_at;
      const bAnswered = !!b.replied_at;
      if (!aAnswered && bAnswered) return -1;
      if (aAnswered && !bAnswered) return 1;

      // Fourth: Most recent first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      success: true,
      items: filteredItems,
      total: filteredItems.length,
      stats: {
        total: items.length,
        leads: items.filter(i => i.lead_info.isLead).length,
        pending_approval: items.filter(i => i.type === 'pending_approval').length,
        unanswered: items.filter(i => !i.replied_at).length,
        answered: items.filter(i => i.replied_at).length,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/unified-inbox:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
