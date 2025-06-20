"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const hideFooter = pathname.startsWith("/auth") || pathname.startsWith("/register");
  return !hideFooter ? <Footer /> : null;
} 