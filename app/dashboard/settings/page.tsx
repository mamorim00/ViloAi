'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { BusinessRule, RuleType, AutoReplySettings, Profile } from '@/lib/types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Zap, MessageSquare, AlertTriangle, CreditCard, ArrowUpCircle, Download, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [rules, setRules] = useState<BusinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<BusinessRule>>({
    rule_type: 'price',
    rule_key: '',
    rule_value: '',
    is_active: true,
  });
  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplySettings>({
    auto_reply_comments_enabled: false,
    auto_reply_dms_enabled: false,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingBillingPortal, setLoadingBillingPortal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUserId(user.id);
      loadRules();
      loadAutoReplySettings(user.id);
      loadProfile(user.id);
      loadSubscriptionPlans();
    }
  };

  const loadProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (!error && data) {
        setSubscriptionPlans(data);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const handleManageSubscription = async () => {
    if (!userId) return;

    setLoadingBillingPortal(true);
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        alert('Failed to open billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoadingBillingPortal(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!userId) return;

    setLoadingBillingPortal(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        alert(`Failed to process subscription change: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error processing subscription change:', error);
      alert('Failed to process subscription change. Please try again.');
    } finally {
      setLoadingBillingPortal(false);
    }
  };

  const loadRules = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/business-rules', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

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

  const handleCreateRule = async () => {
    if (!newRule.rule_key || !newRule.rule_value) {
      alert(t.settings.fillAllFields);
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/business-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newRule),
      });

      if (response.ok) {
        await loadRules();
        setNewRule({
          rule_type: 'price',
          rule_key: '',
          rule_value: '',
          is_active: true,
        });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<BusinessRule>) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/business-rules/${ruleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadRules();
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(t.settings.confirmDelete)) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/business-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (rule: BusinessRule) => {
    await handleUpdateRule(rule.id, { is_active: !rule.is_active });
  };

  const getRulesByType = (type: RuleType) => {
    return rules.filter(r => r.rule_type === type);
  };

  const loadAutoReplySettings = async (uid: string) => {
    try {
      const response = await fetch(`/api/settings/auto-reply?userId=${uid}`);
      if (response.ok) {
        const data = await response.json();
        setAutoReplySettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading auto-reply settings:', error);
    }
  };

  const toggleAutoReplySetting = async (setting: 'comments' | 'dms') => {
    if (!userId) return;

    setSaving(true);
    try {
      const updates = setting === 'comments'
        ? { auto_reply_comments_enabled: !autoReplySettings.auto_reply_comments_enabled }
        : { auto_reply_dms_enabled: !autoReplySettings.auto_reply_dms_enabled };

      const response = await fetch('/api/settings/auto-reply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutoReplySettings(data.settings);
      }
    } catch (error) {
      console.error('Error updating auto-reply settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearMessages = async () => {
    if (!userId) return;

    const confirmed = confirm(
      'Are you sure you want to clear all old messages? This will permanently delete all DMs, comments, and pending approvals. After clearing, only new messages synced after this point will appear. This action cannot be undone.'
    );

    if (!confirmed) return;

    setClearing(true);
    try {
      const response = await fetch(`/api/messages/archive?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('All messages cleared successfully! When you sync next, only new messages will appear.');
      } else {
        alert('Failed to clear messages. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Failed to clear messages. Please try again.');
    } finally {
      setClearing(false);
    }
  };

  const handleExportData = async () => {
    if (!userId) return;

    setExportingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/gdpr/export-data', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `viloai-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Your data has been exported successfully!');
      } else {
        alert('Failed to export data. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    const confirmation1 = confirm(
      '⚠️ WARNING: This will PERMANENTLY delete your account and ALL data.\n\n' +
      'This includes:\n' +
      '• Your profile and account\n' +
      '• All Instagram messages and comments\n' +
      '• All analytics and insights\n' +
      '• All automation rules and settings\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Are you absolutely sure you want to delete your account?'
    );

    if (!confirmation1) return;

    const confirmation2 = confirm(
      '⚠️ FINAL WARNING ⚠️\n\n' +
      'You are about to permanently delete your account.\n\n' +
      'Type "DELETE" in the next dialog to confirm.'
    );

    if (!confirmation2) return;

    const userInput = prompt('Type DELETE (in capital letters) to confirm account deletion:');

    if (userInput !== 'DELETE') {
      alert('Account deletion cancelled. The text did not match.');
      return;
    }

    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        alert('Your account has been permanently deleted. You will now be logged out.');
        await supabase.auth.signOut();
        router.push('/');
      } else {
        const data = await response.json();
        alert(`Failed to delete account: ${data.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    } finally {
      setDeletingAccount(false);
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link
              href="/dashboard"
              className="flex items-center text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.settings.backToDashboard}
            </Link>
            <LanguageToggle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="text-gray-600 mt-2">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Subscription Management */}
        {profile && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border border-blue-100">
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Subscription & Billing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Current Plan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-bold text-gray-900 capitalize">
                      {profile.subscription_tier || 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold capitalize ${
                      profile.subscription_status === 'active' ? 'text-green-600' :
                      profile.subscription_status === 'past_due' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {profile.subscription_status || 'inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages this month:</span>
                    <span className="font-semibold text-gray-900">
                      {profile.monthly_message_count || 0}
                    </span>
                  </div>
                </div>

                {profile.stripe_customer_id && profile.subscription_tier !== 'free' && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loadingBillingPortal}
                    className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>{loadingBillingPortal ? 'Loading...' : 'Manage Subscription'}</span>
                  </button>
                )}
              </div>

              {/* Upgrade Options */}
              <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Upgrade Your Plan</h3>
                <div className="space-y-3">
                  {subscriptionPlans
                    .filter(plan => {
                      const currentPlanIndex = subscriptionPlans.findIndex(p => p.name === profile.subscription_tier);
                      const thisPlanIndex = subscriptionPlans.findIndex(p => p.id === plan.id);
                      return thisPlanIndex > currentPlanIndex;
                    })
                    .map(plan => (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{plan.name}</p>
                          <p className="text-sm text-gray-600">
                            {plan.price_monthly === 0 ? 'Free' : `€${plan.price_monthly}/month`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUpgrade(plan.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-semibold"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          <span>Upgrade</span>
                        </button>
                      </div>
                    ))}
                  {subscriptionPlans.filter(plan => {
                    const currentPlanIndex = subscriptionPlans.findIndex(p => p.name === profile.subscription_tier);
                    const thisPlanIndex = subscriptionPlans.findIndex(p => p.id === plan.id);
                    return thisPlanIndex > currentPlanIndex;
                  }).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      You&apos;re on the highest plan! 🎉
                    </p>
                  )}
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> When you upgrade, your old subscription will be automatically canceled
                    and replaced with the new plan. You&apos;ll only have one active subscription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Reply Settings */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 mb-8 border border-purple-100">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Auto-Reply Settings</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Enable automatic replies for Instagram comments and DMs. Automation rules will auto-reply instantly, while AI-generated replies require your approval.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Comment Auto-Reply Toggle */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Comment Auto-Replies</h3>
                </div>
                <button
                  onClick={() => toggleAutoReplySetting('comments')}
                  disabled={saving}
                  className="relative inline-flex items-center"
                >
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    autoReplySettings.auto_reply_comments_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      autoReplySettings.auto_reply_comments_enabled ? 'translate-x-6' : ''
                    }`} />
                  </div>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {autoReplySettings.auto_reply_comments_enabled
                  ? 'Auto-replies are enabled for Instagram comments. Automation rules will fire instantly.'
                  : 'Enable to automatically respond to Instagram comments based on your automation rules.'}
              </p>
              <Link
                href="/dashboard/automation-rules"
                className="text-sm text-purple-600 hover:text-purple-700 mt-3 inline-block"
              >
                Manage Automation Rules →
              </Link>
            </div>

            {/* DM Auto-Reply Toggle */}
            <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">DM Auto-Replies</h3>
                </div>
                <button
                  onClick={() => toggleAutoReplySetting('dms')}
                  disabled={saving}
                  className="relative inline-flex items-center"
                >
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    autoReplySettings.auto_reply_dms_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      autoReplySettings.auto_reply_dms_enabled ? 'translate-x-6' : ''
                    }`} />
                  </div>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {autoReplySettings.auto_reply_dms_enabled
                  ? 'Auto-replies are enabled for Instagram DMs. AI-generated replies await your approval.'
                  : 'Enable to automatically respond to Instagram direct messages.'}
              </p>
              <Link
                href="/dashboard/auto-reply-queue"
                className="text-sm text-purple-600 hover:text-purple-700 mt-3 inline-block"
              >
                View Approval Queue →
              </Link>
            </div>
          </div>

          {(autoReplySettings.auto_reply_comments_enabled || autoReplySettings.auto_reply_dms_enabled) && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Exact-match automation rules trigger instant auto-replies.
                AI-generated replies are added to the approval queue for you to review before sending.
              </p>
            </div>
          )}
        </div>

        {/* Add New Rule Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.settings.addNewRule}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.type}</label>
              <select
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as RuleType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="price">{t.settings.ruleTypes.price}</option>
                <option value="business_info">{t.settings.ruleTypes.business_info}</option>
                <option value="inventory">{t.settings.ruleTypes.inventory}</option>
                <option value="faq">{t.settings.ruleTypes.faq}</option>
                <option value="other">{t.settings.ruleTypes.other}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newRule.rule_type === 'faq' ? t.settings.question : t.settings.key}
              </label>
              <input
                type="text"
                value={newRule.rule_key}
                onChange={(e) => setNewRule({ ...newRule, rule_key: e.target.value })}
                placeholder={newRule.rule_type === 'price' ? t.settings.placeholders.priceKey : newRule.rule_type === 'faq' ? t.settings.placeholders.faqQuestion : t.settings.placeholders.genericKey}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newRule.rule_type === 'faq' ? t.settings.answer : t.settings.value}
              </label>
              <input
                type="text"
                value={newRule.rule_value}
                onChange={(e) => setNewRule({ ...newRule, rule_value: e.target.value })}
                placeholder={newRule.rule_type === 'price' ? t.settings.placeholders.priceValue : newRule.rule_type === 'faq' ? t.settings.placeholders.faqAnswer : t.settings.placeholders.genericValue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateRule}
                disabled={saving || !newRule.rule_key || !newRule.rule_value}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t.settings.addRule}
              </button>
            </div>
          </div>
        </div>

        {/* Rules by Category */}
        <div className="space-y-6">
          <RuleSection
            title={t.settings.sections.prices}
            type="price"
            rules={getRulesByType('price')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.businessInfo}
            type="business_info"
            rules={getRulesByType('business_info')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.inventory}
            type="inventory"
            rules={getRulesByType('inventory')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.faqs}
            type="faq"
            rules={getRulesByType('faq')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />

          <RuleSection
            title={t.settings.sections.other}
            type="other"
            rules={getRulesByType('other')}
            onToggle={toggleActive}
            onDelete={handleDeleteRule}
            saving={saving}
          />
        </div>

        {/* GDPR / Privacy Rights */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-blue-900">Privacy & Data Rights (GDPR)</h2>
          </div>
          <p className="text-blue-800 mb-6">
            Under GDPR, you have the right to access, export, and delete your personal data. These tools help you exercise those rights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <div className="bg-white rounded-lg p-5 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Download className="h-5 w-5 mr-2 text-blue-600" />
                Export Your Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Download all your personal data in JSON format. This includes your profile, messages, analytics, and settings.
                <strong className="block mt-2 text-blue-800">Right to Data Portability (GDPR Article 20)</strong>
              </p>
              <button
                onClick={handleExportData}
                disabled={exportingData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Download className="h-4 w-4" />
                <span>{exportingData ? 'Exporting...' : 'Export Data'}</span>
              </button>
            </div>

            {/* Privacy Policy */}
            <div className="bg-white rounded-lg p-5 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Privacy Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Review our Privacy Policy and Terms of Service to understand how we handle your data.
              </p>
              <div className="space-y-2">
                <Link
                  href="/privacy"
                  className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  → Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="block text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  → Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
          </div>
          <p className="text-red-800 mb-6">
            Careful! Actions in this section are permanent and cannot be undone.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clear Messages */}
            <div className="bg-white rounded-lg p-5 border border-red-200">
              <h3 className="font-semibold text-gray-900 mb-2">Clear All Messages</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete all DMs, comments, and pending approvals from your database.
                After clearing, when you sync messages, only <strong>new messages</strong> received after this point will appear.
                Old messages will not be re-synced.
              </p>
              <button
                onClick={handleClearMessages}
                disabled={clearing}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                <span>{clearing ? 'Clearing...' : 'Clear All Messages'}</span>
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-white rounded-lg p-5 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2">Delete Account Permanently</h3>
              <p className="text-sm text-gray-600 mb-2">
                Permanently delete your account and ALL associated data. This includes:
              </p>
              <ul className="text-xs text-gray-600 mb-4 list-disc list-inside space-y-1">
                <li>Profile and account</li>
                <li>All messages and comments</li>
                <li>All analytics and insights</li>
                <li>All automation rules</li>
              </ul>
              <p className="text-sm text-red-800 mb-4">
                <strong>Right to Erasure (GDPR Article 17)</strong>
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deletingAccount ? 'Deleting...' : 'Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleSection({
  title,
  type,
  rules,
  onToggle,
  onDelete,
  saving,
}: {
  title: string;
  type: RuleType;
  rules: BusinessRule[];
  onToggle: (rule: BusinessRule) => void;
  onDelete: (ruleId: string) => void;
  saving: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t.settings.noRules}</p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.is_active ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-900">{rule.rule_key}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.is_active ? t.common.active : t.common.inactive}
                      </span>
                    </div>
                    <p className="text-gray-700">{rule.rule_value}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onToggle(rule)}
                      disabled={saving}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      title={rule.is_active ? t.settings.deactivate : t.settings.activate}
                    >
                      <div className={`w-10 h-6 rounded-full transition ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${rule.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </button>
                    <button
                      onClick={() => onDelete(rule.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      title={t.common.delete}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
