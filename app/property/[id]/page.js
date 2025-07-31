"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, DollarSign, User, Calendar, ShieldCheck, MessageSquare, Star, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import LeaveReviewForm from '@/components/LeaveReviewForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notify } from "@/lib/notifications"
import PaymentModal from '@/components/PaymentModal';
import PropertyImageCarousel from '@/components/PropertyImageCarousel'
import { PropertyDetailSkeleton } from '@/components/ui/skeletons'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [paying, setPaying] = useState(false);

  const fetchPropertyAndReviews = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError || !propertyData) {
        throw propertyError || new Error('Property not found');
      }
      setProperty(propertyData);

      if (propertyData.landlord_id) {
        // Fetch owner details including new review fields
        const { data: ownerData, error: ownerError } = await supabase
          .from('public_user_profiles')
          .select('id, name, avatar_url, average_rating, review_count')
          .eq('id', propertyData.landlord_id)
          .single();
        if (ownerError) throw ownerError;
        setOwner(ownerData);

        // Fetch reviews for the owner
        const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select(`
                id,
                rating,
                comment,
                created_at,
                reviewer:users!reviews_reviewer_id_fkey (id, name, avatar_url)
            `)
            .eq('reviewee_id', propertyData.landlord_id)
            .order('created_at', { ascending: false });

        if(reviewsError) throw reviewsError;
        setReviews(reviewsData || []);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    fetchCurrentUser();
    fetchPropertyAndReviews();
  }, [id, fetchPropertyAndReviews]);

  const handleContactOwner = async () => {
    if (!currentUser) {
        router.push(`/auth?redirect=/property/${id}`);
        return;
    }
    if(currentUser.id === property.landlord_id) {
        notify.warning("Action Not Allowed", "You cannot start a conversation with yourself.");
        return;
    }

    if (!property.landlord_id) {
        console.error("This property does not have an owner associated with it.");
        notify.error("Error", "Cannot start a conversation: This property has no owner.");
        return;
    }

    try {
        console.log("Attempting to start conversation with IDs:", {
            propertyId: property.id,
            currentUserId: currentUser.id,
            ownerId: property.landlord_id
        });
        // More robustly check for an existing conversation in either direction.
        const { data: conversation1, error: error1 } = await supabase
            .from('conversations')
            .select('id')
            .match({ 
                property_id: property.id, 
                user1_id: currentUser.id, 
                user2_id: property.landlord_id 
            })
            .maybeSingle();

        if (error1) {
            console.error("Error checking conversation (1/2):", error1);
            throw error1;
        }
        if (conversation1) {
            return router.push(`/dashboard/messages/${conversation1.id}`);
        }

        const { data: conversation2, error: error2 } = await supabase
            .from('conversations')
            .select('id')
            .match({
                property_id: property.id,
                user1_id: property.landlord_id,
                user2_id: currentUser.id
            })
            .maybeSingle();
        
        if (error2) {
            console.error("Error checking conversation (2/2):", error2);
            throw error2;
        }
        if (conversation2) {
            return router.push(`/dashboard/messages/${conversation2.id}`);
        }

        // If no conversation exists, create a new one
        const { data: newConversation, error: newConvoError } = await supabase
            .from('conversations')
            .insert({
                property_id: property.id,
                user1_id: currentUser.id, // Renter
                user2_id: property.landlord_id, // Owner
            })
            .select()
            .single();

        if (newConvoError) {
            console.error("Error creating new conversation:", newConvoError);
            throw newConvoError;
        }
        
        router.push(`/dashboard/messages/${newConversation.id}`);

    } catch (error) {
        console.error('Error handling contact owner. The raw error object is:', error);
        if (error.message) {
            console.error('Error message:', error.message);
        }
        if (error.details) {
            console.error('Error details:', error.details);
        }
        if (error.hint) {
            console.error('Error hint:', error.hint);
        }
        notify.error('Error', 'There was an error starting the conversation. Please try again.');
    }
  };

  const handlePayRent = async () => {
    // This function is no longer needed as PaymentModal handles everything
    console.log('Payment modal will handle the payment flow');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Property not found</h2>
        <p className="text-gray-600">The property you are looking for does not exist or has been removed.</p>
        <Link href="/properties">
          <Button className="mt-6">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  // Custom error fallback for property detail page
  const PropertyErrorFallback = ({ error, reset }) => (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message || "We couldn't load this property. Please try again."}</p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>Try Again</Button>
          <Link href="/properties">
            <Button variant="outline">Back to Properties</Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={PropertyErrorFallback}>
      <div className="max-w-4xl mx-auto p-4">
      <PropertyImageCarousel images={property.image_urls || (property.image_url ? [property.image_url] : ["/placeholder-property-v2.jpg"])} />
      <div className="mb-8">
        <Link href="/properties" className="text-blue-500 hover:underline">
          &larr; Back to Properties
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                <p className="mt-2 flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" /> {property.location}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg">
                ₦{property.rent.toLocaleString()}/year
              </Badge>
            </div>
            
            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
            </div>

            <div className="mt-6 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Bed className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{property.property_type}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>Available: {property.available ? 'Now' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {owner && (
            <Card>
              <CardHeader className="flex flex-row items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={owner.avatar_url || '/placeholder-user.png'} alt={owner.name} />
                  <AvatarFallback>{owner.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{owner.name}</CardTitle>
                   {owner.review_count > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <StarRating rating={owner.average_rating} size={16} />
                          <span className="ml-1">{owner.average_rating.toFixed(1)} ({owner.review_count} reviews)</span>
                      </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleContactOwner}>
                  <MessageSquare className="h-4 w-4 mr-2"/> Contact Landlord
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.slice(0, 3).map(review => ( // Show first 3 reviews
                            <div key={review.id} className="border-b pb-2 last:border-b-0">
                                <div className="flex items-center mb-1">
                                    <StarRating rating={review.rating} size={14} />
                                    <p className="ml-2 font-semibold text-sm">{review.reviewer.name}</p>
                                </div>
                                <p className="text-gray-600 text-sm">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500">No reviews yet.</p>
                }
                 <div className="mt-4 pt-4 border-t">
                    <LeaveReviewForm landlordId={property.landlord_id} propertyId={property.id} onReviewSubmitted={fetchPropertyAndReviews} />
                </div>
            </CardContent>
          </Card>
          {currentUser && currentUser.id !== property.landlord_id && (
            <PaymentModal 
              propertyId={property.id}
              amount={property.rent}
              email={currentUser.email}
              userId={currentUser.id}
            >
              <Button className="mt-4 w-full">
                Pay Rent
              </Button>
            </PaymentModal>
          )}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
} 