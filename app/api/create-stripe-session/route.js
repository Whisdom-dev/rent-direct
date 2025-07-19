import getStripe from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== API ROUTE CALLED ===');
  
  try {
    const stripe = getStripe();
    console.log('API route called');
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
    // In production, you'd want to validate against actual rent amounts
    const testAmount = Math.max(Number(amount), 5000); // Minimum 5000 NGN for testing
    
    console.log('Creating Stripe session with:', { propertyId, amount: testAmount, email });
    console.log('Stripe secret key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Stripe secret key length:', process.env.STRIPE_SECRET_KEY?.length);

    // Ensure URLs have proper scheme
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const cancelUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

    console.log('Using URLs:', { successUrl, cancelUrl });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'ngn',
            product_data: {
              name: `Rent Payment for Property #${propertyId}`,
            },
            unit_amount: Math.round(testAmount * 100), // amount in kobo
          },
          quantity: 1,
        },
      ],
      metadata: {
        propertyId,
        originalAmount: amount,
        testAmount: testAmount,
      },
      success_url: `${successUrl}/dashboard?payment=success`,
      cancel_url: `${cancelUrl}/dashboard?payment=cancel`,
    });

    console.log('Stripe session created:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('=== STRIPE ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe session' },
      { status: 500 }
    );
  }
} 