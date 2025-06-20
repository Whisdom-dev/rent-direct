"use client"
import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Footer() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <footer className="bg-zinc-900 text-zinc-200 border-t border-zinc-800 py-10 px-4 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <h2 className="text-lg text-white font-bold mb-3 tracking-wide text-primary">RENTAL PLATFORM</h2>
          <p className="text-sm mb-2">Find, list, and manage rental properties with ease. Connecting tenants and landlords for a better rental experience.</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="inline-block w-5 h-3 bg-green-600 rounded-sm"></span>
            <span className="text-xs">Nigeria (NGN ₦)</span>
          </div>
        </div>
        {/* Customer Service */}
        <div>
          <h3 className="font-semibold mb-3">Customer Service</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
            <li><Link href="/support" className="hover:text-white transition">Support</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
          </ul>
        </div>
        {/* Account */}
        <div>
          <h3 className="font-semibold mb-3">Account</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
            <li><Link href="/dashboard/my-listings" className="hover:text-white transition">My Listings</Link></li>
            <li><Link href="/dashboard/favorites" className="hover:text-white transition">Favorites</Link></li>
            <li><button onClick={handleLogout} className="hover:text-white transition text-left w-full">Logout</button></li>
          </ul>
        </div>
        {/* Newsletter */}
        <div>
          <h3 className="font-semibold mb-3">Newsletter</h3>
          <p className="text-sm mb-2">Get rental tips, updates, and exclusive offers. Join our community!</p>
          <form className="flex flex-col gap-2 mt-2">
            <input
              type="email"
              placeholder="E-mail"
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-white font-semibold py-2 rounded hover:bg-primary/90 transition"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>
      <div className="text-center text-xs text-zinc-500 mt-10">
        &copy; {new Date().getFullYear()} - Rental Platform. All rights reserved.
      </div>
    </footer>
  );
} 