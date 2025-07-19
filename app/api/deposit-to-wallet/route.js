import getStripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== DEPOSIT TO WALLET API ROUTE CALLED ===');
  
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const stripe = getStripe();
    console.log('Deposit to wallet API route called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { propertyId, amount, email, userId } = body;
    
    if (!propertyId || !amount || !email || !userId) {
      console.log('Missing fields:', { propertyId, amount, email, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For testing, use a higher amount to meet Stripe's minimum requirement
    const testAmount = Math.max(Number(amount), 5000); // Minimum 5000 NGN for testing
    
    console.log('Creating payment intent for wallet deposit:', { propertyId, amount: testAmount, email, userId });
    console.log('Stripe secret key exists:', !!process.env.STRIPE_SECRET_KEY);

    // Create payment intent for deposit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(testAmount * 100), // amount in kobo
      currency: 'ngn',
      metadata: {
        propertyId,
        originalAmount: amount,
        testAmount: testAmount,
        customerEmail: email,
        userId: userId,
        type: 'wallet_deposit'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created for wallet deposit:', paymentIntent.id);
    
    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .rpc('create_transaction', {
        p_user_id: userId,
        p_type: 'deposit',
        p_amount: testAmount,
        p_description: `Rent payment deposit for property #${propertyId}`,
        p_stripe_payment_intent_id: paymentIntent.id,
        p_property_id: propertyId
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the payment, just log the error
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: testAmount,
      transactionId: transaction
    });
  } catch (error) {
    console.error('=== DEPOSIT TO WALLET ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create deposit payment' },
      { status: 500 }
    );
  }
} 