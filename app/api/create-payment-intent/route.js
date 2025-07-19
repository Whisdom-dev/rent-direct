import getStripe from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== PAYMENT INTENT API ROUTE CALLED ===');
  
  try {
    const stripe = getStripe();
    console.log('Payment intent API route called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { propertyId, amount, email } = body;
    
    if (!propertyId || !amount || !email) {
      console.log('Missing fields:', { propertyId, amount, email });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For testing, use a higher amount to meet Stripe's minimum requirement
    const testAmount = Math.max(Number(amount), 5000); // Minimum 5000 NGN for testing
    
    console.log('Creating payment intent with:', { propertyId, amount: testAmount, email });
    console.log('Stripe secret key exists:', !!process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(testAmount * 100), // amount in kobo
      currency: 'ngn',
      metadata: {
        propertyId,
        originalAmount: amount,
        testAmount: testAmount,
        customerEmail: email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);
    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: testAmount,
    });
  } catch (error) {
    console.error('=== PAYMENT INTENT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
} 