"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Clock, Eye, User, FileText, Calendar } from "lucide-react"

export default function AdminVerificationPage() {
  const [user, setUser] = useState(null)
  const [verificationRequests, setVerificationRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }

    // Check if user is admin
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle to avoid error when no row is found

    if (error) {
      console.error("Error checking admin status:", error);
      alert('An error occurred while checking your admin status. Please try again.');
      router.push('/dashboard');
      return;
    }

    if (!adminUser) {
      alert('You do not have permission to access this page.')
      router.push("/dashboard")
      return
    }

    setUser(user)
    fetchVerificationRequests()
  }

  const fetchVerificationRequests = async () => {
    setLoading(true)
    try {
      // Call the secure database function to get all verification requests.
      const { data: rawData, error } = await supabase.rpc('get_all_verification_requests')

      if (error) {
        console.error('Error fetching verification requests via RPC:', error)
        throw error
      }

      // The RPC function returns a flat list, so we need to re-nest the user data
      // for the component to display it correctly without major rewrites.
      const formattedData = rawData.map(r => ({
        id: r.id,
        user_id: r.user_id,
        request_type: r.request_type,
        status: r.status,
        submitted_at: r.submitted_at,
        reviewed_at: r.reviewed_at,
        reviewed_by: r.reviewed_by,
        rejection_reason: r.rejection_reason,
        documents: r.documents,
        users: { // Re-nested user data
            id: r.user_id,
            name: r.user_name,
            email: r.user_email,
            phone_number: r.user_phone_number,
            business_name: r.user_business_name,
            verification_notes: r.user_verification_notes,
        }
      }));

      setVerificationRequests(formattedData || [])
    } catch (error) {
      alert("Failed to load verification requests. Check the console for more details.");
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId, requestUserId, requestType) => {
    setProcessing(true);
    const originalRequests = [...verificationRequests];
    setVerificationRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: 'approved' } : req
      )
    );
    try {
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', requestId)
      if (requestError) throw requestError
      const verificationStatus = requestType === 'basic' ? 'basic_verified' : 'fully_verified'
      const { error: userError } = await supabase
        .from('users')
        .update({
          verification_status: verificationStatus,
          verified_at: new Date().toISOString()
        })
        .eq('id', requestUserId)
      if (userError) throw userError
      // Try notification, but do not rollback if it fails
      const { error: notifError } = await supabase.rpc('create_notification_for_user', {
        target_user_id: requestUserId,
        message_text: `Congratulations! Your ${requestType} verification request has been approved. You can now start listing properties.`,
        notification_type: 'verification_approved',
        url: null
      });
      if (notifError) {
        console.error('Notification error:', notifError);
      }
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Error approving verification request')
      setVerificationRequests(originalRequests);
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (requestId, requestUserId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setProcessing(true);
    setSelectedRequest(null);
    const originalRequests = [...verificationRequests];
    setVerificationRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: 'rejected', rejection_reason: rejectionReason } : req
      )
    );
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason
        })
        .eq('id', requestId)
      if (error) throw error
      // Try notification, but do not rollback if it fails
      const { error: notifError } = await supabase.rpc('create_notification_for_user', {
        target_user_id: requestUserId,
        message_text: `Your verification request was rejected. Reason: ${rejectionReason}`,
        notification_type: 'verification_rejected',
        url: null
      });
      if (notifError) {
        console.error('Notification error:', notifError);
      }
      setRejectionReason("")
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Error rejecting verification request')
      setVerificationRequests(originalRequests);
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  const pendingRequests = verificationRequests.filter(r => r.status === 'pending')
  const approvedRequests = verificationRequests.filter(r => r.status === 'approved')
  const rejectedRequests = verificationRequests.filter(r => r.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Verification Management</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Verified landlords</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">Failed verification</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No pending verification requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {request.users?.name || 'Unknown User'}
                        </CardTitle>
                        <CardDescription>
                          {request.users?.email} • {request.request_type} verification
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Verification Request Details</DialogTitle>
                              <DialogDescription>
                                Review the verification request for {request.users?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>User Information</Label>
                                <div className="mt-2 space-y-2 text-sm">
                                  <p><strong>Name:</strong> {request.users?.name}</p>
                                  <p><strong>Email:</strong> {request.users?.email}</p>
                                  <p><strong>Phone:</strong> {request.users?.phone_number}</p>
                                  <p><strong>Business:</strong> {request.users?.business_name || 'N/A'}</p>
                                  <p><strong>Request Type:</strong> {request.request_type}</p>
                                  <p><strong>Submitted:</strong> {formatDate(request.submitted_at)}</p>
                                </div>
                              </div>

                              {request.users?.verification_notes && (
                                <div>
                                  <Label>Additional Notes</Label>
                                  <p className="mt-2 text-sm text-gray-600">{request.users.verification_notes}</p>
                                </div>
                              )}

                              {request.documents && Object.keys(request.documents).length > 0 && (
                                <div>
                                  <Label>Documents</Label>
                                  <div className="mt-2 space-y-2">
                                    {Object.entries(request.documents).map(([type, url]) => (
                                      <div key={type} className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <a 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {type.replace('_', ' ').toUpperCase()}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-4">
                                <Button 
                                  onClick={() => handleApprove(request.id, request.user_id, request.request_type)}
                                  disabled={processing}
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="destructive" className="flex-1">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Verification Request</DialogTitle>
                                      <DialogDescription>
                                        Please provide a reason for rejection
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                                        <Textarea
                                          id="rejection-reason"
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Explain why this verification request is being rejected..."
                                          rows={4}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          onClick={() => handleReject(request.id, request.user_id)}
                                          disabled={processing || !rejectionReason.trim()}
                                          variant="destructive"
                                          className="flex-1"
                                        >
                                          Confirm Rejection
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {request.users?.name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription>
                        {request.users?.email} • {request.request_type} verification • Approved {formatDate(request.reviewed_at)}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {request.users?.name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription>
                        {request.users?.email} • {request.request_type} verification • Rejected {formatDate(request.reviewed_at)}
                      </CardDescription>
                      {request.rejection_reason && (
                        <p className="text-sm text-red-600 mt-2">
                          <strong>Reason:</strong> {request.rejection_reason}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 