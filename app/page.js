"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bed, Bath, DollarSign, Search, Plus, Bell } from "lucide-react"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "your-supabase-url",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key",
)

export default function HomePage() {
  const [properties, setProperties] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchProperties()
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("available", true)
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">RentDirect</h1>
              <Badge variant="secondary" className="ml-2">
                Beta
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Connect Directly with Landlords & Tenants</h2>
          <p className="text-xl mb-8 opacity-90">No agents, no fees. Just direct connections for rental properties.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/list-property">
              <Button size="lg" variant="secondary">
                <Plus className="h-5 w-5 mr-2" />
                List Your Property
              </Button>
            </Link>
            <Link href="/properties">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              >
                Browse Rentals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md mx-auto">
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

      {/* Properties Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Available Properties ({filteredProperties.length})</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your search or check back later for new listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Link href={`/property/${property.id}`} key={property.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                    <div className="relative">
                      <img
                        src={property.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-2 right-2 bg-green-500">Available</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                        <div className="flex items-center text-lg font-semibold text-green-600">
                          <DollarSign className="h-5 w-5" />
                          {property.rent}/month
                        </div>
                        <Button size="sm" asChild>
                           <span className="cursor-pointer">View Details</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose RentDirect?</h3>
            <p className="text-lg text-gray-600">Cut out the middleman and connect directly</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">No Agent Fees</h4>
              <p className="text-gray-600">Save money by connecting directly with landlords and tenants.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bell className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Exit Notifications</h4>
              <p className="text-gray-600">
                Get notified when tenants are moving out of properties you're interested in.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Direct Contact</h4>
              <p className="text-gray-600">Communicate directly with property owners and potential tenants.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
