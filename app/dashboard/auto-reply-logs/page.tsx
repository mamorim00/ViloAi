'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AutoReplyLog } from '@/lib/types';
import { ArrowLeft, CheckCircle, XCircle, Zap, Filter } from 'lucide-react';

export default function AutoReplyLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AutoReplyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'automation' | 'ai_approved'>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [logs, filter]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUserId(user.id);
      loadLogs(user.id);
    }
  };

  const loadLogs = async (uid: string) => {
    try {
      const response = await fetch(`/api/auto-reply/logs?userId=${uid}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredLogs(logs);
    } else {
      setFilteredLogs(logs.filter(log => log.reply_type === filter));
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

  const stats = {
    total: logs.length,
    automation: logs.filter(l => l.reply_type === 'automation').length,
    aiApproved: logs.filter(l => l.reply_type === 'ai_approved').length,
    successful: logs.filter(l => l.success).length,
    failed: logs.filter(l => !l.success).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center mb-2">
            <Zap className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Auto-Reply Logs</h1>
          </div>
          <p className="text-gray-600">Complete audit trail of all automatic replies sent</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Replies</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Automation</div>
            <div className="text-2xl font-bold text-blue-600">{stats.automation}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">AI Approved</div>
            <div className="text-2xl font-bold text-green-600">{stats.aiApproved}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Successful</div>
            <div className="text-2xl font-bold text-green-500">{stats.successful}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Failed</div>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('automation')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'automation' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Automation ({stats.automation})
            </button>
            <button
              onClick={() => setFilter('ai_approved')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'ai_approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              AI Approved ({stats.aiApproved})
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-5 ${
                      log.success ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {log.success ? (
                          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-semibold text-gray-900">
                              {log.message_type === 'comment' ? 'Instagram Comment' : 'Instagram DM'}
                            </span>
                            <span className="text-sm text-gray-600">
                              to @{log.sender_username || 'unknown'}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                log.reply_type === 'automation'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {log.reply_type === 'automation' ? 'Automation Rule' : 'AI Approved'}
                            </span>
                          </div>
                          {log.original_message_text && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-1">Original Message:</div>
                              <div className="bg-gray-50 rounded p-2 text-sm text-gray-700">
                                {log.original_message_text}
                              </div>
                            </div>
                          )}
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 mb-1">Reply Sent:</div>
                            <div className="text-gray-900">{log.reply_text}</div>
                          </div>
                          {!log.success && log.error_message && (
                            <div className="bg-red-100 border border-red-200 rounded p-2 mt-2">
                              <p className="text-sm text-red-800">
                                <strong>Error:</strong> {log.error_message}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            <span>{getTimeAgo(log.sent_at)}</span>
                            {log.instagram_reply_id && (
                              <span>ID: {log.instagram_reply_id.substring(0, 12)}...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
