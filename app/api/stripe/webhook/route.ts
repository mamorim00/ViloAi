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

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Find the plan by Stripe price ID
  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (!plan) {
    console.error('Plan not found for price ID:', priceId);
    return;
  }

  // Update user profile
  const { error } = await supabaseAdmin
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

  if (error) {
    console.error('Error updating profile after checkout:', error);
  } else {
    console.log('✅ Subscription activated for customer:', customerId);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0].price.id;

  // Find the plan by Stripe price ID
  const { data: plan } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (!plan) {
    console.error('Plan not found for price ID:', priceId);
    return;
  }

  // Update user profile with new subscription status
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_plan_id: plan.id,
      subscription_status: subscription.status,
      subscription_tier: plan.name,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('✅ Subscription updated for customer:', customerId);
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
