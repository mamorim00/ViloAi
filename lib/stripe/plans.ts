import { SubscriptionPlan, SubscriptionPlanName } from '@/lib/types';

// Plan definitions for reference (actual data stored in database)
export const PLAN_FEATURES = {
  free: {
    messageLimit: 50,
    features: [
      '14-day free trial',
      'AI message analysis',
      'Basic reply suggestions',
      'Email support',
    ],
  },
  basic: {
    messageLimit: 500,
    features: [
      '500 messages/month',
      'AI message analysis',
      'Bilingual reply suggestions',
      'Business rules',
      'Basic analytics',
      'Email support',
    ],
  },
  premium: {
    messageLimit: 2000,
    features: [
      '2000 messages/month',
      'AI message analysis',
      'Bilingual reply suggestions',
      'Business rules',
      'Advanced analytics',
      'Follower insights',
      'Priority support',
    ],
  },
  enterprise: {
    messageLimit: null, // Unlimited
    features: [
      'Unlimited messages',
      'AI message analysis',
      'Bilingual reply suggestions',
      'Business rules',
      'Advanced analytics',
      'Follower insights',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
  },
};

export function isTrialExpired(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return true;
  return new Date(trialEndsAt) < new Date();
}

export function canAccessFeature(
  plan: SubscriptionPlanName,
  feature: string
): boolean {
  const features = PLAN_FEATURES[plan]?.features || [];
  return features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

export function getMessageLimit(plan: SubscriptionPlanName): number | null {
  return PLAN_FEATURES[plan]?.messageLimit || null;
}

export function calculateUsagePercentage(current: number, limit: number | null): number {
  if (limit === null) return 0; // Unlimited
  if (limit === 0) return 100;
  return Math.min(Math.round((current / limit) * 100), 100);
}
