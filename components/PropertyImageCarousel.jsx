"use client"
import React, { useRef, useState, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { motion, AnimatePresence } from "framer-motion"

export default function PropertyImageCarousel({ images = [] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const scrollTo = useCallback((idx) => {
    if (emblaApi) emblaApi.scrollTo(idx)
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    return () => emblaApi.off("select", onSelect)
  }, [emblaApi, onSelect])

  if (!images.length) return null

  return (
    <div>
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {images.map((img, idx) => (
            <motion.div
              key={img}
              className="min-w-0 flex-[0_0_100%] cursor-pointer relative"
              whileHover={{ scale: 0.98 }}
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={img}
                alt={`Property image ${idx + 1}`}
                className="w-full h-80 object-cover select-none"
                draggable={false}
              />
              {selectedIndex === idx && (
                <motion.div layoutId="carousel-indicator" className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {idx + 1} / {images.length}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 w-2 rounded-full ${selectedIndex === idx ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => scrollTo(idx)}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
          >
            <motion.img
              src={images[selectedIndex]}
              alt={`Property image ${selectedIndex + 1}`}
              className="max-w-3xl max-h-[80vh] rounded shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 