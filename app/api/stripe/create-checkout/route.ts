import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createCustomer } from '@/lib/stripe/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, planId } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan || !plan.stripe_price_id) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await createCustomer(profile.email, userId);
      customerId = customer.id;

      // Update profile with customer ID
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Check for existing active subscriptions
    console.log('🔍 Checking for existing active subscriptions...');
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 100,
    });

    // If user has an active subscription, upgrade/downgrade it instead of creating new one
    if (existingSubscriptions.data.length > 0) {
      const currentSubscription = existingSubscriptions.data[0];
      const currentPriceId = currentSubscription.items.data[0].price.id;

      // Check if trying to change to a different plan
      if (currentPriceId !== plan.stripe_price_id) {
        console.log(`🔄 Upgrading/downgrading subscription from ${currentPriceId} to ${plan.stripe_price_id}`);

        // Update the existing subscription to the new price
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.id, {
          items: [{
            id: currentSubscription.items.data[0].id,
            price: plan.stripe_price_id,
          }],
          proration_behavior: 'always_invoice', // Charge/credit immediately for the change
        });

        console.log(`✅ Subscription updated: ${updatedSubscription.id}`);

        // Redirect to dashboard with success message
        return NextResponse.json({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=updated`,
          subscriptionId: updatedSubscription.id
        });
      } else {
        console.log('ℹ️ User already has this plan');
        return NextResponse.json({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=already-active`,
        });
      }
    }

    // No existing subscription - create new checkout session for first-time subscription
    console.log('✅ No active subscriptions found, creating checkout session');
    const session = await createCheckoutSession(
      customerId,
      plan.stripe_price_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscription=cancelled`,
      userId
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
