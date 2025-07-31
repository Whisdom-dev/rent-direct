'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Button component that allows tenants to release funds from escrow
 * after confirming they've received access to the property
 */
export default function EscrowReleaseButton({ escrowId, userId, propertyTitle, amount, onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();

  const handleRelease = async () => {
    if (!escrowId || !userId) {
      toast({
        title: 'Error',
        description: 'Missing required information to release funds',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/release-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId,
          userId,
          notes: 'Tenant confirmed property access',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release escrow funds');
      }

      setIsConfirmed(true);
      
      toast({
        title: 'Funds Released',
        description: 'The payment has been successfully released to the landlord.',
      });

      // Call the success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }

      // Close dialog after a delay to show confirmation
      setTimeout(() => {
        setIsOpen(false);
        setIsConfirmed(false);
      }, 2000);
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to release funds. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Release Payment to Landlord
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Property Access</DialogTitle>
          <DialogDescription>
            By releasing the payment, you confirm that you have received access to the property.
          </DialogDescription>
        </DialogHeader>

        {isConfirmed ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-center font-medium">Payment Successfully Released!</p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <div className="rounded-md bg-amber-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Important</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        Only release payment after you have:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Received keys or access codes to the property</li>
                        <li>Verified the property matches the listing</li>
                        <li>Confirmed all agreed terms have been met</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Property: {propertyTitle}</p>
                <p className="text-sm font-medium">Amount: ₦{amount?.toLocaleString()}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRelease} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Release Payment'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}