'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AutoReplyQueue } from '@/lib/types';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Send, MessageSquare, Clock } from 'lucide-react';

export default function AutoReplyQueuePage() {
  const router = useRouter();
  const [queueItems, setQueueItems] = useState<AutoReplyQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedReply, setEditedReply] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUserId(user.id);
      loadQueue(user.id);
    }
  };

  const loadQueue = async (uid: string) => {
    try {
      const response = await fetch(`/api/auto-reply/queue?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setQueueItems(data.queue || []);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: AutoReplyQueue, edited?: string) => {
    if (!userId) return;

    setProcessing(item.id);
    try {
      const response = await fetch('/api/auto-reply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItemId: item.id,
          userId,
          editedReply: edited || null,
        }),
      });

      if (response.ok) {
        alert('Reply sent successfully!');
        await loadQueue(userId);
        setEditingId(null);
        setEditedReply('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Error approving reply:', error);
      alert('Failed to send reply');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: AutoReplyQueue) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to reject this AI-generated reply?')) return;

    setProcessing(item.id);
    try {
      const response = await fetch('/api/auto-reply/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItemId: item.id,
          userId,
          reason: 'Rejected by user',
        }),
      });

      if (response.ok) {
        await loadQueue(userId);
      }
    } catch (error) {
      console.error('Error rejecting reply:', error);
    } finally {
      setProcessing(null);
    }
  };

  const startEditing = (item: AutoReplyQueue) => {
    setEditingId(item.id);
    setEditedReply(item.suggested_reply);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditedReply('');
  };

  const saveAndSend = (item: AutoReplyQueue) => {
    handleApprove(item, editedReply);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading approval queue...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Auto-Reply Approval Queue</h1>
              <p className="text-gray-600 mt-2">
                Review and approve AI-generated replies before they are sent
              </p>
            </div>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-semibold">
              {queueItems.length} Pending
            </div>
          </div>
        </div>

        {/* Queue Items */}
        {queueItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h2>
            <p className="text-gray-600">
              No pending replies to approve. AI-generated replies will appear here when new messages arrive.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {queueItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-gray-900">
                        {item.message_type === 'comment' ? 'Instagram Comment' : 'Instagram DM'}
                      </span>
                      <span className="text-sm text-gray-500">from @{item.sender_username}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {getTimeAgo(item.created_at)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  {/* Original Message */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      Customer Message:
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-900">{item.message_text}</p>
                    </div>
                  </div>

                  {/* AI-Generated Reply */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                      AI-Generated Reply ({item.detected_language === 'fi' ? 'Finnish' : 'English'}):
                    </label>
                    {editingId === item.id ? (
                      <textarea
                        value={editedReply}
                        onChange={(e) => setEditedReply(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-gray-900">{item.suggested_reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    {editingId === item.id ? (
                      <div className="flex space-x-3 w-full">
                        <button
                          onClick={() => saveAndSend(item)}
                          disabled={processing === item.id}
                          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Send className="h-5 w-5 mr-2" />
                          Send Edited Reply
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={processing === item.id}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={processing === item.id}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            {processing === item.id ? 'Sending...' : 'Approve & Send'}
                          </button>
                          <button
                            onClick={() => startEditing(item)}
                            disabled={processing === item.id}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center"
                          >
                            <Edit2 className="h-5 w-5 mr-2" />
                            Edit
                          </button>
                        </div>
                        <button
                          onClick={() => handleReject(item)}
                          disabled={processing === item.id}
                          className="text-red-600 hover:text-red-700 px-4 py-3 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {queueItems.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can edit the AI-generated reply before sending if you want to make any adjustments.
              Once approved, the reply will be posted to Instagram immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
