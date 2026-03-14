"use client"

import { useEffect, useRef } from 'react'
import { Viewer } from 'mapillary-js'
import 'mapillary-js/dist/mapillary.css'

interface MapillaryViewerProps {
  imageId: string;
}

export function MapillaryViewer({ imageId }: MapillaryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)

  useEffect(() => {
    if (!containerRef.current || !imageId) return

    if (!viewerRef.current) {
      viewerRef.current = new Viewer({
        accessToken: process.env.NEXT_PUBLIC_MAPILLARY_CLIENT_TOKEN || 'MLY|9009855529068598|0b47d3c01c0c6c1e550e203023812845',
        container: containerRef.current,
        imageId: imageId,
        component: { cover: false, sequence: true, direction: true },
      })
    } else {
      viewerRef.current.moveTo(imageId).catch((error) => console.warn(error))
    }

    return () => {
      // Keep viewer alive or destroy if component unmounts
      if (viewerRef.current) {
        // viewerRef.current.remove() // sometimes causes issues with mapillary-js fast re-renders
      }
    }
  }, [imageId])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-slate-900 z-0"
      style={{ minHeight: '100vh' }}
    />
  )
}
