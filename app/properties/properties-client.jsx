"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { MapPin, Bed, Bath, List, Map, AlertCircle, SlidersHorizontal, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"
import { usePropertySearch } from "@/hooks/use-property-search"
import { PropertySearch } from "@/components/PropertySearch"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { notify } from "@/lib/notifications"
import { PropertyGridSkeleton, SearchBarSkeleton, FiltersSkeleton } from "@/components/ui/skeletons"

const PropertiesMap = dynamic(() => import("@/components/PropertiesMap"), { ssr: false })

export default function PropertiesClient({ initialProperties }) {
  const [viewMode, setViewMode] = useState('list')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Use our custom hook for property search and filtering
  const {
    properties,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    locationSearch,
    setLocationSearch,
    filters,
    handleFilterChange,
    handleAmenityToggle,
    resetFilters,
    savedSearches,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch
  } = usePropertySearch(initialProperties)

  // Calculate the number of active filters for the UI
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.property_type !== 'all') count++
    if (filters.bedrooms !== 'any') count++
    if (filters.bathrooms !== 'any') count++
    if (filters.amenities.length > 0) count++
    if (filters.price_range[0] > 0 || filters.price_range[1] < 2000000) count++
    return count
  }

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
              <Checkbox
                id={`amenity-${amenity}`}
                checked={filters.amenities.includes(amenity)}
                onCheckedChange={() => handleAmenityToggle(amenity)}
              />
              <Label htmlFor={`amenity-${amenity}`} className="font-normal">{amenity}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Custom error fallback for the properties page
  const PropertiesErrorFallback = ({ error, reset }) => (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {error.message || "We couldn't load the properties. Please try again."}
        </p>
        <Button
          onClick={() => {
            reset();
            notify.info("Refreshed", "Trying to load properties again");
          }}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={PropertiesErrorFallback}>
      <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
              RentDirect
            </Link>
            <div className="hidden md:flex items-center">
              <Link href="/list-property">
                <Button>List Your Property</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Search Bar */}
      <div className="bg-white border-b py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && properties.length === 0 ? (
            <SearchBarSkeleton />
          ) : (
            <PropertySearch
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              locationSearch={locationSearch}
              setLocationSearch={setLocationSearch}
              filters={filters}
              handleFilterChange={handleFilterChange}
              resetFilters={resetFilters}
              savedSearches={savedSearches}
              saveSearch={saveSearch}
              loadSavedSearch={loadSavedSearch}
              deleteSavedSearch={deleteSavedSearch}
              activeFiltersCount={getActiveFiltersCount()}
            />
          )}
        </div>
      </div>

      <main className="flex">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-1/4 xl:w-1/5 p-6 bg-white border-r space-y-8 sticky top-16 h-screen-minus-header">
          {loading && properties.length === 0 ? (
            <FiltersSkeleton />
          ) : (
            <FilterControls />
          )}
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

          {/* Error message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <PropertyGridSkeleton count={6} />
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
                                {property.bedrooms} {property.bedrooms > 1 ? 'Beds' : 'Bed'}
                              </div>
                              <div className="flex items-center">
                                <Bath className="h-4 w-4 mr-1" />
                                {property.bathrooms} {property.bathrooms > 1 ? 'Baths' : 'Bath'}
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
    </ErrorBoundary>
  )
}