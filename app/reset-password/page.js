"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [session, setSession] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // This effect handles the session recovery from the password reset link
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSession(session)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    setMessage("")
    setError("")

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setMessage("Your password has been updated successfully. You can now sign in.")
      setTimeout(() => router.push("/auth"), 3000)
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
          <p className="mt-2 text-gray-600">Set your new password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Enter and confirm your new password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !password}>
                {loading ? "Updating..." : "Update Password"}
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
      </div>
    </div>
  )
} 