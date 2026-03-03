"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

interface LeafletMapProps {
  onGuessSubmit: (lat: number, lng: number) => void;
  disabled?: boolean;
}

function GuessMarker({ position, setPosition, disabled }: { position: [number, number] | null, setPosition: (p: [number, number]) => void, disabled: boolean }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        setPosition([e.latlng.lat, e.latlng.lng])
      }
    },
  })

  return position === null ? null : (
    <Marker position={position} />
  )
}

export function LeafletMap({ onGuessSubmit, disabled = false }: LeafletMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`absolute bottom-6 left-6 z-10 bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out border-2 border-white/50 ring-4 ring-black/10 ${
        expanded ? 'w-[400px] h-[300px] md:w-[500px] md:h-[400px]' : 'w-[150px] h-[150px] md:w-[200px] md:h-[200px] opacity-80 hover:opacity-100 cursor-pointer'
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="w-full h-full relative group">

        {/* Helper overlay when minimized */}
        {!expanded && (
           <div className="absolute inset-0 bg-black/10 z-10 flex flex-col items-center justify-center pointer-events-none transition-opacity group-hover:opacity-0">
             <MapPin className="w-8 h-8 text-black mb-1 drop-shadow-md" />
             <span className="text-black font-bold text-sm bg-white/50 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">Click Map</span>
           </div>
        )}

        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GuessMarker position={position} setPosition={setPosition} disabled={disabled} />
        </MapContainer>

        {expanded && position && !disabled && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-11/12">
            <Button
              size="lg"
              className="w-full font-black text-lg uppercase tracking-wider shadow-xl shadow-black/20"
              onClick={() => {
                 onGuessSubmit(position[0], position[1])
                 setExpanded(false)
              }}
            >
              GUESS
            </Button>
          </div>
        )}

        {disabled && expanded && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 border-4 border-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Waiting for others...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
