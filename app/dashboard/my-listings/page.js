"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function MyListingsPage() {
  // This is a placeholder. In a real app, you'd fetch the user's properties.
  const userProperties = []; 

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Link href="/list-property">
          <Button>
            <PlusCircle className="h-5 w-5 mr-2" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {userProperties.length === 0 ? (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
          <h2 className="text-xl font-semibold">You haven't listed any properties yet.</h2>
          <p className="text-gray-500 mt-2">Get started by adding your first property to find great tenants.</p>
          <Link href="/list-property" className="mt-6 inline-block">
            <Button size="lg">List Your Property</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* This would be a map of the user's actual properties */}
          <Card>
            <CardHeader>
                <CardTitle>Example Property</CardTitle>
                <CardDescription>123 Main St, Anytown</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This is where property details and management options would go.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 