'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { UsageStats } from '@/lib/types';

export default function SubscriptionWidget({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [userId]);

  const loadUsage = async () => {
    try {
      const response = await fetch('/api/subscriptions/usage', {
        credentials: 'include', // Important: include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      } else {
        const errorData = await response.json();
        console.error('Error loading usage:', errorData);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const percentage = usage.percentage;
  const isNearLimit = percentage >= 80 && usage.limit !== null;
  const isOverLimit = usage.is_over_limit;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-semibold text-gray-900">{t.subscription.usage}</h3>
        </div>
        <Link
          href="/dashboard/subscription"
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          {t.common.settings}
        </Link>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">
            {usage.current_count} {usage.limit !== null ? `${t.subscription.usageOf} ${usage.limit}` : ''}
          </span>
          <span className="font-medium text-gray-900">
            {usage.limit === null ? t.subscription.unlimited : `${percentage}%`}
          </span>
        </div>
        {usage.limit !== null && (
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                isOverLimit
                  ? 'bg-red-600'
                  : isNearLimit
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Warnings/Alerts */}
      {isOverLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">{t.subscription.limitReached}</p>
            <Link
              href="/pricing"
              className="text-sm text-red-600 hover:text-red-700 underline mt-1 inline-block"
            >
              {t.subscription.upgradeNow}
            </Link>
          </div>
        </div>
      )}

      {isNearLimit && !isOverLimit && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start">
          <TrendingUp className="h-5 w-5 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-800">{t.subscription.limitWarning}</p>
            <Link
              href="/pricing"
              className="text-sm text-orange-600 hover:text-orange-700 underline mt-1 inline-block"
            >
              {t.pricing.upgrade}
            </Link>
          </div>
        </div>
      )}

      {/* Reset Date */}
      <div className="text-xs text-gray-500 mt-2">
        {t.subscription.resetDate}: {new Date(usage.reset_date).toLocaleDateString()}
      </div>
    </div>
  );
}
