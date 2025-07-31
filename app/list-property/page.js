"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Shield, AlertCircle, CheckCircle, Clock, MapPin } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"
import VerificationRequest from "@/components/VerificationRequest"
import { useDebounce } from "@/hooks/use-debounce"

export default function ListPropertyPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    rent: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
    amenities: [],
    latitude: null,
    longitude: null,
  })
  const [geocodingStatus, setGeocodingStatus] = useState(""); // idle, loading, success, error
  const debouncedLocation = useDebounce(formData.location, 1000); // Debounce location input for 1s
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth?redirect=/list-property");
          return
        }
        setUser(user)
        
        // Fetch user profile to check verification status
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()
        
        setUserProfile(profileData)
        // Fetch admin status
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("id")
          .eq("id", user.id)
          .single()
        if (adminData) setIsAdmin(true)
      }
    checkUser()
  }, [])

  // Effect for geocoding the address
  useEffect(() => {
    if (debouncedLocation && debouncedLocation.length > 3) {
      geocodeAddress(debouncedLocation);
    } else {
      setGeocodingStatus("");
    }
  }, [debouncedLocation]);

  const geocodeAddress = async (address) => {
    setGeocodingStatus("loading");
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
            setGeocodingStatus("success");
        } else {
            setGeocodingStatus("error");
            setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        setGeocodingStatus("error");
        setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => {
        const newAmenities = prev.amenities.includes(amenity)
            ? prev.amenities.filter(a => a !== amenity)
            : [...prev.amenities, amenity];
        return { ...prev, amenities: newAmenities };
    });
  };

  const handleImageUpload = async () => {
    if (!imageFiles.length) return [];
    setIsUploading(true);
    try {
      const urls = [];
      for (const imageFile of imageFiles) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `property-images/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('properties')
          .upload(filePath, imageFile);
        if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);
        if (!uploadData || !uploadData.path) throw new Error("Upload succeeded but did not return a valid path.");
        const { data: urlData } = supabase.storage
          .from('properties')
          .getPublicUrl(uploadData.path);
        if (!urlData || !urlData.publicUrl) throw new Error("Could not get public URL for the uploaded image.");
        urls.push(urlData.publicUrl);
      }
      return urls;
    } catch (error) {
      console.error("A critical error occurred in handleImageUpload:", error);
      alert(`Image upload failed: ${error.message}`);
      return [];
    } finally {
      setIsUploading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return;
    setLoading(true)
    let imageUrls = [];
    if(imageFiles.length) {
      imageUrls = await handleImageUpload();
      if(!imageUrls.length) {
        setLoading(false);
        return; // Stop submission if image upload fails
      }
    }
    try {
      const parsedRent = Number.parseInt(formData.rent, 10);
      const parsedBedrooms = Number.parseInt(formData.bedrooms, 10);
      const parsedBathrooms = Number.parseInt(formData.bathrooms, 10);
      if (isNaN(parsedRent) || isNaN(parsedBedrooms) || isNaN(parsedBathrooms)) {
        console.error("Form data is invalid. One of the number fields could not be parsed.", { formData });
        alert("Please ensure Rent, Bedrooms, and Bathrooms are valid numbers.");
        setLoading(false);
        return;
      }
      const propertyDataToInsert = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        rent: parsedRent,
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        property_type: formData.property_type,
        amenities: formData.amenities,
        latitude: formData.latitude,
        longitude: formData.longitude,
        landlord_id: user.id,
        available: true,
        image_url: imageUrls[0] || null, // for backward compatibility
        image_urls: imageUrls.length ? imageUrls : null,
      };

      // Add these lines for debugging
      console.log("User ID:", user?.id);
      console.log("Property Data:", propertyDataToInsert);

      const { data, error } = await supabase.from("properties").insert([propertyDataToInsert]).select().single();

      if (error) {
        // This will give us the detailed Supabase error instead of a generic one
        console.error("Error creating property in Supabase:", error);
        throw error;
      }

      router.push(`/property/${data.id}`);
    } catch (error) {
      // This will catch the error thrown above and display a more helpful alert
      console.error("Caught an error during property submission:", error)
      alert(`Error creating property. Please check the browser's developer console for details. (Error: ${error.message})`)
    } finally {
      setLoading(false)
    }
  }

  const getVerificationStatus = () => {
    if (!userProfile?.verification_status || userProfile.verification_status === 'unverified') {
      return {
        status: 'unverified',
        label: 'Unverified',
        description: 'You need to verify your account to list properties',
        icon: AlertCircle,
        color: 'destructive'
      }
    }
    
    if (userProfile.verification_status === 'basic_verified') {
      return {
        status: 'basic',
        label: 'Basic Verified',
        description: 'You can list up to 2 properties',
        icon: CheckCircle,
        color: 'default'
      }
    }
    
    if (userProfile.verification_status === 'fully_verified') {
      return {
        status: 'full',
        label: 'Fully Verified',
        description: 'You can list unlimited properties',
        icon: CheckCircle,
        color: 'default'
      }
    }

    return {
      status: 'pending',
      label: 'Pending Review',
      description: 'Your verification is being reviewed',
      icon: Clock,
      color: 'secondary'
    }
  }

  const canListProperties = () => {
    const userType = user?.user_metadata?.user_type || "tenant"
    const verificationInfo = getVerificationStatus()
    
    return userType === "landlord" && 
           (verificationInfo.status === 'basic' || verificationInfo.status === 'full')
  }

  const handleVerificationUpdate = async () => {
    // Refresh user profile after verification update
    const { data: profileData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()
    
    setUserProfile(profileData)
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  const userType = user?.user_metadata?.user_type || "tenant"
  const verificationInfo = getVerificationStatus()
  const StatusIcon = verificationInfo.icon

  // Show verification required message for tenants or unverified landlords
  if (userType !== "landlord") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Access Restricted</CardTitle>
              <CardDescription>Only verified landlords can list properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are registered as a tenant. Only landlords can list properties on our platform.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Link href="/auth">
                  <Button>Switch to Landlord Account</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show verification required message for unverified landlords
  if (!canListProperties() && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Verification Required
              </CardTitle>
              <CardDescription>
                Complete verification to start listing your properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={verificationInfo.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {verificationInfo.label}
                </Badge>
                <span className="text-sm text-gray-600">{verificationInfo.description}</span>
              </div>
              
              {verificationInfo.status === 'unverified' && (
                <VerificationRequest 
                  user={userProfile} 
                  onVerificationUpdate={handleVerificationUpdate}
                />
              )}

              {verificationInfo.status === 'pending' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your verification request is being reviewed. This typically takes 2-3 business days.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Link href="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant={verificationInfo.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {verificationInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List Your Property</CardTitle>
            <CardDescription>Fill out the details below to find the perfect tenants.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Property Title</Label>
                    <Input id="title" placeholder="e.g., Cozy 2-Bedroom Downtown Apartment" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe your property..." value={formData.description} onChange={e => handleInputChange('description', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="e.g., Lagos, Nigeria" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} required />
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                        {geocodingStatus === 'loading' && <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Searching for coordinates...</>}
                        {geocodingStatus === 'success' && <><CheckCircle className="h-3 w-3 mr-1 text-green-500" />Coordinates found!</>}
                        {geocodingStatus === 'error' && <><AlertCircle className="h-3 w-3 mr-1 text-red-500" />Could not find coordinates. Please be more specific.</>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select value={formData.property_type} onValueChange={value => handleInputChange('property_type', value)}>
                        <SelectTrigger id="property_type">
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                            <SelectItem value="House">House</SelectItem>
                            <SelectItem value="Duplex">Duplex</SelectItem>
                            <SelectItem value="Bungalow">Bungalow</SelectItem>
                            <SelectItem value="Townhouse">Townhouse</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rent">Monthly Rent (in NGN)</Label>
                    <Input id="rent" type="number" placeholder="e.g., 500000" value={formData.rent} onChange={e => handleInputChange('rent', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" type="number" placeholder="e.g., 3" value={formData.bedrooms} onChange={e => handleInputChange('bedrooms', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" type="number" placeholder="e.g., 2" value={formData.bathrooms} onChange={e => handleInputChange('bathrooms', e.target.value)} required />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                    <CardDescription>Select the amenities available at your property.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {['Parking', 'Pet-Friendly', 'Furnished', 'Swimming Pool', 'Air Conditioning', 'Washing Machine', 'Security', 'Wi-Fi'].map(amenity => (
                        <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                                id={amenity}
                                checked={formData.amenities.includes(amenity)}
                                onCheckedChange={() => handleAmenityChange(amenity)}
                            />
                            <Label htmlFor={amenity} className="font-normal">{amenity}</Label>
                        </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Property Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="property-images">Property Images</Label>
                    <input
                      id="property-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => setImageFiles(Array.from(e.target.files))}
                      className="block w-full border border-gray-300 rounded p-2 mb-4"
                      disabled={isUploading || loading}
                    />
                    {/* Show previews */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {imageFiles.map((file, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          className="w-24 h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={loading || isUploading} className="w-full">
                {loading || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? "Uploading..." : "Creating Property..."}
                  </>
                ) : (
                  "List Property"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
