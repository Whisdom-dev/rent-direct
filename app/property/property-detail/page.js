"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, DollarSign, User, Calendar, ShieldCheck, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [property, setProperty] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    fetchCurrentUser();

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
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
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', propertyData.landlord_id)
          .single();
        
        if (ownerError) throw ownerError;
        setOwner(ownerData);
      }
    } catch (error) {
      console.error('Error fetching property details:', error);
      // Optionally redirect to a 404 page
      // router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = async () => {
    if (!currentUser) {
        router.push(`/auth?redirect=/property/${id}`);
        return;
    }
    if(currentUser.id === property.landlord_id) {
        alert("You cannot start a conversation with yourself.");
        return;
    }

    try {
        // Check if a conversation already exists
        let { data: existingConversation, error: existingError } = await supabase
            .from('conversations')
            .select('id')
            .or(`(user1_id.eq.${currentUser.id},user2_id.eq.${property.landlord_id}),(user1_id.eq.${property.landlord_id},user2_id.eq.${currentUser.id})`)
            .eq('property_id', property.id)
            .maybeSingle();

        if (existingError) throw existingError;

        if (existingConversation) {
            router.push(`/dashboard/messages/${existingConversation.id}`);
        } else {
            // Create a new conversation
            const { data: newConversation, error: newConvoError } = await supabase
                .from('conversations')
                .insert({
                    property_id: property.id,
                    user1_id: currentUser.id, // Renter
                    user2_id: property.landlord_id, // Owner
                })
                .select()
                .single();

            if (newConvoError) throw newConvoError;
            
            router.push(`/dashboard/messages/${newConversation.id}`);
        }

    } catch (error) {
        console.error('Error handling contact owner:', error);
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
                            src={property.image_url || '/placeholder.svg'} 
                            alt={property.title}
                            className="w-full h-96 object-cover rounded-lg mb-4"
                        />
                        <div className="flex justify-between items-start">
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
            </div>

            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-2xl">
                            Rent
                            <span className="flex items-center font-bold text-green-600">
                                <DollarSign className="h-6 w-6" />
                                {property.rent}
                                <span className="text-lg font-normal text-gray-500">/month</span>
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full text-lg" size="lg" onClick={handleContactOwner} disabled={!property.available}>
                           <MessageSquare className="h-5 w-5 mr-2"/> Contact Owner
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">Directly message the property owner.</p>
                    </CardContent>
                </Card>
                {owner && (
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <img src={owner.avatar_url || '/placeholder-user.jpg'} alt={owner.name} className="w-16 h-16 rounded-full"/>
                            <div>
                                <CardDescription>Property Owner</CardDescription>
                                <CardTitle className="text-xl">{owner.name}</CardTitle>
                            </div>
                        </CardHeader>
                    </Card>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Safety Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                        <p className="flex items-start"><ShieldCheck className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0"/> Always inspect the property in person.</p>
                        <p className="flex items-start"><ShieldCheck className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0"/> Never pay security deposits before signing a lease.</p>
                        <p className="flex items-start"><ShieldCheck className="h-4 w-4 mr-2 mt-1 text-green-500 flex-shrink-0"/> All transactions should happen through the platform.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
} 