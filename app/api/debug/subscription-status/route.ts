import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Debug endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'Profile not found',
        details: profileError
      }, { status: 404 });
    }

    // Get subscription plan details
    let planDetails = null;
    if (profile.subscription_plan_id) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', profile.subscription_plan_id)
        .single();
      planDetails = plan;
    }

    // Get all available plans
    const { data: allPlans } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, name, display_name_en, price_monthly, stripe_price_id');

    // If they have a Stripe customer ID, get their subscriptions
    let stripeSubscriptions = null;
    if (profile.stripe_customer_id) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!);
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 5,
        });

        stripeSubscriptions = subs.data.map((sub: any) => ({
          id: sub.id,
          status: sub.status,
          price_id: sub.items.data[0]?.price.id,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }));
      } catch (error: any) {
        stripeSubscriptions = { error: error.message };
      }
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        subscription_plan_id: profile.subscription_plan_id,
        subscription_status: profile.subscription_status,
        subscription_tier: profile.subscription_tier,
        stripe_customer_id: profile.stripe_customer_id,
        trial_ends_at: profile.trial_ends_at,
      },
      currentPlan: planDetails,
      allPlans: allPlans,
      stripeSubscriptions: stripeSubscriptions,
      diagnosis: {
        hasStripeCustomerId: !!profile.stripe_customer_id,
        hasPlanId: !!profile.subscription_plan_id,
        subscriptionStatus: profile.subscription_status || 'not set',
        tier: profile.subscription_tier || 'not set',
        expectedBehavior: profile.subscription_plan_id && profile.subscription_status === 'active'
          ? '✅ Should show subscription in UI'
          : '❌ Missing subscription data',
      }
    });
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      error: 'Internal error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
