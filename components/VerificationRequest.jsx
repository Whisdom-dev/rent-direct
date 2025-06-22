"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/ui/file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, Upload } from "lucide-react"

export default function VerificationRequest({ user, onVerificationUpdate }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [requestType, setRequestType] = useState("basic")
  const [documents, setDocuments] = useState({})
  const [formData, setFormData] = useState({
    phone_number: "",
    business_name: "",
    notes: ""
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDocumentUpload = async (file, documentType) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`
      const filePath = `verification-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath)

      setDocuments(prev => ({
        ...prev,
        [documentType]: publicUrl
      }))

      return publicUrl
    } catch (error) {
      console.error('Error uploading document:', error)
      setMessage('Error uploading document. Please try again.')
      return null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      console.log('📝 Submitting verification request for user:', user.id)
      
      // Update user profile with additional information
      const { error: profileError } = await supabase
        .from('users')
        .update({
          phone_number: formData.phone_number,
          business_name: formData.business_name,
          verification_notes: formData.notes
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('❌ Error updating user profile:', profileError)
        throw profileError
      }
      
      console.log('✅ User profile updated successfully')

      // Create verification request
      const requestData = {
        user_id: user.id,
        request_type: requestType,
        documents: documents,
        status: 'pending'
      }
      
      console.log('📋 Creating verification request with data:', requestData)
      
      const { error: requestError } = await supabase
        .from('verification_requests')
        .insert(requestData)

      if (requestError) {
        console.error('❌ Error creating verification request:', requestError)
        throw requestError
      }
      
      console.log('✅ Verification request created successfully')

      setMessage("Verification request submitted successfully! We'll review your documents within 2-3 business days.")
      if (onVerificationUpdate) {
        onVerificationUpdate()
      }
    } catch (error) {
      console.error('Error submitting verification request:', error)
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getVerificationStatus = () => {
    if (!user.verification_status || user.verification_status === 'unverified') {
      return {
        status: 'unverified',
        label: 'Unverified',
        description: 'You need to verify your account to list properties',
        icon: AlertCircle,
        color: 'destructive'
      }
    }
    
    if (user.verification_status === 'basic_verified') {
      return {
        status: 'basic',
        label: 'Basic Verified',
        description: 'You can list up to 2 properties',
        icon: CheckCircle,
        color: 'default'
      }
    }
    
    if (user.verification_status === 'fully_verified') {
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

  const verificationInfo = getVerificationStatus()
  const StatusIcon = verificationInfo.icon

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Verification Status
          </CardTitle>
          <CardDescription>
            {verificationInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={verificationInfo.color}>
            {verificationInfo.label}
          </Badge>
        </CardContent>
      </Card>

      {verificationInfo.status === 'unverified' && (
        <Card>
          <CardHeader>
            <CardTitle>Get Verified</CardTitle>
            <CardDescription>
              Complete verification to start listing your properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Verification Type</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Verification</SelectItem>
                    <SelectItem value="full">Full Verification</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {requestType === 'basic' 
                    ? 'Email + phone verification (up to 2 properties)'
                    : 'Document verification (unlimited properties)'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div>
                <Label htmlFor="business">Business Name (Optional)</Label>
                <Input
                  id="business"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Your business name if applicable"
                />
              </div>

              {requestType === 'full' && (
                <div className="space-y-4">
                  <div>
                    <Label>Government ID</Label>
                    <FileUpload
                      onFileSelect={(file) => handleDocumentUpload(file, 'government_id')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={5 * 1024 * 1024} // 5MB
                    />
                  </div>

                  <div>
                    <Label>Property Ownership Document</Label>
                    <FileUpload
                      onFileSelect={(file) => handleDocumentUpload(file, 'ownership_doc')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10 * 1024 * 1024} // 10MB
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Deed, title, or rental agreement showing ownership
                    </p>
                  </div>

                  <div>
                    <Label>Proof of Address</Label>
                    <FileUpload
                      onFileSelect={(file) => handleDocumentUpload(file, 'address_proof')}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={5 * 1024 * 1024} // 5MB
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information that might help with verification..."
                  rows={3}
                />
              </div>

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Verification Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {verificationInfo.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Verification in Progress</CardTitle>
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
    </div>
  )
} 