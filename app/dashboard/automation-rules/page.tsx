'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { AutomationRule, TriggerType, MatchType } from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Zap, MessageSquare, Hash, CheckCircle, Clock, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

interface AutoReplyStats {
  total_sent: number;
  sent_today: number;
  sent_this_week: number;
  automation_rules_used: number;
  ai_suggestions_used: number;
}

export default function AutomationRulesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutoReplyStats>({
    total_sent: 0,
    sent_today: 0,
    sent_this_week: 0,
    automation_rules_used: 0,
    ai_suggestions_used: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AutomationRule>>({});
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    trigger_type: 'both',
    trigger_text: '',
    reply_text: '',
    match_type: 'exact',
    is_active: true,
  });
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
      loadRules(user.id);
      loadStats(user.id);
      loadProfile(user.id);
    }
  };

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const loadRules = async (uid: string) => {
    try {
      const response = await fetch(`/api/automation-rules?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (uid: string) => {
    try {
      const response = await fetch(`/api/auto-reply/logs?userId=${uid}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        const logs = data.logs || [];

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const sentToday = logs.filter((log: any) => new Date(log.sent_at) >= today).length;
        const sentThisWeek = logs.filter((log: any) => new Date(log.sent_at) >= weekAgo).length;
        const automationRulesUsed = logs.filter((log: any) => log.reply_source === 'automation_rule').length;
        const aiSuggestionsUsed = logs.filter((log: any) => log.reply_source === 'ai_approved').length;

        setStats({
          total_sent: logs.length,
          sent_today: sentToday,
          sent_this_week: sentThisWeek,
          automation_rules_used: automationRulesUsed,
          ai_suggestions_used: aiSuggestionsUsed,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreateRule = async () => {
    if (!userId || !newRule.trigger_text || !newRule.reply_text) {
      alert('Please fill in trigger text and reply text');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newRule }),
      });

      if (response.ok) {
        await loadRules(userId);
        setNewRule({
          trigger_type: 'both',
          trigger_text: '',
          reply_text: '',
          match_type: 'exact',
          is_active: true,
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create rule');
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<AutomationRule>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/automation-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok && userId) {
        await loadRules(userId);
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/automation-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok && userId) {
        await loadRules(userId);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: AutomationRule) => {
    await handleUpdateRule(rule.id, { is_active: !rule.is_active });
  };

  const startEditing = (rule: AutomationRule) => {
    setEditingId(rule.id);
    setEditForm(rule);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId) {
      handleUpdateRule(editingId, editForm);
    }
  };

  const getTriggerTypeIcon = (type: TriggerType) => {
    switch (type) {
      case 'comment': return '💬';
      case 'dm': return '✉️';
      case 'both': return '🔄';
      default: return '📝';
    }
  };

  const getMatchTypeBadge = (type: MatchType) => {
    const colors = {
      exact: 'bg-blue-100 text-blue-800',
      contains: 'bg-green-100 text-green-800',
      starts_with: 'bg-purple-100 text-purple-800',
    };
    return colors[type];
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
                <Zap className="h-8 w-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            Create rules to automatically reply to specific messages instantly. Perfect for FAQs, promotions, and common inquiries.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={<Zap className="h-6 w-6 text-orange-600" />}
            title="Active Rules"
            value={rules.filter((r) => r.is_active).length}
            bgColor="bg-orange-50"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            title="Total Sent"
            value={stats.total_sent}
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<Clock className="h-6 w-6 text-blue-600" />}
            title="Today"
            value={stats.sent_today}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            title="This Week"
            value={stats.sent_this_week}
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<Hash className="h-6 w-6 text-gray-600" />}
            title="Auto Rules"
            value={stats.automation_rules_used}
            bgColor="bg-gray-50"
          />
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">How Automation Rules Work:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Exact Match:</strong> Triggers only if the message exactly matches (case-insensitive)</li>
            <li><strong>Contains:</strong> Triggers if the message contains the trigger text anywhere</li>
            <li><strong>Starts With:</strong> Triggers if the message starts with the trigger text</li>
            <li><strong>Priority:</strong> Automation rules are checked before AI analysis - instant replies!</li>
          </ul>
        </div>

        {/* Add New Rule Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Automation Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Text</label>
              <input
                type="text"
                value={newRule.trigger_text}
                onChange={(e) => setNewRule({ ...newRule, trigger_text: e.target.value })}
                placeholder='e.g., "send hi", "price", "hours"'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reply Text</label>
              <input
                type="text"
                value={newRule.reply_text}
                onChange={(e) => setNewRule({ ...newRule, reply_text: e.target.value })}
                placeholder="e.g., Here's your ebook: https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Type</label>
              <select
                value={newRule.match_type}
                onChange={(e) => setNewRule({ ...newRule, match_type: e.target.value as MatchType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="exact">Exact Match</option>
                <option value="contains">Contains</option>
                <option value="starts_with">Starts With</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apply To</label>
              <select
                value={newRule.trigger_type}
                onChange={(e) => setNewRule({ ...newRule, trigger_type: e.target.value as TriggerType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="both">Both Comments & DMs</option>
                <option value="comment">Comments Only</option>
                <option value="dm">DMs Only</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleCreateRule}
            disabled={saving || !newRule.trigger_text || !newRule.reply_text}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Automation Rule
          </button>
        </div>

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Your Automation Rules ({rules.length})
          </h2>
          {rules.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No automation rules yet. Create your first rule above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`border rounded-lg p-5 ${
                    rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  {editingId === rule.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Text</label>
                          <input
                            type="text"
                            value={editForm.trigger_text}
                            onChange={(e) => setEditForm({ ...editForm, trigger_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reply Text</label>
                          <input
                            type="text"
                            value={editForm.reply_text}
                            onChange={(e) => setEditForm({ ...editForm, reply_text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
                          <select
                            value={editForm.match_type}
                            onChange={(e) => setEditForm({ ...editForm, match_type: e.target.value as MatchType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="exact">Exact Match</option>
                            <option value="contains">Contains</option>
                            <option value="starts_with">Starts With</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Apply To</label>
                          <select
                            value={editForm.trigger_type}
                            onChange={(e) => setEditForm({ ...editForm, trigger_type: e.target.value as TriggerType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="both">Both</option>
                            <option value="comment">Comments</option>
                            <option value="dm">DMs</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          <X className="h-4 w-4 mr-2 inline" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{getTriggerTypeIcon(rule.trigger_type)}</span>
                            <span className="font-bold text-gray-900 text-lg">&ldquo;{rule.trigger_text}&rdquo;</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMatchTypeBadge(rule.match_type)}`}>
                              {rule.match_type.replace('_', ' ')}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-gray-700 ml-11">→ {rule.reply_text}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3 ml-11">
                            <span>Type: {rule.trigger_type === 'both' ? 'Comments & DMs' : rule.trigger_type === 'comment' ? 'Comments' : 'DMs'}</span>
                            <span className="flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              Used {rule.usage_count} times
                            </span>
                            {rule.last_used_at && (
                              <span>Last used: {new Date(rule.last_used_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleActive(rule)}
                            disabled={saving}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                            title={rule.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <div className={`w-10 h-6 rounded-full transition ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${rule.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                            </div>
                          </button>
                          <button
                            onClick={() => startEditing(rule)}
                            disabled={saving}
                            className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
