"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroSection from "@/components/ui/HeroSection";

import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bed,
  Bath,
  DollarSign,
  Search,
  Plus,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProperties();
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) =>
    [property.title, property.location, property.description]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                RentDirect
              </h1>
              <Badge variant="secondary" className="ml-2">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/dashboard/messages">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                </Button>
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />


    {/* Search Bar (Sticky on scroll) */}
<section className="bg-white sticky top-0 z-30 shadow-sm">
  <div className="mx-auto px-2 sm:px-4 py-4">
    <div className="relative max-w-2xl mx-auto">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
      <Input
        type="text"
        placeholder="Search by location, property type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-4 py-3 w-full"
      />
    </div>
  </div>
</section>

{/* Decorative Full-width Banner Image */}
<section className="relative h-60 sm:h-72 lg:h-80 overflow-hidden">
  <img
    src="/banner.jpg"
    alt="RentDirect banner"
    className="w-full h-full object-contain opacity-80"
  />
  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent flex items-center px-4 sm:px-12">
    <div className="text-white max-w-2xl">
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Browse Properties</h2>
      <p className="text-sm sm:text-base">Find listings near you and connect directly with property owners.</p>
    </div>
  </div>
</section>

{/* Listings Section - edge to edge */}
<section className="py-10 bg-white">
  <div className="mx-auto px-2 sm:px-4">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-2xl font-semibold text-gray-900">
        Available Properties ({filteredProperties.length})
      </h3>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : filteredProperties.length === 0 ? (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <MapPin className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No properties found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search or check back later for new listings.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProperties.map((property) => (
          <Card
            key={property.id}
            className="h-full hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          >
            <div className="relative">
              <img
                src={property.image_url || "/placeholder-property-v2.jpg"}
                alt={property.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <Badge className="absolute top-2 right-2 bg-green-500">
                Available
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{property.title}</CardTitle>
              <CardDescription className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {property.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {property.description}
              </p>
              <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-4 w-4 mr-1" />
                    {property.bathrooms}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-green-600">
                  ₦{property.rent}/month
                </div>
                <Link href={`/property/${property.id}`} passHref>
                  <Button size="sm">View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
</section>



      {/* Features */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why Choose RentDirect?
            </h3>
            <p className="text-base sm:text-lg text-gray-600">
              Cut out the middleman and connect directly
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">No Agent Fees</h4>
              <p className="text-sm text-gray-600">
                Save money by connecting directly with landlords and tenants.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Exit Notifications</h4>
              <p className="text-sm text-gray-600">
                Get notified when tenants are moving out of properties you're interested in.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Direct Contact</h4>
              <p className="text-sm text-gray-600">
                Communicate directly with property owners and potential tenants.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
