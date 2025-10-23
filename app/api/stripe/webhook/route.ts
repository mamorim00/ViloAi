import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/server';
import stripe from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`🎯 Received Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout completed:', session.id);
  console.log('📋 Session details:', {
    customer: session.customer,
    subscription: session.subscription,
    userId: session.metadata?.userId,
    mode: session.mode,
    payment_status: session.payment_status,
  });

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  let userId = session.metadata?.userId;

  if (!subscriptionId) {
    console.error('❌ No subscription ID in checkout session');
    return;
  }

  // If userId not in session metadata, try to get it from customer metadata
  if (!userId) {
    console.log('🔍 No userId in session metadata, checking customer metadata...');
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && customer.metadata?.userId) {
      userId = customer.metadata.userId;
      console.log('✅ Found userId in customer metadata:', userId);
    }
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  console.log('💳 Subscription details:', {
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
    console.error('❌ Plan not found for price ID:', priceId, planError);

    // Debug: Show all available plans and their price IDs
    const { data: allPlans } = await supabaseAdmin
      .from('subscription_plans')
      .select('name, stripe_price_id, price_monthly');

    console.error('📋 Available plans in database:', allPlans);
    console.error('🔍 Looking for price_id:', priceId);
    console.error('⚠️ ACTION REQUIRED: Update subscription_plans table with correct Stripe Price IDs');
    console.error('💡 See UPDATE_STRIPE_PRICE_IDS.sql for instructions');
    return;
  }

  console.log('📦 Found plan:', { id: plan.id, name: plan.name });

  // Update user profile - try by userId first (from metadata), then by customer ID
  let error;
  let updateResult;

  if (userId) {
    console.log('🔄 Updating profile by userId:', userId);
    updateResult = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        subscription_plan_id: plan.id,
        subscription_status: subscription.status,
        subscription_tier: plan.name,
        trial_ends_at: null, // Clear trial when subscription starts
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    error = updateResult.error;
  } else {
    console.log('🔄 Updating profile by customer ID:', customerId);
    updateResult = await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        subscription_plan_id: plan.id,
        subscription_status: subscription.status,
        subscription_tier: plan.name,
        trial_ends_at: null, // Clear trial when subscription starts
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId);
    error = updateResult.error;
  }

  if (error) {
    console.error('❌ Error updating profile after checkout:', error);
  } else {
    console.log('✅ Subscription activated for user:', userId || customerId);
    console.log('📊 Rows updated:', updateResult.count);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  console.log('📊 Update details:', {
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0].price.id;

  // Find the plan by Stripe price ID
  const { data: plan, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (planError || !plan) {
    console.error('❌ Plan not found for price ID:', priceId, planError);

    // Debug: Show all available plans and their price IDs
    const { data: allPlans } = await supabaseAdmin
      .from('subscription_plans')
      .select('name, stripe_price_id, price_monthly');

    console.error('📋 Available plans in database:', allPlans);
    console.error('🔍 Looking for price_id:', priceId);
    return;
  }

  console.log('📦 Found plan:', { id: plan.id, name: plan.name });

  // Update user profile with new subscription details
  const updateData: any = {
    subscription_plan_id: plan.id,
    subscription_status: subscription.status,
    subscription_tier: plan.name,
    updated_at: new Date().toISOString(),
  };

  // If subscription is active, ensure message count is tracked
  if (subscription.status === 'active') {
    // Don't reset message count here - only on successful payment
    console.log('✅ Subscription is active, maintaining current message count');
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('❌ Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated for customer:', customerId, 'to plan:', plan.name);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  const customerId = subscription.customer as string;

  // Get the free plan
  const { data: freePlan } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('name', 'free')
    .single();

  if (!freePlan) {
    console.error('Free plan not found');
    return;
  }

  // Downgrade to free plan
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_plan_id: freePlan.id,
      subscription_status: 'canceled',
      subscription_tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error downgrading to free plan:', error);
  } else {
    console.log('✅ User downgraded to free plan:', customerId);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Payment succeeded:', invoice.id);

  const customerId = invoice.customer as string;

  // Reset monthly message count on successful payment
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'active',
      monthly_message_count: 0,
      last_message_reset: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error resetting message count:', error);
  } else {
    console.log('✅ Message count reset for customer:', customerId);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️ Payment failed:', invoice.id);

  const customerId = invoice.customer as string;

  // Mark subscription as past_due
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating payment failed status:', error);
  } else {
    console.log('⚠️ Account marked as past_due:', customerId);
  }
}
