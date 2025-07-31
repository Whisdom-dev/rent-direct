"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export default function HeroSection() {
  const images = [
    "/hero1.jpg",
    "/hero2.jpg",
    "/hero3.jpg",
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] overflow-hidden text-white flex items-center justify-center">
      {/* Background images */}
      <div className="absolute inset-0 w-full h-full">
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index}`}
            className={`absolute w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Connect Directly with Landlords & Tenants
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          No agents, no fees. Just direct connections for rental properties.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/list-property">
            <Button size="lg" variant="secondary">
              <Plus className="h-5 w-5 mr-2" />
              List Your Property
            </Button>
          </Link>
          <Link href="/properties">
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Rentals
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
