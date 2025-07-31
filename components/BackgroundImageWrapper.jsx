"use client"
import { usePathname } from "next/navigation"

export default function BackgroundImageWrapper({ children }) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  return (
    <div className={isHome ? "relative min-h-screen flex flex-col" : "bg-white min-h-screen flex flex-col"}>
      {isHome && (
        <>
          <img
            src="/placeholder-property-v2.jpg"
            alt="Background"
            className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
            style={{ opacity: 0.18 }}
          />
          <div className="fixed inset-0 bg-gradient-to-b from-black/40 to-white/10 z-0 pointer-events-none select-none" />
        </>
      )}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
} 