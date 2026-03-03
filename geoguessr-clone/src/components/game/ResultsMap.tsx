"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Guess, Player } from '@/store/gameStore'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

const ActualLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ResultsMapProps {
  actualLat: number;
  actualLng: number;
  guesses: Guess[];
  players: Player[];
}

export function ResultsMap({ actualLat, actualLng, guesses, players }: ResultsMapProps) {
  const [mapReady, setMapReady] = useState(false)

  // Use a slight bounds logic to center map initially
  const center: [number, number] = [actualLat, actualLng]
  const actualPos: [number, number] = [actualLat, actualLng]

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!mapReady) return null

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={3}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* The actual location */}
        <Marker position={actualPos} icon={ActualLocationIcon}>
           <Tooltip permanent direction="top" className="font-bold text-red-600 bg-white/90 border-0 rounded shadow">Actual Location</Tooltip>
        </Marker>

        {/* The players' guesses */}
        {guesses.map(guess => {
          const playerPos: [number, number] = [guess.lat, guess.lng]
          const player = players.find(p => p.id === guess.player_id)

          return (
            <div key={guess.id}>
              <Marker position={playerPos}>
                <Tooltip permanent direction="bottom" className="font-semibold">{player?.nickname} ({guess.score})</Tooltip>
              </Marker>

              <Polyline positions={[actualPos, playerPos]} color="gray" dashArray="5, 10" weight={2} opacity={0.6} />
            </div>
          )
        })}

      </MapContainer>
    </div>
  )
}
