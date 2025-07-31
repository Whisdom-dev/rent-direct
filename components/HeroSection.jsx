"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export default function HeroSection() {
  const images = [
    "/blueprint1.jpg",
    "/blueprint2.jpeg",
    "/blueprint.jpg",
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Change every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[80vh] sm:min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden text-white">
      {/* Background images */}
      <div className="absolute inset-0 w-full h-full">
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
          Connect Directly with Landlords & Tenants
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8">
          No agents, no fees. Just direct connections for rental properties.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/list-property" passHref>
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              List Your Property
            </Button>
          </Link>
          <Link href="/properties" passHref>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
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
