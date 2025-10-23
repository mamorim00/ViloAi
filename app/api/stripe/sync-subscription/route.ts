import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

// Manual endpoint to sync subscription from Stripe
// Useful when webhooks aren't working in development
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer ID' }, { status: 400 });
    }

    console.log('🔍 Syncing subscription for customer:', profile.stripe_customer_id);

    // Get customer's subscriptions from Stripe
    // Note: Get ALL active subscriptions and pick the most recent one
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 10, // Get up to 10 to handle multiple subscriptions
    });

    if (subscriptions.data.length === 0) {
      console.log('❌ No active subscriptions found');
      return NextResponse.json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // If multiple subscriptions exist, pick the most recent one
    const subscription = subscriptions.data.sort((a, b) => b.created - a.created)[0];

    if (subscriptions.data.length > 1) {
      console.warn(`⚠️ Multiple active subscriptions found (${subscriptions.data.length}). Using most recent: ${subscription.id}`);
      console.warn('💡 Consider canceling old subscriptions in Stripe Dashboard');
    }
    const priceId = subscription.items.data[0].price.id;

    console.log('💳 Found subscription:', {
      id: subscription.id,
      status: subscription.status,
      priceId: priceId,
    });

    // Find the plan by Stripe price ID
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found for price ID:', priceId);

      // Debug: Show all available plans and their price IDs
      const { data: allPlans } = await supabaseAdmin
        .from('subscription_plans')
        .select('name, stripe_price_id, price_monthly');

      console.error('📋 Available plans in database:', allPlans);
      console.error('🔍 Looking for price_id:', priceId);

      return NextResponse.json({
        success: false,
        message: 'Plan not found for this subscription',
        debug: {
          stripePriceId: priceId,
          availablePlans: allPlans,
          hint: 'Update subscription_plans table with correct Stripe Price IDs (see UPDATE_STRIPE_PRICE_IDS.sql)'
        }
      }, { status: 404 });
    }

    console.log('📦 Found plan:', { id: plan.id, name: plan.name });

    // Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_plan_id: plan.id,
        subscription_status: subscription.status,
        subscription_tier: plan.name,
        trial_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to update profile'
      }, { status: 500 });
    }

    console.log('✅ Subscription synced successfully');

    return NextResponse.json({
      success: true,
      subscription: {
        plan: plan.name,
        status: subscription.status,
        priceId: priceId,
      },
    });
  } catch (error) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
