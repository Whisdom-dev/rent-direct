"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Heart } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  // This is a placeholder. In a real app, you'd fetch the user's favorited properties.
  const favoriteProperties = []; 

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Favorites</h1>
      </div>

      {favoriteProperties.length === 0 ? (
        <div className="text-center border-2 border-dashed rounded-lg p-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-6 text-xl font-semibold">You haven't favorited any properties yet.</h2>
          <p className="text-gray-500 mt-2">Browse properties and click the heart icon to save them here.</p>
          <Link href="/properties" className="mt-6 inline-block">
            <Button size="lg">Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* This would be a map of the user's actual favorite properties */}
          <Card>
            <CardHeader>
                <CardTitle>Example Property</CardTitle>
                <CardDescription>123 Main St, Anytown</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This is where a favorited property's details would appear.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 