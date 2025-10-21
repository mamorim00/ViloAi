'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Profile, UnifiedInboxItem } from '@/lib/types';
import {
  Instagram,
  TrendingUp,
  LogOut,
  RefreshCw,
  Settings,
  MessageSquare,
  Zap,
  BarChart3,
  Flame,
  Clock,
  CheckCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SubscriptionWidget from '@/components/SubscriptionWidget';
import OnboardingFlow from '@/components/OnboardingFlow';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import UnifiedInboxItemComponent from '@/components/UnifiedInboxItem';

export default function DashboardPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inboxItems, setInboxItems] = useState<UnifiedInboxItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    leads: 0,
    pending_approval: 0,
    unanswered: 0,
    answered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    checkUser();
    loadInbox();
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

      // Show onboarding flow if not completed
      if (!profileData.onboarding_completed) {
        setShowOnboarding(true);
      }
    }
  };

  const loadInbox = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/unified-inbox?userId=${user.id}&filter=all`);
      if (response.ok) {
        const data = await response.json();
        // Show only first 10 items on dashboard
        setInboxItems((data.items || []).slice(0, 10));
        setStats(data.stats || { total: 0, leads: 0, pending_approval: 0, unanswered: 0, answered: 0 });
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!profile) return;

    setSyncing(true);
    try {
      // Sync both DMs and comments
      const [dmResponse, commentResponse] = await Promise.all([
        fetch('/api/messages/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id }),
        }),
        fetch('/api/comments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.id }),
        }),
      ]);

      if (dmResponse.ok && commentResponse.ok) {
        await loadInbox();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearMessages = async () => {
    if (!profile) return;

    const confirmed = confirm(
      'Are you sure you want to clear all old messages? This will delete all DMs, comments, and pending approvals. This action cannot be undone.'
    );

    if (!confirmed) return;

    setArchiving(true);
    try {
      const response = await fetch(`/api/messages/archive?userId=${profile.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadInbox();
        alert('All messages cleared successfully! You can now sync to start fresh.');
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Failed to clear messages. Please try again.');
    } finally {
      setArchiving(false);
    }
  };

  const handleApprove = async (queueItemId: string, editedReply?: string) => {
    if (!profile) return;

    try {
      const response = await fetch('/api/auto-reply/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItemId,
          userId: profile.id,
          editedReply,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve reply');
      }
    } catch (error) {
      console.error('Error approving reply:', error);
      throw error;
    }
  };

  const handleReject = async (queueItemId: string) => {
    if (!profile) return;

    try {
      const response = await fetch('/api/auto-reply/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItemId,
          userId: profile.id,
          reason: 'Rejected from dashboard',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject reply');
      }
    } catch (error) {
      console.error('Error rejecting reply:', error);
      throw error;
    }
  };

  const handleQuickReply = async (
    itemType: string,
    sourceId: string,
    replyText: string,
    conversationId?: string,
    senderId?: string
  ) => {
    if (!profile) return;

    try {
      const response = await fetch('/api/quick-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          itemType,
          sourceId,
          replyText,
          conversationId,
          senderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send quick reply');
      }
    } catch (error) {
      console.error('Error sending quick reply:', error);
      throw error;
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
      setProfile((prev) => (prev ? { ...prev, instagram_connected: false } : null));
    }
  };

  if (loading && !inboxItems.length) {
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
        {/* Subscription Success Message */}
        {typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('subscription') === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-green-900 mb-2">
                {t.subscription.activated || 'Subscription Activated!'}
              </h2>
              <p className="text-green-700">
                {t.subscription.activatedMessage ||
                  'Your subscription has been successfully activated. You can now start using ViloAi!'}
              </p>
            </div>
          )}

        {/* No Subscription Warning */}
        {profile && !profile.subscription_plan_id && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-orange-900 mb-2">
              {language === 'fi' ? 'Valitse tilauspaketti' : 'Choose a Subscription Plan'}
            </h2>
            <p className="text-orange-700 mb-4">
              {language === 'fi'
                ? 'Sinulla ei ole vielä tilaussuunnitelmaa. Valitse sopiva paketti aloittaaksesi.'
                : "You don't have a subscription plan yet. Choose a plan to get started."}
            </p>
            <Link
              href="/pricing"
              className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700"
            >
              {t.pricing.viewPlans || 'View Plans'}
            </Link>
          </div>
        )}

        {/* Instagram Connection */}
        {!profile?.instagram_connected ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-purple-900 mb-2">{t.dashboard.connectInstagram.title}</h2>
            <p className="text-purple-700 mb-4">{t.dashboard.connectInstagram.description}</p>
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
                <h2 className="text-xl font-bold text-green-900 mb-2">{t.dashboard.connected.title}</h2>
                <p className="text-green-700">{t.dashboard.connected.description}</p>
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

        {/* Onboarding Checklist - Only show if onboarding not completed */}
        {profile && !profile.onboarding_completed && (
          <div className="mb-8">
            <OnboardingChecklist profile={profile} onStepClick={() => setShowOnboarding(true)} />
          </div>
        )}

        {/* Quick Actions & Sync */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <div className="flex items-center space-x-3">
              {profile?.instagram_connected && (
                <>
                  <button
                    onClick={handleClearMessages}
                    disabled={archiving}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{archiving ? 'Clearing...' : 'Clear All Messages'}</span>
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing...' : 'Sync Messages'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
            title="Total Messages"
            value={stats.total}
            bgColor="bg-blue-50"
          />
          <StatCard icon={<Flame className="h-6 w-6 text-red-600" />} title="Leads" value={stats.leads} bgColor="bg-red-50" />
          <StatCard
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            title="Pending Approval"
            value={stats.pending_approval}
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<MessageSquare className="h-6 w-6 text-purple-600" />}
            title="Unanswered"
            value={stats.unanswered}
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            title="Answered"
            value={stats.answered}
            bgColor="bg-green-50"
          />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NavCard
            href="/dashboard/messages"
            icon={<MessageSquare className="h-12 w-12 text-purple-600" />}
            title="Messages"
            description="View and manage all Instagram DMs and comments with AI-powered replies"
            badge={stats.unanswered > 0 ? `${stats.unanswered} unanswered` : undefined}
          />
          <NavCard
            href="/dashboard/automation-rules"
            icon={<Zap className="h-12 w-12 text-orange-600" />}
            title="Automations"
            description="Manage automation rules and view auto-reply statistics"
            badge="View rules"
          />
          <NavCard
            href="/dashboard/analytics"
            icon={<BarChart3 className="h-12 w-12 text-blue-600" />}
            title="Analytics"
            description="Track engagement metrics, response times, and auto-reply performance"
            badge="View insights"
          />
        </div>

        {/* Recent Activity Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link
              href="/dashboard/messages"
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {inboxItems.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500 mb-6">
                {profile?.instagram_connected
                  ? 'Click "Sync Messages" to fetch your Instagram DMs and comments'
                  : 'Connect your Instagram account to start receiving messages'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inboxItems.map((item) => (
                <UnifiedInboxItemComponent
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onQuickReply={handleQuickReply}
                  onRefresh={loadInbox}
                />
              ))}
            </div>
          )}
        </div>

        {/* Onboarding Flow Modal */}
        {showOnboarding && profile && (
          <OnboardingFlow
            profile={profile}
            onClose={() => setShowOnboarding(false)}
            onComplete={() => {
              setShowOnboarding(false);
              checkUser(); // Refresh profile data
            }}
          />
        )}
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
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-purple-50 transition">{icon}</div>
        {badge && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{badge}</span>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="flex items-center justify-end mt-4 text-purple-600 group-hover:text-purple-700 font-medium">
        <span className="text-sm">Open</span>
        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition" />
      </div>
    </Link>
  );
}
