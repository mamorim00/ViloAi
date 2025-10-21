import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, createCustomer } from '@/lib/stripe/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      plan.stripe_price_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
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
