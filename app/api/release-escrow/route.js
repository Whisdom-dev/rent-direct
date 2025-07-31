import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('=== RELEASE ESCROW API ROUTE CALLED ===');
  
  // Create Supabase client inside the function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { escrowId, userId, notes } = body;
    
    if (!escrowId || !userId) {
      console.log('Missing fields:', { escrowId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify that the user is the tenant for this escrow
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .eq('tenant_id', userId)
      .eq('status', 'pending')
      .single();

    if (escrowError || !escrow) {
      console.error('Error fetching escrow or unauthorized:', escrowError);
      return NextResponse.json(
        { error: 'Escrow not found or you are not authorized to release it' },
        { status: 403 }
      );
    }

    // Release the escrow funds to the landlord
    const { data: result, error: releaseError } = await supabase
      .rpc('complete_escrow_transaction', {
        p_escrow_id: escrowId,
        p_notes: notes || 'Released by tenant'
      });

    if (releaseError) {
      console.error('Error releasing escrow:', releaseError);
      return NextResponse.json(
        { error: 'Failed to release escrow funds' },
        { status: 500 }
      );
    }

    // Create notification for landlord
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: escrow.landlord_id,
        type: 'payment_received',
        title: 'Payment Received',
        message: `You have received ₦${escrow.landlord_amount.toLocaleString()} for your property.`,
        data: { 
          propertyId: escrow.property_id,
          amount: escrow.landlord_amount,
          escrowId: escrow.id
        },
        read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the operation, just log the error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Escrow funds released successfully'
    });
  } catch (error) {
    console.error('=== RELEASE ESCROW ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to release escrow funds' },
      { status: 500 }
    );
  }
}