'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { InstagramMessage, FollowerInsight, Profile } from '@/lib/types';
import {
  Instagram,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  MapPin,
  Clock,
  LogOut,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SubscriptionWidget from '@/components/SubscriptionWidget';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<InstagramMessage[]>([]);
  const [followers, setFollowers] = useState<FollowerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkUser();
    loadDashboardData();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
    }
  };

  const loadDashboardData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Load recent messages
    const { data: messagesData } = await supabase
      .from('instagram_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (messagesData) {
      setMessages(messagesData);
    }

    // Load top followers
    const { data: followersData } = await supabase
      .from('follower_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('total_engagement_score', { ascending: false })
      .limit(5);

    if (followersData) {
      setFollowers(followersData);
    }

    setLoading(false);
  };

  const handleSync = async () => {
    if (!profile) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/messages/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (response.ok) {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleConnectInstagram = () => {
    window.location.href = '/api/auth/instagram';
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm('Are you sure you want to disconnect Instagram?')) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        instagram_connected: false,
        instagram_access_token: null,
        instagram_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, instagram_connected: false } : null);
    }
  };

  const stats = {
    totalMessages: messages.length,
    priceInquiries: messages.filter((m) => m.intent === 'price_inquiry').length,
    availabilityQuestions: messages.filter((m) => m.intent === 'availability').length,
    locationRequests: messages.filter((m) => m.intent === 'location').length,
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Instagram className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              <span className="text-gray-700">
                {profile?.business_name || profile?.full_name || profile?.email}
              </span>
              <Link
                href="/dashboard/settings"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-5 w-5" />
                <span>{t.common.settings}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span>{t.common.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instagram Connection */}
        {!profile?.instagram_connected ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-purple-900 mb-2">
              {t.dashboard.connectInstagram.title}
            </h2>
            <p className="text-purple-700 mb-4">
              {t.dashboard.connectInstagram.description}
            </p>
            <button
              onClick={handleConnectInstagram}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700"
            >
              {t.dashboard.connectInstagram.button}
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-2">
                  {t.dashboard.connected.title}
                </h2>
                <p className="text-green-700">
                  {t.dashboard.connected.description}
                </p>
              </div>
              <button
                onClick={handleDisconnectInstagram}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700"
              >
                {t.dashboard.connected.disconnect}
              </button>
            </div>
          </div>
        )}

        {/* Subscription Widget */}
        {profile && (
          <div className="mb-8">
            <SubscriptionWidget userId={profile.id} />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<MessageSquare className="h-8 w-8 text-blue-600" />}
            title={t.dashboard.stats.totalMessages}
            value={stats.totalMessages}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<DollarSign className="h-8 w-8 text-green-600" />}
            title={t.dashboard.stats.priceInquiries}
            value={stats.priceInquiries}
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<Clock className="h-8 w-8 text-orange-600" />}
            title={t.dashboard.stats.availability}
            value={stats.availabilityQuestions}
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<MapPin className="h-8 w-8 text-red-600" />}
            title={t.dashboard.stats.locationRequests}
            value={stats.locationRequests}
            bgColor="bg-red-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{t.dashboard.recentMessages}</h2>
              <Link href="/dashboard/messages" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                {t.dashboard.viewAll}
              </Link>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div></div>
              {profile?.instagram_connected && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? t.dashboard.syncing : t.dashboard.sync}</span>
                </button>
              )}
            </div>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.dashboard.noMessages}</p>
              ) : (
                messages.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))
              )}
            </div>
          </div>

          {/* Top Followers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              {t.dashboard.topFollowers}
            </h2>
            <div className="space-y-4">
              {followers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t.dashboard.noFollowerData}</p>
              ) : (
                followers.map((follower, index) => (
                  <FollowerCard key={follower.id} follower={follower} rank={index + 1} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

function MessageCard({ message }: { message: InstagramMessage }) {
  const { t } = useLanguage();
  const intentColors: Record<string, string> = {
    price_inquiry: 'bg-green-100 text-green-800',
    availability: 'bg-orange-100 text-orange-800',
    location: 'bg-red-100 text-red-800',
    general_question: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800',
  };

  // Detect language: check if message text contains Finnish characters or common Finnish words
  const detectLanguage = (text: string): 'fi' | 'en' => {
    if (!text) return 'en';
    const lowerText = text.toLowerCase();
    const finnishKeywords = ['hinta', 'mikä', 'mitä', 'missä', 'kuinka', 'onko', 'voiko', 'voinko', 'kiitos', 'ole', 'saatavilla', 'maksa'];
    const hasFinnishKeywords = finnishKeywords.some(keyword => lowerText.includes(keyword));
    // Check for Finnish characters ä, ö
    const hasFinnishChars = /[äöå]/i.test(text);
    return (hasFinnishKeywords || hasFinnishChars) ? 'fi' : 'en';
  };

  const detectedLang = detectLanguage(message.message_text || '');
  const aiSuggestion = detectedLang === 'fi' ? message.ai_reply_suggestion_fi : message.ai_reply_suggestion_en;
  const languageLabel = detectedLang === 'fi' ? 'FI' : 'EN';

  // Get translated intent label
  const intentLabel = message.intent ? t.intents[message.intent as keyof typeof t.intents] : '';

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-900">{message.sender_name || message.sender_username}</p>
          <p className="text-sm text-gray-500">
            {new Date(message.timestamp).toLocaleString()}
          </p>
        </div>
        {message.intent && (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              intentColors[message.intent] || intentColors.other
            }`}
          >
            {intentLabel}
          </span>
        )}
      </div>
      <p className="text-gray-700 mb-2">{message.message_text}</p>
      {aiSuggestion && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-1">{t.dashboard.aiSuggestion} ({languageLabel}):</p>
          <p className="text-sm text-gray-700">{aiSuggestion}</p>
        </div>
      )}
    </div>
  );
}

function FollowerCard({ follower, rank }: { follower: FollowerInsight; rank: number }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
          {rank}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {follower.follower_name || follower.follower_username}
          </p>
          <p className="text-sm text-gray-500">{follower.message_count} {t.dashboard.messages}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-green-600" />
        <span className="text-sm font-medium text-gray-700">
          {follower.total_engagement_score}
        </span>
      </div>
    </div>
  );
}
