'use client';

import { useState } from 'react';
import { UnifiedInboxItem } from '@/lib/types';
import LeadBadge from './LeadBadge';
import QuickReplyBox from './QuickReplyBox';
import { CheckCircle, MessageSquare, MessageCircle, Clock, Edit, X, Check, Send } from 'lucide-react';

interface UnifiedInboxItemProps {
  item: UnifiedInboxItem;
  onApprove: (queueItemId: string, editedReply?: string) => Promise<void>;
  onReject: (queueItemId: string) => Promise<void>;
  onQuickReply: (itemType: string, sourceId: string, replyText: string, conversationId?: string, senderId?: string) => Promise<void>;
  onRefresh: () => void;
}

export default function UnifiedInboxItemComponent({
  item,
  onApprove,
  onReject,
  onQuickReply,
  onRefresh,
}: UnifiedInboxItemProps) {
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [showEditReply, setShowEditReply] = useState(false);
  const [editedReply, setEditedReply] = useState(item.ai_suggestion_fi || item.ai_suggestion_en || '');
  const [processing, setProcessing] = useState(false);

  const typeIcon = item.type === 'dm' ? <MessageSquare className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />;
  const typeLabel = item.type === 'dm' ? 'DM' : item.type === 'comment' ? 'Comment' : 'Pending Approval';
  const typeColor = item.type === 'dm' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  const aiSuggestion = item.detected_language === 'fi' ? item.ai_suggestion_fi : item.ai_suggestion_en;

  const handleApprove = async () => {
    if (!item.queue_item_id || processing) return;
    setProcessing(true);
    try {
      await onApprove(item.queue_item_id);
      onRefresh();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve reply. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveEdited = async () => {
    if (!item.queue_item_id || !editedReply.trim() || processing) return;
    setProcessing(true);
    try {
      await onApprove(item.queue_item_id, editedReply.trim());
      setShowEditReply(false);
      onRefresh();
    } catch (error) {
      console.error('Error approving edited reply:', error);
      alert('Failed to send edited reply. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!item.queue_item_id || processing) return;
    if (!confirm('Are you sure you want to reject this AI-generated reply?')) return;

    setProcessing(true);
    try {
      await onReject(item.queue_item_id);
      onRefresh();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Failed to reject reply. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickReply = async (replyText: string) => {
    if (processing) return;
    setProcessing(true);
    try {
      await onQuickReply(
        item.type === 'pending_approval' ? (item.conversation_id ? 'dm' : 'comment') : item.type,
        item.source_id,
        replyText,
        item.conversation_id,
        item.sender_id
      );
      setShowQuickReply(false);
      onRefresh();
    } catch (error) {
      console.error('Error sending quick reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const sent = new Date(timestamp);
    const diffMs = now.getTime() - sent.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Intent badge colors
  const intentColors: Record<string, string> = {
    price_inquiry: 'bg-green-100 text-green-800',
    availability: 'bg-orange-100 text-orange-800',
    location: 'bg-red-100 text-red-800',
    general_question: 'bg-blue-100 text-blue-800',
    complaint: 'bg-red-100 text-red-800',
    compliment: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1">
          {/* Lead Badge */}
          <LeadBadge leadInfo={item.lead_info} />

          {/* Type Badge */}
          <span className={`px-2 py-1 rounded text-xs font-medium ${typeColor} flex items-center space-x-1`}>
            {typeIcon}
            <span>{typeLabel}</span>
          </span>

          {/* Intent Badge */}
          {item.intent && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${intentColors[item.intent] || intentColors.other}`}>
              {item.intent.replace('_', ' ')}
            </span>
          )}

          {/* Replied Status */}
          {item.replied_at && (
            <span className="flex items-center space-x-1 text-xs text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Replied</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{getTimeAgo(item.timestamp)}</span>
        </div>
      </div>

      {/* Sender Info */}
      <div className="mb-2">
        <p className="font-semibold text-gray-900 text-sm">
          {item.sender_name || item.sender_username || 'Unknown'}
        </p>
      </div>

      {/* Message Text */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <p className="text-gray-800 text-sm whitespace-pre-wrap">{item.message_text}</p>
      </div>

      {/* AI Suggestion (if available and not replied yet) */}
      {aiSuggestion && !item.replied_at && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-purple-700">
              AI Suggestion ({item.detected_language === 'fi' ? 'Finnish' : 'English'}):
            </p>
            {item.intent_confidence && (
              <span className="text-xs text-purple-600">
                {Math.round(item.intent_confidence * 100)}% confidence
              </span>
            )}
          </div>

          {showEditReply ? (
            <div>
              <textarea
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                rows={3}
                disabled={processing}
              />
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setShowEditReply(false);
                    setEditedReply(aiSuggestion);
                  }}
                  disabled={processing}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveEdited}
                  disabled={!editedReply.trim() || processing}
                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  <Send className="h-3 w-3" />
                  <span>{processing ? 'Sending...' : 'Send Edited'}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 text-sm">{aiSuggestion}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!item.replied_at && (
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Pending Approval Actions */}
          {item.type === 'pending_approval' && item.queue_item_id && (
            <>
              {!showEditReply && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <Check className="h-4 w-4" />
                    <span>{processing ? 'Approving...' : 'Approve & Send'}</span>
                  </button>
                  <button
                    onClick={() => setShowEditReply(true)}
                    disabled={processing}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Quick Reply Button (for non-pending items) */}
          {item.type !== 'pending_approval' && !showQuickReply && (
            <button
              onClick={() => setShowQuickReply(true)}
              disabled={processing}
              className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Reply</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Reply Box */}
      {showQuickReply && !item.replied_at && (
        <QuickReplyBox
          onSend={handleQuickReply}
          onCancel={() => setShowQuickReply(false)}
          placeholder="Type your reply..."
        />
      )}

      {/* Replied Info */}
      {item.replied_at && item.reply_text && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-green-600 mb-1">
            ✓ Replied {item.replied_by === 'manual' ? 'manually' : 'via auto-reply'} on {new Date(item.replied_at).toLocaleString()}
          </p>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-sm text-gray-700">{item.reply_text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
