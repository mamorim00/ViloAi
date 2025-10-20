'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { InstagramMessage } from '@/lib/types';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import Link from 'next/link';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InstagramMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: messagesData } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (messagesData) {
      setMessages(messagesData);
      if (messagesData.length > 0) {
        setSelectedMessage(messagesData[0]);
      }
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages & AI Suggestions</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-purple-600 text-white font-semibold">Messages</div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedMessage?.id === message.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <p className="font-semibold text-gray-900">
                    {message.sender_name || message.sender_username}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{message.message_text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="p-8 text-center text-gray-500">No messages yet</div>
              )}
            </div>
          </div>

          {/* Message Detail & AI Suggestions */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Original Message */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Message Details</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">From</p>
                      <p className="text-gray-900">
                        {selectedMessage.sender_name || selectedMessage.sender_username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date</p>
                      <p className="text-gray-900">
                        {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Intent</p>
                      <p className="text-gray-900 capitalize">
                        {selectedMessage.intent?.replace('_', ' ') || 'Unknown'}
                        {selectedMessage.intent_confidence && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({Math.round(selectedMessage.intent_confidence * 100)}% confidence)
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Message</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedMessage.message_text}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    AI Reply Suggestions
                  </h2>

                  {/* Finnish Suggestion */}
                  {selectedMessage.ai_reply_suggestion_fi && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">Finnish (Suomi)</p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedMessage.ai_reply_suggestion_fi!,
                              'fi-' + selectedMessage.id
                            )
                          }
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
                        >
                          {copiedId === 'fi-' + selectedMessage.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedMessage.ai_reply_suggestion_fi}</p>
                      </div>
                    </div>
                  )}

                  {/* English Suggestion */}
                  {selectedMessage.ai_reply_suggestion_en && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">English</p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedMessage.ai_reply_suggestion_en!,
                              'en-' + selectedMessage.id
                            )
                          }
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
                        >
                          {copiedId === 'en-' + selectedMessage.id ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedMessage.ai_reply_suggestion_en}</p>
                      </div>
                    </div>
                  )}

                  {!selectedMessage.ai_reply_suggestion_fi &&
                    !selectedMessage.ai_reply_suggestion_en && (
                      <p className="text-gray-500 text-center py-8">
                        No AI suggestions available for this message
                      </p>
                    )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Select a message to view details and AI suggestions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
