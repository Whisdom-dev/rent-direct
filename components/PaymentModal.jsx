'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Debug: Check if publishable key is loaded
console.log('Stripe publishable key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Loaded' : 'Missing');
console.log('Stripe publishable key value:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...');

const PaymentForm = ({ propertyId, amount, email, userId, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  // Debug: Check Stripe initialization
  useEffect(() => {
    console.log('Stripe initialization status:', { 
      stripe: !!stripe, 
      elements: !!elements,
      clientSecret: !!clientSecret 
    });
  }, [stripe, elements, clientSecret]);

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        console.log('Creating escrow payment for:', { propertyId, amount, email, userId });
        
        const response = await fetch('/api/escrow-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            amount,
            email,
            tenantId: userId, // Renamed to match the escrow system
          }),
        });

        console.log('Escrow payment response status:', response.status);
        const data = await response.json();
        console.log('Escrow payment response data:', data);
        
        if (!response.ok) {
          throw new Error(data.error || `Failed to create escrow payment (${response.status})`);
        }

        if (!data.clientSecret) {
          throw new Error('No client secret received from server');
        }

        setClientSecret(data.clientSecret);
        console.log('Client secret set successfully');
      } catch (error) {
        console.error('Wallet deposit error:', error);
        toast({
          title: 'Payment Error',
          description: error.message || 'Failed to initialize wallet deposit',
          variant: 'destructive',
        });
        onClose();
      }
    };

    createPaymentIntent();
  }, [propertyId, amount, email, userId, toast, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.error('Missing required data:', { stripe: !!stripe, elements: !!elements, clientSecret: !!clientSecret });
      toast({
        title: 'Payment Error',
        description: 'Payment system not ready. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            email: email,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        console.error('Error details:', {
          type: error.type,
          code: error.code,
          message: error.message,
          decline_code: error.decline_code
        });
        
        let errorMessage = error.message || 'Payment failed. Please try again.';
        
        // Provide more specific error messages for common card issues
        if (error.code === 'card_declined') {
          errorMessage = `Card declined: ${error.decline_code || 'Unknown reason'}. Please try a different card.`;
        } else if (error.code === 'expired_card') {
          errorMessage = 'Card has expired. Please use a different card.';
        } else if (error.code === 'incorrect_cvc') {
          errorMessage = 'Incorrect CVC. Please check your card details.';
        } else if (error.code === 'processing_error') {
          errorMessage = 'Processing error. Please try again.';
        }
        
        toast({
          title: 'Payment Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful!',
          description: 'Your payment is now in escrow. The funds will be released to the landlord once you confirm you have received access to the property.',
        });
        onSuccess(paymentIntent);
        onClose();
      } else {
        console.error('Unexpected payment result:', paymentIntent);
        toast({
          title: 'Payment Error',
          description: 'Payment status unclear. Please check your payment method.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      toast({
        title: 'Payment Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Details</label>
        <div className="border rounded-md p-3">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Amount: ₦{amount?.toLocaleString()}</p>
        <p>Property ID: {propertyId}</p>
      </div>
      
      <div className="text-sm bg-blue-50 p-3 rounded-md border border-blue-100">
        <p className="font-medium text-blue-700">Secure Escrow Payment</p>
        <p className="text-blue-600 mt-1">Your payment will be held in escrow until you confirm you've received access to the property. This protects both you and the landlord.</p>
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
        <p className="font-medium mb-1">Test Card Details:</p>
        <p>Card: 4242 4242 4242 4242</p>
        <p>Expiry: Any future date (e.g., 12/25)</p>
        <p>CVC: Any 3 digits (e.g., 123)</p>
        <p className="mt-2 text-blue-600">💡 This will add money to your wallet balance!</p>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || !clientSecret} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay ₦${amount?.toLocaleString()}`
        )}
      </Button>
    </form>
  );
};

const PaymentModal = ({ propertyId, amount, email, userId, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    // Here you can add logic to save payment to your database
    // or redirect to a success page
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Rent via Escrow</DialogTitle>
          <DialogDescription>
            Enter your card details to complete the rent payment. Your payment will be held in escrow until you confirm you've received access to the property.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardContent className="pt-6">
            <Elements stripe={stripePromise}>
              <PaymentForm
                propertyId={propertyId}
                amount={amount}
                email={email}
                userId={userId}
                onSuccess={handleSuccess}
                onClose={handleClose}
              />
            </Elements>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal; 