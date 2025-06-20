"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LifeBuoy, BookOpen, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Support Center</h1>
            <p className="text-lg text-gray-600 mt-2">How can we help you today?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="mb-2 text-xl">FAQ</CardTitle>
                    <p className="text-gray-600 mb-4">Find quick answers to common questions in our frequently asked questions section.</p>
                    <Link href="/faq">
                        <Button variant="outline">Visit FAQ</Button>
                    </Link>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                        <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="mb-2 text-xl">Contact Us</CardTitle>
                    <p className="text-gray-600 mb-4">Get in touch with our support team directly for any assistance you need.</p>
                    <Link href="/contact">
                        <Button variant="outline">Contact Us</Button>
                    </Link>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-20 h-20 flex items-center justify-center">
                        <LifeBuoy className="h-10 w-10 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="mb-2 text-xl">Account Help</CardTitle>
                    <p className="text-gray-600 mb-4">Having trouble with your account? We're here to help you get back on track.</p>
                    <Link href="/dashboard">
                        <Button variant="outline">Go to Dashboard</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    </div>
  )
} 