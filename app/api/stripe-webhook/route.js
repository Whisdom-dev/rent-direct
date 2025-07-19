import getStripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  console.log('=== STRIPE WEBHOOK CALLED ===');
  
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const stripe = getStripe();
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('Webhook event type:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  try {
    const { propertyId, userId, type, testAmount } = paymentIntent.metadata;
    
    if (type === 'wallet_deposit' && userId) {
      // Update user balance
      const { data: newBalance, error: balanceError } = await supabase
        .rpc('update_user_balance', {
          p_user_id: userId,
          p_amount: parseFloat(testAmount || paymentIntent.amount / 100),
          p_transaction_type: 'deposit'
        });

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      if (transactionError) {
        console.error('Error updating transaction status:', transactionError);
      }

      console.log('User balance updated successfully:', { userId, newBalance });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  try {
    // Update transaction status to failed
    const { error: transactionError } = await supabase
      .from('transactions')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (transactionError) {
      console.error('Error updating transaction status:', transactionError);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
} 