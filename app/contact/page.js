"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-lg text-gray-600 mt-2">We'd love to hear from you. Reach out with any questions or feedback.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input id="name" type="text" placeholder="John Doe" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <Textarea id="message" placeholder="Your message here..." rows={6} />
            </div>
            <Button type="submit" className="w-full">Submit</Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                <div className="space-y-4 text-gray-700">
                    <div className="flex items-center">
                        <Mail className="h-6 w-6 mr-4 text-primary" />
                        <span>support@rentdirect.com</span>
                    </div>
                    <div className="flex items-center">
                        <Phone className="h-6 w-6 mr-4 text-primary" />
                        <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-start">
                        <MapPin className="h-6 w-6 mr-4 text-primary mt-1" />
                        <span>123 Rental Ave, Suite 100<br/>Real Estate City, 12345</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
} 