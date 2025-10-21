'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AutoReplyLog } from '@/lib/types';
import { Zap, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface AutoReplyLogsWidgetProps {
  userId: string;
  limit?: number;
}

export default function AutoReplyLogsWidget({ userId, limit = 10 }: AutoReplyLogsWidgetProps) {
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/auto-reply/logs?userId=${userId}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading auto-reply logs:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Auto-Replies</h2>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Recent Auto-Replies</h2>
          </div>
          <Link
            href="/dashboard/auto-reply-logs"
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
          >
            View All
            <ExternalLink className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No auto-replies sent yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Enable auto-reply in settings to start automatically responding
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, limit).map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {log.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {log.message_type === 'comment' ? 'Comment' : 'DM'}
                        </span>
                        <span className="text-sm text-gray-500">
                          to @{log.sender_username || 'unknown'}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            log.reply_type === 'automation'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {log.reply_type === 'automation' ? 'Auto' : 'AI Approved'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(log.sent_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-7">
                  <p className="text-sm text-gray-600 line-clamp-2">{log.reply_text}</p>
                  {!log.success && log.error_message && (
                    <p className="text-xs text-red-600 mt-1">Error: {log.error_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
