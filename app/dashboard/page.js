"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Bed, Bath, DollarSign, Eye, Bell } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [properties, setProperties] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }
    setUser(user)
    fetchUserData(user)
  }

  const fetchUserData = async (user) => {
    try {
      // Fetch user's properties if they're a landlord
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false })

      setProperties(propertiesData || [])

      // Fetch notifications (mock data for now)
      setNotifications([
        {
          id: 1,
          message: "New inquiry for your 2BR Downtown Apartment",
          type: "inquiry",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          message: "Tenant marked exit notification for Sunset Villa",
          type: "exit",
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const markAsUnavailable = async (propertyId) => {
    try {
      const { error } = await supabase.from("properties").update({ available: false }).eq("id", propertyId)

      if (error) throw error

      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, available: false } : p)))
    } catch (error) {
      console.error("Error updating property:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const userType = user?.user_metadata?.user_type || "tenant"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-4 sm:py-0 space-y-4 sm:space-y-0">
            <div className="flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
                RentDirect
              </Link>
              <Badge variant="outline" className="ml-2">
                {userType === "landlord" ? "Landlord" : "Tenant"}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm text-gray-600 text-center sm:text-left">Welcome, {user?.user_metadata?.full_name || user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{properties.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {properties.filter((p) => p.available).length} available
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${properties.reduce((sum, p) => sum + (p.available ? 0 : p.rent), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">From rented properties</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  <p className="text-xs text-muted-foreground">You have {notifications.length} unread notifications</p>
                  <Link href="/dashboard/messages" passHref>
                    <Button variant="outline" size="sm" className="mt-4 w-full sm:w-auto">View Messages</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {userType === "landlord" && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your rental business</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <Link href="/list-property" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Property
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Exit Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold">My Properties</h2>
              {userType === "landlord" && (
                <Link href="/list-property" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </Link>
              )}
            </div>

            {properties.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500 mb-4">No properties listed yet</p>
                  {userType === "landlord" && (
                    <Link href="/list-property">
                      <Button>List Your First Property</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card key={property.id}>
                    <div className="relative">
                      <img
                        src={property.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className={`absolute top-2 right-2 ${property.available ? "bg-green-500" : "bg-red-500"}`}>
                        {property.available ? "Available" : "Rented"}
                      </Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{property.title}</CardTitle>
                      <CardDescription className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-lg font-semibold text-green-600">
                          <DollarSign className="h-5 w-5" />
                          {property.rent}/month
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {property.available && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsUnavailable(property.id)}
                            className="flex-1"
                          >
                            Mark Rented
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications</h2>

            {notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === "inquiry" ? "bg-blue-100" : "bg-orange-100"
                            }`}
                          >
                            <Bell
                              className={`h-4 w-4 ${
                                notification.type === "inquiry" ? "text-blue-600" : "text-orange-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
