"use client"

import { useState } from 'react'
import { 
  Search, MapPin, SlidersHorizontal, X, Save, Clock, 
  ChevronDown, ArrowUpDown, ArrowDownUp, ArrowUp 
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export function PropertySearch({
  searchTerm,
  setSearchTerm,
  locationSearch,
  setLocationSearch,
  filters,
  handleFilterChange,
  resetFilters,
  savedSearches,
  saveSearch,
  loadSavedSearch,
  deleteSavedSearch,
  activeFiltersCount
}) {
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState(false)
  const [newSearchName, setNewSearchName] = useState('')
  const [saveError, setSaveError] = useState('')

  const handleSaveSearch = () => {
    if (!newSearchName.trim()) {
      setSaveError('Please enter a name for your search')
      return
    }
    
    saveSearch(newSearchName)
    setNewSearchName('')
    setSaveError('')
    setSaveSearchDialogOpen(false)
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Clock },
    { value: 'price_low_high', label: 'Price: Low to High', icon: ArrowUpDown },
    { value: 'price_high_low', label: 'Price: High to Low', icon: ArrowDownUp },
  ]

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === filters.sort_by)
    return option ? option.label : 'Sort By'
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Location Search */}
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Location..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
          {locationSearch && (
            <button 
              onClick={() => setLocationSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {getSortLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem 
                key={option.value}
                onClick={() => handleFilterChange('sort_by', option.value)}
                className="flex items-center"
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved Searches */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Saved Searches
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Your Saved Searches</h4>
              {savedSearches.length === 0 ? (
                <p className="text-sm text-gray-500">No saved searches yet</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {savedSearches.map((search) => (
                    <div key={search.id} className="flex items-center justify-between border rounded-md p-2">
                      <span className="font-medium text-sm">{search.name}</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => loadSavedSearch(search.id)}
                        >
                          Apply
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteSavedSearch(search.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                className="w-full mt-2" 
                onClick={() => setSaveSearchDialogOpen(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Search
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {filters.property_type !== 'all' && (
            <Badge variant="outline" className="flex items-center gap-1">
              Type: {filters.property_type}
              <button onClick={() => handleFilterChange('property_type', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.bedrooms !== 'any' && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.bedrooms} Bed{filters.bedrooms !== '1' ? 's' : ''}
              <button onClick={() => handleFilterChange('bedrooms', 'any')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.bathrooms !== 'any' && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.bathrooms} Bath{filters.bathrooms !== '1' ? 's' : ''}
              <button onClick={() => handleFilterChange('bathrooms', 'any')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.amenities.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              {filters.amenities.length} Amenities
              <button onClick={() => handleFilterChange('amenities', [])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(filters.price_range[0] > 0 || filters.price_range[1] < 2000000) && (
            <Badge variant="outline" className="flex items-center gap-1">
              ₦{filters.price_range[0].toLocaleString()} - ₦{filters.price_range[1].toLocaleString()}
              <button onClick={() => handleFilterChange('price_range', [0, 2000000])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Save Search Dialog */}
      <Dialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Search</DialogTitle>
            <DialogDescription>
              Give your search a name so you can easily find it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., 2-bed apartments in Lagos"
                value={newSearchName}
                onChange={(e) => setNewSearchName(e.target.value)}
              />
            </div>
            
            {saveError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSearchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}