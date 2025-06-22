"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, DollarSign, User, Calendar, ShieldCheck, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import LeaveReviewForm from '@/components/LeaveReviewForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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
        alert("You cannot start a conversation with yourself.");
        return;
    }

    if (!property.landlord_id) {
        console.error("This property does not have an owner associated with it.");
        alert("Cannot start a conversation: This property has no owner.");
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
        alert('There was an error starting the conversation. Please try again.');
    }
  };

  if (loading) {
    return (
        <div className="max-w-4xl mx-auto p-4 animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-20 bg-gray-200 rounded mb-6"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
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

  return (
    <div className="bg-gray-50 min-h-screen">
       <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">RentDirect</h1>
            </Link>
            <div className="flex items-center">
                <Link href="/properties">
                    <Button variant="outline">All Properties</Button>
                </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <img 
                            src={property.image_url} 
                            alt={property.title}
                            className="w-full h-96 object-cover rounded-lg mb-4 bg-gray-100"
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                        />
                        <a href={property.image_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline break-all">
                          Debug: Click to open image in new tab
                        </a>
                        <div className="flex justify-between items-start mt-4">
                            <div>
                                <CardTitle className="text-3xl font-bold">{property.title}</CardTitle>
                                <CardDescription className="flex items-center text-lg text-gray-600 mt-2">
                                    <MapPin className="h-5 w-5 mr-2" />
                                    {property.location}
                                </CardDescription>
                            </div>
                            <Badge className={`text-md ${property.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {property.available ? 'Available' : 'Rented'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-6 border-y py-4 my-4">
                            <div className="flex items-center text-gray-700">
                                <Bed className="h-6 w-6 mr-2 text-primary" />
                                <span className="font-semibold">{property.bedrooms} Bedrooms</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Bath className="h-6 w-6 mr-2 text-primary" />
                                <span className="font-semibold">{property.bathrooms} Bathrooms</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
                    </CardContent>
                </Card>

                {/* Reviews Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Reviews for {owner?.name}</CardTitle>
                        {owner && owner.review_count > 0 && (
                             <div className="flex items-center gap-2 mt-2">
                                <StarRating rating={owner.average_rating} />
                                <span className="text-gray-600">
                                    {owner.average_rating.toFixed(1)} ({owner.review_count} reviews)
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Leave a review form */}
                        {currentUser && currentUser.id !== owner?.id && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
                                <LeaveReviewForm
                                    propertyId={property.id}
                                    landlordId={owner.id}
                                    reviewerId={currentUser.id}
                                    onReviewSubmitted={fetchPropertyAndReviews}
                                />
                            </div>
                        )}

                        {/* Existing Reviews */}
                        <div className="space-y-4">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <div key={review.id} className="flex items-start space-x-4 border-t pt-4">
                                        <Avatar>
                                            <AvatarImage src={review.reviewer.avatar_url} />
                                            <AvatarFallback>{review.reviewer.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">{review.reviewer.name}</span>
                                                <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <StarRating rating={review.rating} size={14} className="my-1" />
                                            <p className="text-gray-700">{review.comment}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">This landlord has no reviews yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-2xl">
                            Rent
                            <span className="flex items-center font-bold text-green-600">
                                ₦{property.rent}
                                <span className="text-lg font-normal text-gray-500">/month</span>
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {owner ? (
                            <div className="flex items-center space-x-4">
                                <Avatar>
                                    <AvatarImage src={owner.avatar_url} alt={owner.name} />
                                    <AvatarFallback>{owner.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-lg">{owner.name}</p>
                                    {owner.review_count > 0 && (
                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                            <StarRating rating={owner.average_rating} size={14} />
                                            <span>{owner.average_rating.toFixed(1)} ({owner.review_count})</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">Owner information not available.</div>
                        )}
                        <Button className="w-full mt-6" onClick={handleContactOwner}>
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Contact Landlord
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                     <CardHeader>
                        <CardTitle>Safety Tips</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                           <li>Check property documents</li>
                           <li>Verify owner's identity</li>
                           <li>Never pay in cash</li>
                        </ul>
                     </CardContent>
                 </Card>
            </div>
        </div>
      </main>
    </div>
  );
} 