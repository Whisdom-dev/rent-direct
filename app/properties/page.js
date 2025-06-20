"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bed, Bath, DollarSign, Search } from "lucide-react"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key",
)

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">RentDirect</h1>
            </Link>
            <div className="flex-1 max-w-md mx-auto">
                <div className="relative">
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
            <div className="flex items-center">
                <Link href="/list-property">
                    <Button>List Your Property</Button>
                </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Properties Grid */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-gray-900">All Properties ({filteredProperties.length})</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your search or check back later for new listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <Link href={`/property/${property.id}`}>
                    <div className="relative">
                      <img
                        src={property.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      {property.available && <Badge className="absolute top-2 right-2 bg-green-500">Available</Badge>}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Bed className="h-4 w-4 mr-1" />
                            {property.bedrooms} beds
                          </div>
                          <div className="flex items-center">
                            <Bath className="h-4 w-4 mr-1" />
                            {property.bathrooms} baths
                          </div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        ${property.rent}/month
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 