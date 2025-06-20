import "./globals.css"
import FooterWrapper from "@/components/FooterWrapper"

export const metadata = {
  title: "RentDirect - Connect Landlords & Tenants Directly",
  description: "Skip the agents and connect directly with landlords and tenants for rental properties.",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <FooterWrapper />
      </body>
    </html>
  )
}
