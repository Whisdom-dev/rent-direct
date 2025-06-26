"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { MapPin, Bed, Bath, Search, SlidersHorizontal, List, Map } from "lucide-react"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import dynamic from "next/dynamic"

const PropertiesMap = dynamic(() => import("@/components/PropertiesMap"), { ssr: false })

export default function PropertiesPage() {
  const [properties, setProperties] = useState([])
  const [allProperties, setAllProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    property_type: "all",
    amenities: [],
    price_range: [0, 2000000],
    bedrooms: "any",
    bathrooms: "any",
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }

  const handleAmenityChange = (amenity) => {
    handleFilterChange(
      "amenities",
      filters.amenities.includes(amenity)
        ? filters.amenities.filter(a => a !== amenity)
        : [...filters.amenities, amenity]
    )
  }

  const fetchProperties = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from("properties").select("*")

      // Text search
      if (debouncedSearchTerm) {
        query = query.textSearch("title", debouncedSearchTerm, { type: "websearch" })
      }

      // Property type filter
      if (filters.property_type !== "all") {
        query = query.eq("property_type", filters.property_type)
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        query = query.contains("amenities", filters.amenities)
      }

      // Price range filter
      query = query.gte("rent", filters.price_range[0])
      query = query.lte("rent", filters.price_range[1])
      
      // Bedrooms filter
      if (filters.bedrooms !== 'any') {
        query = query.eq('bedrooms', parseInt(filters.bedrooms));
      }

      // Bathrooms filter
      if (filters.bathrooms !== 'any') {
          query = query.eq('bathrooms', parseInt(filters.bathrooms));
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, filters])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const FilterControls = () => (
    <div className="space-y-8">
        <h3 className="text-lg font-semibold flex items-center">
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Filters
        </h3>

        {/* Price Range */}
        <div className="space-y-4">
            <Label>Price Range (₦{filters.price_range[0].toLocaleString()} - ₦{filters.price_range[1].toLocaleString()})</Label>
            <Slider
                min={0}
                max={2000000}
                step={50000}
                value={filters.price_range}
                onValueChange={(value) => handleFilterChange('price_range', value)}
            />
        </div>

        {/* Property Type */}
        <div className="space-y-2">
            <Label>Property Type</Label>
            <Select value={filters.property_type} onValueChange={(value) => handleFilterChange('property_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Duplex">Duplex</SelectItem>
                    <SelectItem value="Bungalow">Bungalow</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Select value={filters.bedrooms} onValueChange={(value) => handleFilterChange('bedrooms', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Bed{n > 1 ? 's' : ''}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Bathrooms</Label>
                 <Select value={filters.bathrooms} onValueChange={(value) => handleFilterChange('bathrooms', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Bath{n > 1 ? 's' : ''}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* Amenities */}
        <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="space-y-2">
            {['Parking', 'Pet-Friendly', 'Furnished', 'Swimming Pool', 'Air Conditioning', 'Security'].map(amenity => (
                <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox id={`amenity-${amenity}`} checked={filters.amenities.includes(amenity)} onCheckedChange={() => handleAmenityChange(amenity)} />
                    <Label htmlFor={`amenity-${amenity}`} className="font-normal">{amenity}</Label>
                </div>
            ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
              RentDirect
            </Link>
            <div className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
            <div className="hidden md:flex items-center">
              <Link href="/list-property">
                <Button>List Your Property</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-1/4 xl:w-1/5 p-6 bg-white border-r space-y-8 sticky top-16 h-screen-minus-header">
           <FilterControls />
        </aside>

        {/* Properties Grid */}
        <div className="w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">All Properties ({properties.length})</h2>
            <div className="flex items-center gap-2">
                <div className="lg:hidden">
                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                                <SlidersHorizontal className="h-4 w-4 mr-2" />
                                Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                             <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="p-4 overflow-y-auto">
                                <FilterControls />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                    <List className="h-4 w-4 mr-2" />
                    List
                </Button>
                <Button variant={viewMode === 'map' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('map')}>
                    <Map className="h-4 w-4 mr-2" />
                    Map
                </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <MapPin className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later for new listings.</p>
            </div>
          ) : (
            <div className="mt-8">
                {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {properties.map((property) => (
                          <Link href={`/property/${property.id}`} key={property.id}>
                            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                              <div className="relative">
                                <img
                                  src={property.image_url || "/placeholder-property-v2.jpg"}
                                  alt={property.title}
                                  className="w-full h-48 object-cover rounded-t-lg"
                                />
                                <Badge className="absolute top-2 right-2" variant={property.available ? 'default' : 'destructive'}>
                                  {property.available ? 'Available' : 'Unavailable'}
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
                                    ₦{property.rent.toLocaleString()}/year
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
                ) : (
                    <div className="h-[600px] w-full">
                        <PropertiesMap properties={properties} />
                    </div>
                )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 