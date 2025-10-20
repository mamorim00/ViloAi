'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Profile, SubscriptionPlan, UsageStats } from '@/lib/types';
import { ArrowLeft, CreditCard, Calendar, TrendingUp, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function SubscriptionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select(`
        *,
        subscription_plan:subscription_plans!subscription_plan_id(*)
      `)
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setCurrentPlan(profileData.subscription_plan as unknown as SubscriptionPlan);
    }

    // Load usage
    try {
      const response = await fetch('/api/subscriptions/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    }

    setLoading(false);
  };

  const handleManageBilling = async () => {
    if (!profile) return;

    setManagingBilling(true);
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
    } finally {
      setManagingBilling(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {t.settings.backToDashboard}
          </Link>
          <LanguageToggle />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.subscription.title}</h1>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">{t.subscription.currentPlan}</h2>
          </div>

          {currentPlan && (
            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {language === 'fi' ? currentPlan.display_name_fi : currentPlan.display_name_en}
              </h3>
              <p className="text-3xl font-bold text-purple-600 mb-2">
                €{currentPlan.price_monthly}
                <span className="text-base text-gray-600 font-normal">
                  {t.pricing.perMonth}
                </span>
              </p>
              <p className="text-gray-600">
                {currentPlan.message_limit === null
                  ? t.pricing.unlimitedMessages
                  : `${currentPlan.message_limit} ${t.pricing.messagesPerMonth}`}
              </p>
            </div>
          )}

          {profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date() && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <Calendar className="h-4 w-4 inline mr-2" />
                {t.subscription.trialEnds}: {new Date(profile.trial_ends_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        {usage && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">{t.subscription.usage}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{t.pricing.messagesPerMonth}</span>
                  <span className="font-medium text-gray-900">
                    {usage.current_count}
                    {usage.limit !== null && ` ${t.subscription.usageOf} ${usage.limit}`}
                    {usage.limit === null && ` (${t.subscription.unlimited})`}
                  </span>
                </div>
                {usage.limit !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        usage.percentage >= 100
                          ? 'bg-red-600'
                          : usage.percentage >= 80
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {t.subscription.resetDate}: {new Date(usage.reset_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 text-center"
            >
              {t.subscription.upgradeNow}
            </Link>

            {profile?.stripe_customer_id && (
              <button
                onClick={handleManageBilling}
                disabled={managingBilling}
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {managingBilling ? t.common.loading : t.subscription.manageBilling}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
