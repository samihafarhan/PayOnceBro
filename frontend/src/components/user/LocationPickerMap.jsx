// frontend/src/components/user/LocationPickerMap.jsx
//
// Opens a full OpenStreetMap modal. User clicks anywhere to drop a pin.
// No API key required — Leaflet + OpenStreetMap is completely free.
//
// Props:
//   isOpen          - boolean
//   onClose         - () => void
//   onConfirm       - ({ lat, lng }) => void
//   initialLocation - { lat, lng } | null

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon URLs (Vite strips them at build time)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Listens for map clicks and updates the selected location
const ClickHandler = ({ onSelect }) => {
  useMapEvents({ click: (e) => onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

// Pans the map when selected location changes (e.g. preset buttons)
const MapPanner = ({ location }) => {
  const map = useMap()
  useEffect(() => {
    if (location) map.setView([location.lat, location.lng], map.getZoom())
  }, [location, map])
  return null
}

// Quick-jump presets for common Dhaka neighbourhoods
const PRESETS = [
  { label: 'Dhanmondi',  lat: 23.7461, lng: 90.3742 },
  { label: 'Gulshan',    lat: 23.7925, lng: 90.4078 },
  { label: 'Mirpur',     lat: 23.8223, lng: 90.3654 },
  { label: 'Uttara',     lat: 23.8759, lng: 90.3795 },
  { label: 'Motijheel',  lat: 23.7330, lng: 90.4182 },
]

const DEFAULT_LOCATION = { lat: 23.7808, lng: 90.4015 } // Dhaka centre

const LocationPickerMap = ({ isOpen, onClose, onConfirm, initialLocation }) => {
  const [selected, setSelected] = useState(initialLocation ?? DEFAULT_LOCATION)

  useEffect(() => {
    if (isOpen) setSelected(initialLocation ?? DEFAULT_LOCATION)
  }, [isOpen, initialLocation])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Pick your delivery location</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click anywhere on the map — restaurants will be generated around your pin.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-3">×</button>
        </div>

        {/* Quick-jump presets */}
        <div className="px-5 py-2 border-b border-gray-100 flex gap-2 flex-wrap">
          <span className="text-xs text-gray-400 self-center">Jump to:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelected({ lat: p.lat, lng: p.lng })}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Map */}
        <div className="h-72 sm:h-80 w-full relative">
          <MapContainer
            center={[selected.lat, selected.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onSelect={setSelected} />
            <MapPanner location={selected} />
            <Marker position={[selected.lat, selected.lng]}>
              <Popup>Your location 📍</Popup>
            </Marker>
          </MapContainer>

          {/* Click hint */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <span className="bg-white/90 text-xs text-gray-600 px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
              👆 Click anywhere to drop your pin
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-mono">
            📍 {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(selected); onClose() }}
              className="px-5 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 active:scale-95 transition-all shadow-sm shadow-orange-200"
            >
              Confirm Location ✓
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LocationPickerMap