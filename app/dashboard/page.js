"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Bed, Bath, Eye, Bell, Shield, AlertCircle, CheckCircle, Clock, Wallet } from "lucide-react"
import VerificationRequest from "@/components/VerificationRequest"

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
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
      // Fetch user profile with verification status
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (profileError) throw profileError
      setUserProfile(profileData)

      // Check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .single()

      if (adminData) {
        setIsAdmin(true)
      } else if (adminError && adminError.code !== 'PGRST116') {
        // Log error but don't block functionality (PGRST116 is "not found" which is expected)
        console.warn("Admin check failed:", adminError)
      }

      // Fetch user's properties if they're a landlord
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false })

      setProperties(propertiesData || [])

      // Fetch real notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError);
      } else {
        setNotifications(notificationsData || []);
      }
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

  const handleDeleteProperty = async (propertyId, imageUrl) => {
    // Confirm with the user before deleting
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      // 1. Delete the image from storage if it exists
      if (imageUrl) {
        const urlParts = imageUrl.split('/');
        // The file path is the last part of the URL after the bucket name
        const filePath = urlParts.slice(urlParts.indexOf('properties') + 1).join('/');
        
        const { error: storageError } = await supabase.storage
          .from('properties')
          .remove([`property-images/${filePath.split('/').pop()}`]); // Reconstruct path precisely

        if (storageError) {
          console.error("Error deleting image from storage:", storageError);
          // Don't block UI on storage error, but log it. The db record is more important.
        }
      }

      // 2. Delete the property record from the database
      const { error: dbError } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (dbError) throw dbError;

      // 3. Update the UI by removing the deleted property from the state
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
      alert("Property deleted successfully.");

    } catch (error) {
      console.error("Error deleting property:", error);
      alert("An error occurred while deleting the property. Please try again.");
    }
  };

  const markAsUnavailable = async (propertyId) => {
    try {
      const { error } = await supabase.from("properties").update({ available: false }).eq("id", propertyId)

      if (error) throw error

      setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, available: false } : p)))
    } catch (error) {
      console.error("Error updating property:", error)
    }
  }

  const getVerificationStatus = () => {
    if (!userProfile?.verification_status || userProfile.verification_status === 'unverified') {
      return {
        status: 'unverified',
        label: 'Unverified',
        description: 'You need to verify your account to list properties',
        icon: AlertCircle,
        color: 'destructive'
      }
    }
    
    if (userProfile.verification_status === 'basic_verified') {
      return {
        status: 'basic',
        label: 'Basic Verified',
        description: 'You can list up to 2 properties',
        icon: CheckCircle,
        color: 'default'
      }
    }
    
    if (userProfile.verification_status === 'fully_verified') {
      return {
        status: 'full',
        label: 'Fully Verified',
        description: 'You can list unlimited properties',
        icon: CheckCircle,
        color: 'default'
      }
    }

    return {
      status: 'pending',
      label: 'Pending Review',
      description: 'Your verification is being reviewed',
      icon: Clock,
      color: 'secondary'
    }
  }

  const canListProperties = () => {
    const userType = user?.user_metadata?.user_type || "tenant"
    const verificationInfo = getVerificationStatus()
    
    return userType === "landlord" && 
           (verificationInfo.status === 'basic' || verificationInfo.status === 'full')
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const userType = user?.user_metadata?.user_type || "tenant"
  const verificationInfo = getVerificationStatus()
  const StatusIcon = verificationInfo.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-gray-900">
                RentDirect
              </Link>
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="outline">
                  {userType === "landlord" ? "Landlord" : "Tenant"}
                </Badge>
                {userType === "landlord" && !isAdmin && (
                  <Badge variant={verificationInfo.color} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {verificationInfo.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-sm text-gray-600">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </span>
              <Link href="/dashboard/wallet">
                <Button variant="outline" size="sm">
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/admin/verification">
                  <Button size="sm">Admin Panel</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
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
                    ₦{properties.reduce((sum, p) => sum + (p.available ? 0 : p.rent), 0)}
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

            {isAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>Access the admin panel to manage the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/verification">
                    <Button>
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Verifications
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : userType === "landlord" && !isAdmin && (
              <>
                {verificationInfo.status === 'unverified' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Get Verified
                      </CardTitle>
                      <CardDescription>
                        Complete verification to start listing your properties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VerificationRequest 
                        user={{...userProfile, isAdmin}}
                        onVerificationUpdate={() => fetchUserData(user)}
                      />
                    </CardContent>
                  </Card>
                )}

                {canListProperties() && (
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

                {verificationInfo.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Verification in Progress
                      </CardTitle>
                      <CardDescription>
                        Your verification request is being reviewed. This typically takes 2-3 business days.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span>Under Review</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold">My Properties</h2>
              {canListProperties() && (
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
                  {userType === "landlord" && !canListProperties() && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">You need to verify your account to list properties</p>
                      <VerificationRequest 
                        user={{...userProfile, isAdmin}}
                        onVerificationUpdate={() => fetchUserData(user)}
                      />
                    </div>
                  )}
                  {canListProperties() && (
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
                    <Link href={`/property/${property.id}`} className="block">
                      <img
                        src={property.image_url || "/placeholder-property-v2.jpg"}
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    </Link>
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
                           ₦{property.rent}/month
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Link href={`/property/${property.id}`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProperty(property.id, property.image_url)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                      {property.available && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsUnavailable(property.id)}
                          className="w-full mt-2"
                        >
                          Mark as Rented
                        </Button>
                      )}
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
                  <p className="text-gray-500">No new notifications</p>
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
                              notification.type === "verification_approved" ? "bg-green-100" : 
                              notification.type === "verification_rejected" ? "bg-red-100" :
                              notification.type === "inquiry" ? "bg-blue-100" : "bg-orange-100"
                            }`}
                          >
                            <Bell
                              className={`h-4 w-4 ${
                                notification.type === "verification_approved" ? "text-green-600" : 
                                notification.type === "verification_rejected" ? "text-red-600" :
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
