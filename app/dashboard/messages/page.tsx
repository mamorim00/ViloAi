'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { InstagramMessage } from '@/lib/types';
import { ArrowLeft, Copy, Check, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<InstagramMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InstagramMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [markingReply, setMarkingReply] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, filter]);

  const filterMessages = () => {
    let filtered = [...messages];
    if (filter === 'answered') {
      filtered = filtered.filter(m => m.replied_at !== null);
    } else if (filter === 'unanswered') {
      filtered = filtered.filter(m => m.replied_at === null);
    }
    setFilteredMessages(filtered);
  };

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

  const handleMarkAsReplied = async (messageId: string, replied: boolean) => {
    setMarkingReply(true);
    try {
      const response = await fetch(`/api/messages/${messageId}/mark-replied`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replied }),
      });

      if (response.ok) {
        // Reload messages to reflect changes
        await loadMessages();
      }
    } catch (error) {
      console.error('Error marking message:', error);
    } finally {
      setMarkingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t.messages.backToDashboard}
          </Link>
          <LanguageToggle />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.messages.title}</h1>

        {/* Filter Buttons */}
        <div className="mb-6 flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.messageStatus.all}
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'unanswered'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.messageStatus.unanswered}
          </button>
          <button
            onClick={() => setFilter('answered')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'answered'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.messageStatus.answered}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-purple-600 text-white font-semibold">{t.messages.messagesTitle}</div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedMessage?.id === message.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {message.sender_name || message.sender_username}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{message.message_text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {message.replied_at && (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              ))}
              {filteredMessages.length === 0 && (
                <div className="p-8 text-center text-gray-500">{t.dashboard.noMessages}</div>
              )}
            </div>
          </div>

          {/* Message Detail & AI Suggestions */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Original Message */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t.messages.messageDetails}</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t.messages.from}</p>
                      <p className="text-gray-900">
                        {selectedMessage.sender_name || selectedMessage.sender_username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t.messages.date}</p>
                      <p className="text-gray-900">
                        {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t.messages.intent}</p>
                      <p className="text-gray-900 capitalize">
                        {selectedMessage.intent ? t.intents[selectedMessage.intent as keyof typeof t.intents] : 'Unknown'}
                        {selectedMessage.intent_confidence && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({Math.round(selectedMessage.intent_confidence * 100)}% {t.messages.confidence})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">{t.messages.message}</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-900">{selectedMessage.message_text}</p>
                      </div>
                    </div>

                    {/* Reply Status & Mark Button */}
                    <div className="pt-4 border-t border-gray-200">
                      {selectedMessage.replied_at ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <div>
                              <p className="font-medium">
                                {selectedMessage.replied_by === 'instagram_auto'
                                  ? t.messageStatus.repliedAuto
                                  : t.messageStatus.repliedManual}
                              </p>
                              <p className="text-sm text-gray-600">
                                {t.messageStatus.repliedAt}: {new Date(selectedMessage.replied_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsReplied(selectedMessage.id, false)}
                            disabled={markingReply}
                            className="text-gray-600 hover:text-gray-900 text-sm underline disabled:opacity-50"
                          >
                            {t.messageStatus.markAsUnanswered}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkAsReplied(selectedMessage.id, true)}
                          disabled={markingReply}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Check className="h-5 w-5 mr-2" />
                          {markingReply ? t.common.loading : t.messageStatus.markAsAnswered}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {t.messages.aiReplySuggestions}
                  </h2>

                  {/* Finnish Suggestion */}
                  {selectedMessage.ai_reply_suggestion_fi && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600">{t.messages.finnish}</p>
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
                              <span>{t.messages.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>{t.messages.copy}</span>
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
                        <p className="text-sm font-medium text-gray-600">{t.messages.english}</p>
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
                              <span>{t.messages.copied}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>{t.messages.copy}</span>
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
                        {t.messages.noSuggestions}
                      </p>
                    )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">{t.messages.selectMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
