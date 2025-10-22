'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Profile, UnifiedInboxItem } from '@/lib/types';
import {
  Instagram,
  LogOut,
  RefreshCw,
  Settings,
  ArrowLeft,
  MessageSquare,
  Flame,
  Clock,
  CheckCircle,
  Inbox,
  Database,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import UnifiedInboxItemComponent from '@/components/UnifiedInboxItem';
import { useInboxStore } from '@/lib/stores/inboxStore';

type FilterType = 'all' | 'leads' | 'pending_approval' | 'unanswered' | 'answered';

export default function MessagesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allItems, setAllItems] = useState<UnifiedInboxItem[]>([]); // Store ALL items
  const [filteredItems, setFilteredItems] = useState<UnifiedInboxItem[]>([]); // Filtered view
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'list' | 'task'>('list'); // New: task-based mode
  const [stats, setStats] = useState({
    total: 0,
    leads: 0,
    pending_approval: 0,
    unanswered: 0,
    answered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  // Zustand store actions
  const {
    getCachedInbox,
    setCachedInbox,
    isCacheValid,
    invalidateCache,
    updateItem,
    removeItem,
  } = useInboxStore();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      loadInbox();
    }
  }, [profile]);

  // Client-side filtering whenever filter or allItems change
  useEffect(() => {
    applyFilter();
  }, [filter, allItems]);

  const applyFilter = () => {
    let filtered = [...allItems];

    switch (filter) {
      case 'leads':
        filtered = allItems.filter(item => item.lead_info.isLead);
        break;
      case 'pending_approval':
        filtered = allItems.filter(item => item.type === 'pending_approval');
        break;
      case 'unanswered':
        filtered = allItems.filter(item => !item.replied_at);
        break;
      case 'answered':
        filtered = allItems.filter(item => item.replied_at);
        break;
      default: // 'all'
        break;
    }

    // Sort filtered items: Leads first (by score) → Pending → Unanswered → Answered
    filtered.sort((a, b) => {
      // 1. Lead score (highest first)
      if (a.lead_info.score !== b.lead_info.score) {
        return b.lead_info.score - a.lead_info.score;
      }

      // 2. Pending approvals come first
      if (a.type === 'pending_approval' && b.type !== 'pending_approval') return -1;
      if (a.type !== 'pending_approval' && b.type === 'pending_approval') return 1;

      // 3. Unanswered before answered
      const aAnswered = !!a.replied_at;
      const bAnswered = !!b.replied_at;
      if (!aAnswered && bAnswered) return -1;
      if (aAnswered && !bAnswered) return 1;

      // 4. Most recent first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setFilteredItems(filtered);
  };

  // Background sync detection via Supabase Realtime
  useEffect(() => {
    if (!profile) return;

    console.log('📡 Setting up realtime subscriptions for new messages...');

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instagram_messages',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🆕 New message detected via realtime:', payload);
          // Invalidate cache and show notification
          invalidateCache(profile.id);
          // Optionally auto-refresh (could be configurable)
          // loadInbox(true);
        }
      )
      .subscribe();

    // Subscribe to new comments
    const commentsChannel = supabase
      .channel('inbox-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instagram_comments',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🆕 New comment detected via realtime:', payload);
          invalidateCache(profile.id);
        }
      )
      .subscribe();

    // Subscribe to queue changes
    const queueChannel = supabase
      .channel('inbox-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auto_reply_queue',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🔔 Queue update detected via realtime:', payload);
          invalidateCache(profile.id);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔌 Cleaning up realtime subscriptions');
      messagesChannel.unsubscribe();
      commentsChannel.unsubscribe();
      queueChannel.unsubscribe();
    };
  }, [profile]);

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

  const loadInbox = async (forceRefresh: boolean = false) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // CACHE-FIRST STRATEGY
    // 1. Check if we have valid cached data (unless force refresh)
    if (!forceRefresh && isCacheValid(user.id)) {
      const cached = getCachedInbox(user.id);
      if (cached) {
        console.log('✅ Loading inbox from cache (instant!)');
        setAllItems(cached.items); // Set all items, filtering happens in useEffect
        setStats(cached.stats);
        setLoadedFromCache(true);
        setLoading(false);
        return;
      }
    }

    // 2. Load from cache immediately for instant UI, then refresh in background
    const cached = getCachedInbox(user.id);
    if (cached && !forceRefresh) {
      console.log('📦 Loading stale cache while fetching fresh data...');
      setAllItems(cached.items); // Set all items
      setStats(cached.stats);
      setLoadedFromCache(true);
      setLoading(false); // Show cached data immediately, no spinner
    } else {
      setLoading(true);
    }

    // 3. Fetch fresh data from API (fetch ALL items, filter client-side)
    try {
      const response = await fetch(`/api/unified-inbox?userId=${user.id}&filter=all`);
      if (response.ok) {
        const data = await response.json();

        // Update UI
        setAllItems(data.items || []); // Set all items
        setStats(data.stats || { total: 0, leads: 0, pending_approval: 0, unanswered: 0, answered: 0 });

        // Update cache
        setCachedInbox(user.id, data.items || [], data.stats || { total: 0, leads: 0, pending_approval: 0, unanswered: 0, answered: 0 });

        setLoadedFromCache(false);
        console.log('✅ Inbox loaded from API and cached');
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
      // If fetch fails and we have cache, keep showing cached data
      if (cached) {
        console.log('⚠️ API failed, showing cached data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!profile) return;

    setSyncing(true);
    try {
      // Sync both DMs and comments (now MUCH faster - no AI analysis during sync)
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
        const dmData = await dmResponse.json();
        const commentData = await commentResponse.json();

        const newMessages = (dmData.syncedMessages || 0) + (commentData.syncedMessages || 0);

        console.log(`✅ Sync complete: ${newMessages} new messages synced (AI deferred)`);

        // Invalidate cache and force refresh if there are new messages
        if (newMessages > 0) {
          invalidateCache(profile.id);
          await loadInbox(true); // Force refresh
        } else {
          console.log('No new messages to display');
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!profile) return;
    console.log('🔄 Manual refresh triggered');
    invalidateCache(profile.id);
    await loadInbox(true);
  };

  const handleApprove = async (queueItemId: string, editedReply?: string) => {
    if (!profile) return;

    // Find the item in current view for optimistic update
    const item = allItems.find((i) => i.queue_item_id === queueItemId);

    try {
      // OPTIMISTIC UPDATE: Remove from pending queue immediately
      if (item) {
        removeItem(profile.id, item.id);
        setAllItems((prev) => prev.filter((i) => i.id !== item.id));
      }

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
      // Revert optimistic update on error
      await loadInbox(true);
      throw error;
    }
  };

  const handleReject = async (queueItemId: string) => {
    if (!profile) return;

    const item = allItems.find((i) => i.queue_item_id === queueItemId);

    try {
      // OPTIMISTIC UPDATE: Remove from queue immediately
      if (item) {
        removeItem(profile.id, item.id);
        setAllItems((prev) => prev.filter((i) => i.id !== item.id));
      }

      const response = await fetch('/api/auto-reply/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueItemId,
          userId: profile.id,
          reason: 'Rejected from inbox',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject reply');
      }
    } catch (error) {
      console.error('Error rejecting reply:', error);
      // Revert optimistic update on error
      await loadInbox(true);
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

    const item = allItems.find((i) => i.source_id === sourceId);

    try {
      // OPTIMISTIC UPDATE: Mark as replied immediately
      if (item) {
        const updatedItem = {
          ...item,
          replied_at: new Date().toISOString(),
          replied_by: 'manual',
          reply_text: replyText,
        };
        updateItem(profile.id, item.id, updatedItem);
        setAllItems((prev) =>
          prev.map((i) => (i.id === item.id ? updatedItem : i))
        );
      }

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
      // Revert optimistic update on error
      await loadInbox(true);
      throw error;
    }
  };

  const handleIgnore = async (itemType: string, sourceId: string) => {
    if (!profile) return;

    const item = allItems.find((i) => i.source_id === sourceId);

    try {
      // OPTIMISTIC UPDATE: Remove from view immediately
      if (item) {
        removeItem(profile.id, item.id);
        setAllItems((prev) => prev.filter((i) => i.id !== item.id));
      }

      const response = await fetch('/api/messages/ignore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          itemType,
          sourceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to ignore message');
      }
    } catch (error) {
      console.error('Error ignoring message:', error);
      // Revert optimistic update on error
      await loadInbox(true);
      throw error;
    }
  };

  const handleAddToPending = async (itemType: string, sourceId: string, aiSuggestion: string) => {
    if (!profile) return;

    const item = allItems.find((i) => i.source_id === sourceId);

    try {
      // OPTIMISTIC UPDATE: Convert to pending_approval type
      if (item) {
        const updatedItem = {
          ...item,
          type: 'pending_approval' as const,
        };
        updateItem(profile.id, item.id, updatedItem);
        setAllItems((prev) =>
          prev.map((i) => (i.id === item.id ? updatedItem : i))
        );
      }

      const response = await fetch('/api/messages/add-to-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          itemType,
          sourceId,
          aiSuggestion,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to pending');
      }

      // Refresh to get updated queue item
      await loadInbox(true);
    } catch (error) {
      console.error('Error adding to pending:', error);
      // Revert optimistic update on error
      await loadInbox(true);
      throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getFilterCount = (filterType: FilterType): number => {
    switch (filterType) {
      case 'all':
        return stats.total;
      case 'leads':
        return stats.leads;
      case 'pending_approval':
        return stats.pending_approval;
      case 'unanswered':
        return stats.unanswered;
      case 'answered':
        return stats.answered;
      default:
        return 0;
    }
  };

  if (loading && !filteredItems.length && filter === 'all') {
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
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              </div>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
            title="Total"
            value={stats.total}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<Flame className="h-6 w-6 text-red-600" />}
            title="Leads"
            value={stats.leads}
            bgColor="bg-red-50"
          />
          <StatCard
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            title="Pending"
            value={stats.pending_approval}
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<Inbox className="h-6 w-6 text-purple-600" />}
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

        {/* Filter Bar and Sync */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <FilterButton
                label="All"
                count={getFilterCount('all')}
                active={filter === 'all'}
                onClick={() => setFilter('all')}
              />
              <FilterButton
                label="Leads"
                icon={<Flame className="h-4 w-4" />}
                count={getFilterCount('leads')}
                active={filter === 'leads'}
                onClick={() => setFilter('leads')}
              />
              <FilterButton
                label="Pending"
                icon={<Clock className="h-4 w-4" />}
                count={getFilterCount('pending_approval')}
                active={filter === 'pending_approval'}
                onClick={() => setFilter('pending_approval')}
              />
              <FilterButton
                label="Unanswered"
                count={getFilterCount('unanswered')}
                active={filter === 'unanswered'}
                onClick={() => setFilter('unanswered')}
              />
              <FilterButton
                label="Answered"
                count={getFilterCount('answered')}
                active={filter === 'answered'}
                onClick={() => setFilter('answered')}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Cache Indicator */}
              {loadedFromCache && (
                <span className="flex items-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                  <Database className="h-3 w-3" />
                  <span>Cached</span>
                </span>
              )}

              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Refresh inbox from database"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Sync Button (Instagram API) */}
              {profile?.instagram_connected && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Sync new messages from Instagram"
                >
                  <Instagram className="h-4 w-4" />
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Instagram'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inbox Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading messages...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No messages yet' : `No ${filter.replace('_', ' ')} messages`}
              </h3>
              <p className="text-gray-500 mb-6">
                {profile?.instagram_connected
                  ? filter === 'all'
                    ? 'Click "Sync Messages" to fetch your Instagram DMs and comments'
                    : `Try selecting a different filter to see messages`
                  : 'Connect your Instagram account to start receiving messages'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <UnifiedInboxItemComponent
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onQuickReply={handleQuickReply}
                  onIgnore={handleIgnore}
                  onAddToPending={handleAddToPending}
                  onRefresh={loadInbox}
                />
              ))}
            </div>
          )}
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
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium text-sm transition ${
        active
          ? 'bg-purple-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      <span className={`ml-1 ${active ? 'text-purple-100' : 'text-gray-500'}`}>({count})</span>
    </button>
  );
}
