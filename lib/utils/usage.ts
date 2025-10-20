import { supabaseAdmin } from '@/lib/supabase/server';
import { UsageStats, Profile, SubscriptionPlan } from '@/lib/types';
import { calculateUsagePercentage } from '@/lib/stripe/plans';

export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  try {
    // Get user profile with subscription plan
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        subscription_plan:subscription_plans!subscription_plan_id(*)
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Reset counter if it's a new month
    const today = new Date().toISOString().split('T')[0];
    const lastReset = profile.last_message_reset;

    if (lastReset !== today) {
      const lastResetDate = new Date(lastReset);
      const todayDate = new Date(today);

      // Check if we're in a new billing cycle (month changed)
      if (lastResetDate.getMonth() !== todayDate.getMonth() ||
          lastResetDate.getFullYear() !== todayDate.getFullYear()) {
        // Reset the counter
        await supabaseAdmin
          .from('profiles')
          .update({
            monthly_message_count: 0,
            last_message_reset: today,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        profile.monthly_message_count = 0;
        profile.last_message_reset = today;
      }
    }

    const plan = profile.subscription_plan as unknown as SubscriptionPlan;
    const currentCount = profile.monthly_message_count || 0;
    const limit = plan?.message_limit || null;
    const percentage = calculateUsagePercentage(currentCount, limit);

    // Calculate next reset date (first day of next month)
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);

    return {
      current_count: currentCount,
      limit: limit,
      percentage: percentage,
      reset_date: nextReset.toISOString().split('T')[0],
      is_over_limit: limit !== null && currentCount >= limit,
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return null;
  }
}

export async function incrementMessageCount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.rpc('increment_message_count', {
      user_id: userId,
    });

    if (error) {
      console.error('Error incrementing message count:', error);

      // Fallback: manual increment if function doesn't exist
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('monthly_message_count')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabaseAdmin
          .from('profiles')
          .update({
            monthly_message_count: (profile.monthly_message_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return false;
  }
}

export async function canAnalyzeMessage(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usageStats?: UsageStats;
}> {
  const usageStats = await getUserUsageStats(userId);

  if (!usageStats) {
    return {
      allowed: false,
      reason: 'Could not fetch usage statistics',
    };
  }

  // Check if user is over limit
  if (usageStats.is_over_limit) {
    return {
      allowed: false,
      reason: 'Monthly message limit reached. Please upgrade your plan.',
      usageStats,
    };
  }

  // Check if user's subscription is active
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', userId)
    .single();

  if (profile) {
    // Check trial status
    if (profile.trial_ends_at) {
      const trialExpired = new Date(profile.trial_ends_at) < new Date();
      if (trialExpired && profile.subscription_status !== 'active') {
        return {
          allowed: false,
          reason: 'Free trial expired. Please subscribe to continue.',
          usageStats,
        };
      }
    }

    // Check subscription status
    if (profile.subscription_status === 'past_due') {
      return {
        allowed: false,
        reason: 'Payment failed. Please update your payment method.',
        usageStats,
      };
    }

    if (profile.subscription_status === 'canceled' &&
        !profile.trial_ends_at) {
      return {
        allowed: false,
        reason: 'Subscription canceled. Please resubscribe to continue.',
        usageStats,
      };
    }
  }

  return {
    allowed: true,
    usageStats,
  };
}
