"use client"

import React from 'react'
import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * A component that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 */
export function ErrorBoundary({ 
  children, 
  fallback, 
  onError,
  resetKeys = []
}) {
  const [error, setError] = useState(null)
  
  // Reset error state when resetKeys change
  useEffect(() => {
    if (error) setError(null)
  }, [resetKeys])
  
  // If there's no error, render children
  if (!error) {
    return (
      <ErrorBoundaryInner 
        setError={setError} 
        onError={onError}
      >
        {children}
      </ErrorBoundaryInner>
    )
  }
  
  // If there's an error and a custom fallback is provided, use it
  if (fallback) {
    return fallback({ error, reset: () => setError(null) })
  }
  
  // Default fallback UI
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{error.message || 'An unexpected error occurred'}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setError(null)}
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// Inner component that catches errors
class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    
    // Set the error in the parent component
    this.props.setError(error)
  }
  
  render() {
    if (this.state.hasError) {
      // This will never be rendered because we handle the error in the parent
      return null
    }
    
    return this.props.children
  }
}