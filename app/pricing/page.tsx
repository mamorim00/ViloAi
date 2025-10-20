'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Instagram, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { SubscriptionPlan } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { PLAN_FEATURES } from '@/lib/stripe/plans';

export default function PricingPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creatingCheckout, setCreatingCheckout] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!currentUser) {
      router.push('/signup');
      return;
    }

    if (plan.name === 'free') {
      router.push('/dashboard');
      return;
    }

    setCreatingCheckout(plan.id);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          planId: plan.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setCreatingCheckout(null);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Instagram className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">ViloAi</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              {currentUser ? (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-purple-600 px-4 py-2"
                >
                  {t.dashboard.title}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-purple-600 px-4 py-2">
                    {t.auth.login.button}
                  </Link>
                  <Link href="/signup" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                    {t.auth.signup.button}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.pricing.title}</h2>
          <p className="text-xl text-gray-600">{t.pricing.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              language={language}
              onSelect={handleSelectPlan}
              isLoading={creatingCheckout === plan.id}
            />
          ))}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 ViloAi. Built for Finnish small businesses.</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  plan,
  language,
  onSelect,
  isLoading,
}: {
  plan: SubscriptionPlan;
  language: 'en' | 'fi';
  onSelect: (plan: SubscriptionPlan) => void;
  isLoading: boolean;
}) {
  const { t } = useLanguage();
  const features = PLAN_FEATURES[plan.name as keyof typeof PLAN_FEATURES]?.features || [];
  const isPopular = plan.name === 'premium';

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 relative ${
        isPopular ? 'ring-2 ring-purple-600 transform scale-105' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
          POPULAR
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'fi' ? plan.display_name_fi : plan.display_name_en}
        </h3>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">€{plan.price_monthly}</span>
          <span className="text-gray-600 ml-2">{t.pricing.perMonth}</span>
        </div>
        <p className="text-gray-600 mt-2">
          {plan.message_limit === null
            ? t.pricing.unlimitedMessages
            : `${plan.message_limit} ${t.pricing.messagesPerMonth}`}
        </p>
        {plan.name === 'free' && (
          <p className="text-purple-600 font-semibold mt-1">{t.pricing.trialDays}</p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan)}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
          isPopular
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? t.common.loading : t.pricing.selectPlan}
      </button>
    </div>
  );
}
