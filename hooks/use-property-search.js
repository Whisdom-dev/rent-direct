import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useDebounce } from './use-debounce'
import { notify } from '@/lib/notifications'

export function usePropertySearch(initialProperties = []) {
  const [properties, setProperties] = useState(initialProperties)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [filters, setFilters] = useState({
    property_type: "all",
    amenities: [],
    price_range: [0, 2000000],
    bedrooms: "any",
    bathrooms: "any",
    sort_by: "newest", // newest, price_low_high, price_high_low
  })
  
  // Saved searches
  const [savedSearches, setSavedSearches] = useState([])
  
  // Debounce search inputs to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedLocationSearch = useDebounce(locationSearch, 300)
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
  }
  
  // Toggle amenity selection
  const handleAmenityToggle = (amenity) => {
    handleFilterChange(
      "amenities",
      filters.amenities.includes(amenity)
        ? filters.amenities.filter(a => a !== amenity)
        : [...filters.amenities, amenity]
    )
  }
  
  // Reset all filters to default values
  const resetFilters = () => {
    setSearchTerm("")
    setLocationSearch("")
    setFilters({
      property_type: "all",
      amenities: [],
      price_range: [0, 2000000],
      bedrooms: "any",
      bathrooms: "any",
      sort_by: "newest",
    })
  }
  
  // Save current search criteria
  const saveSearch = (name) => {
    const newSavedSearch = {
      id: Date.now().toString(),
      name,
      criteria: {
        searchTerm,
        locationSearch,
        filters: { ...filters }
      }
    }
    
    setSavedSearches(prev => [...prev, newSavedSearch])
    
    // Optionally save to localStorage
    try {
      const existingSavedSearches = JSON.parse(localStorage.getItem('savedPropertySearches') || '[]')
      localStorage.setItem('savedPropertySearches', JSON.stringify([...existingSavedSearches, newSavedSearch]))
      notify.success("Search Saved", `Your search "${name}" has been saved`)
    } catch (error) {
      console.error('Error saving search to localStorage:', error)
      notify.error("Save Error", "Failed to save your search. Please try again.")
    }
  }
  
  // Load a saved search
  const loadSavedSearch = (savedSearchId) => {
    const savedSearch = savedSearches.find(search => search.id === savedSearchId)
    if (savedSearch) {
      setSearchTerm(savedSearch.criteria.searchTerm)
      setLocationSearch(savedSearch.criteria.locationSearch)
      setFilters(savedSearch.criteria.filters)
      notify.info("Search Loaded", `Loaded saved search: "${savedSearch.name}"`)
    }
  }
  
  // Delete a saved search
  const deleteSavedSearch = (savedSearchId) => {
    setSavedSearches(prev => prev.filter(search => search.id !== savedSearchId))
    
    // Update localStorage
    try {
      const existingSavedSearches = JSON.parse(localStorage.getItem('savedPropertySearches') || '[]')
      localStorage.setItem(
        'savedPropertySearches', 
        JSON.stringify(existingSavedSearches.filter(search => search.id !== savedSearchId))
      )
    } catch (error) {
      console.error('Error removing saved search from localStorage:', error)
      notify.error("Delete Error", "Failed to delete saved search. Please try again.")
    }
  }
  
  // Load saved searches from localStorage on initial render
  useEffect(() => {
    try {
      const storedSearches = JSON.parse(localStorage.getItem('savedPropertySearches') || '[]')
      setSavedSearches(storedSearches)
    } catch (error) {
      console.error('Error loading saved searches from localStorage:', error)
    }
  }, [])
  
  // Fetch properties based on search criteria and filters
  const fetchProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase.from("properties").select("*")
      
      // Text search in title and description
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`)
      }
      
      // Location search
      if (debouncedLocationSearch) {
        query = query.ilike('location', `%${debouncedLocationSearch}%`)
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
        query = query.eq('bedrooms', parseInt(filters.bedrooms))
      }
      
      // Bathrooms filter
      if (filters.bathrooms !== 'any') {
        query = query.eq('bathrooms', parseInt(filters.bathrooms))
      }
      
      // Apply sorting
      switch (filters.sort_by) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'price_low_high':
          query = query.order('rent', { ascending: true })
          break
        case 'price_high_low':
          query = query.order('rent', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error("Error fetching properties:", error)
      setError("Failed to load properties. Please try again.")
      notify.error("Search Error", "Failed to load properties. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm, debouncedLocationSearch, filters])
  
  // Fetch properties whenever search criteria or filters change
  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])
  
  return {
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
    deleteSavedSearch,
    refetch: fetchProperties
  }
}