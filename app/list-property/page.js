"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"

export default function ListPropertyPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    rent: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
  })
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth?redirect=/list-property");
          return
        }
        setUser(user)
      }
    checkUser()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    try {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `property-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Supabase upload error: ${uploadError.message}`);
        }

        if (!uploadData || !uploadData.path) {
          throw new Error("Upload succeeded but did not return a valid path.");
        }

        const { data: urlData } = supabase.storage
            .from('properties')
            .getPublicUrl(uploadData.path);
            
        if (!urlData || !urlData.publicUrl) {
            throw new Error("Could not get public URL for the uploaded image.");
        }

        return urlData.publicUrl;

    } catch (error) {
        console.error("A critical error occurred in handleImageUpload:", error);
        alert(`Image upload failed: ${error.message}`);
        return null;
    } finally {
        setIsUploading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return;

    setLoading(true)
    let imageUrl = null;

    if(imageFile) {
        imageUrl = await handleImageUpload();
        if(!imageUrl) {
            setLoading(false);
            return; // Stop submission if image upload fails
        }
    }

    try {
      const parsedRent = Number.parseInt(formData.rent, 10);
      const parsedBedrooms = Number.parseInt(formData.bedrooms, 10);
      const parsedBathrooms = Number.parseInt(formData.bathrooms, 10);

      // Add validation to check for NaN, which happens if fields are empty
      if (isNaN(parsedRent) || isNaN(parsedBedrooms) || isNaN(parsedBathrooms)) {
          console.error("Form data is invalid. One of the number fields could not be parsed.", { formData });
          alert("Please ensure Rent, Bedrooms, and Bathrooms are valid numbers.");
          setLoading(false);
          return;
      }

      // Add detailed logging to see the exact data before insertion
      const propertyDataToInsert = {
        ...formData,
        rent: parsedRent,
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        landlord_id: user.id,
        available: true,
        image_url: imageUrl,
      };

      console.log("Attempting to create property with this data:", propertyDataToInsert);

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

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

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
            <CardTitle className="text-2xl">List Your Property</CardTitle>
            <CardDescription>Fill out the details below to find the perfect tenants.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Beautiful 2BR Apartment in Downtown"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your property in detail..."
                  required
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Downtown, City Center"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rent">Monthly Rent ($)</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={formData.rent}
                    onChange={(e) => handleInputChange("rent", e.target.value)}
                    placeholder="1200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select required value={formData.bedrooms} onValueChange={(value) => handleInputChange("bedrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select required value={formData.bathrooms} onValueChange={(value) => handleInputChange("bathrooms", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="property_type">Property Type</Label>
                <Select
                  required
                  value={formData.property_type}
                  onValueChange={(value) => handleInputChange("property_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="room">Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Property Image</Label>
                <FileUpload onUpload={setImageFile} isUploading={isUploading} />
              </div>

              <Button type="submit" disabled={loading || isUploading} className="w-full">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'List Property'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
