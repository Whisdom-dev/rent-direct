import { createServerSupabaseClient } from "@/lib/supabase/server"
import PropertiesClient from "./properties-client"

export const dynamic = 'force-dynamic' // Ensure fresh data on each request

export default async function PropertiesPage() {
  const supabase = createServerSupabaseClient()
  
  // Fetch properties on the server
  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
  
  // Handle errors gracefully
  if (error) {
    console.error("Error fetching properties:", error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">We couldn't load the properties. Please try again later.</p>
          <a href="/" className="text-blue-600 hover:underline">Return to home page</a>
        </div>
      </div>
    )
  }
  
  // Pass the server-fetched properties to the client component
  return <PropertiesClient initialProperties={properties || []} />
}