import getStripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== ESCROW PAYMENT API ROUTE CALLED ===');
  
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const stripe = getStripe();
    console.log('Escrow payment API route called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { propertyId, amount, email, tenantId } = body;
    
    if (!propertyId || !amount || !email || !tenantId) {
      console.log('Missing fields:', { propertyId, amount, email, tenantId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get property details to find landlord
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('landlord_id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property:', propertyError);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const landlordId = property.landlord_id;
    if (!landlordId) {
      return NextResponse.json(
        { error: 'Property has no landlord assigned' },
        { status: 400 }
      );
    }

    // For testing, use a higher amount to meet Stripe's minimum requirement
    const testAmount = Math.max(Number(amount), 5000); // Minimum 5000 NGN for testing
    
    console.log('Creating payment intent for escrow:', { 
      propertyId, 
      amount: testAmount, 
      email, 
      tenantId,
      landlordId 
    });

    // Create payment intent for escrow
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(testAmount * 100), // amount in kobo
      currency: 'ngn',
      metadata: {
        propertyId,
        originalAmount: amount,
        testAmount: testAmount,
        customerEmail: email,
        tenantId: tenantId,
        landlordId: landlordId,
        type: 'escrow_payment'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created for escrow:', paymentIntent.id);
    
    // Create transaction record in database
    const { data: transaction, error: transactionError } = await supabase
      .rpc('create_transaction', {
        p_user_id: tenantId,
        p_type: 'deposit',
        p_amount: testAmount,
        p_description: `Escrow payment for property #${propertyId}`,
        p_stripe_payment_intent_id: paymentIntent.id,
        p_property_id: propertyId
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      // Don't fail the payment, just log the error
    }

    // Create escrow transaction record
    const { data: escrow, error: escrowError } = await supabase
      .rpc('create_escrow_transaction', {
        p_property_id: propertyId,
        p_tenant_id: tenantId,
        p_landlord_id: landlordId,
        p_amount: testAmount,
        p_stripe_payment_intent_id: paymentIntent.id,
        p_transaction_id: transaction
      });

    if (escrowError) {
      console.error('Error creating escrow record:', escrowError);
      // Don't fail the payment, just log the error
    }

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount: testAmount,
      transactionId: transaction,
      escrowId: escrow
    });
  } catch (error) {
    console.error('=== ESCROW PAYMENT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create escrow payment' },
      { status: 500 }
    );
  }
}