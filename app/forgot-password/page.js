"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    // The redirect URL should point to your new password page
    const redirectUrl = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("If an account exists for this email, a password reset link has been sent.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
                RentDirect
            </Link>
            <p className="mt-2 text-gray-600">Reset your password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            {message && (
                <div className="mt-4 p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">
                    {message}
                </div>
            )}
            {error && (
                <div className="mt-4 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                    {error}
                </div>
            )}
          </CardContent>
        </Card>
        <div className="text-center">
            <Link href="/auth" passHref>
                <Button variant="link" className="text-sm">
                    <ArrowLeft className="h-4 w-4 mr-1"/>
                    Back to Sign In
                </Button>
            </Link>
        </div>
      </div>
    </div>
  )
} 