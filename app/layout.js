import "./globals.css"
import Footer from "@/components/Footer"

export const metadata = {
  title: "RentDirect - Connect Landlords & Tenants Directly",
  description: "Skip the agents and connect directly with landlords and tenants for rental properties.",
}

export function generateViewport() {
  return {
    themeColor: '#3b82f6',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
