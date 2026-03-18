// frontend/src/components/user/LocationPickerMap.jsx
//
// Map modal for picking a delivery location.
// Now shows all 8 demo restaurants as colour-coded markers:
//   🟢 Green markers  = Cluster A restaurants (close together, NE)
//   🟣 Violet markers = Cluster B restaurants (close together, SW)
//   ⚫ Grey markers   = Standalone restaurants (too far to cluster)
//
// Dashed lines connect restaurants in the same cluster.
// All markers move in sync when the user moves their pin.
// Map auto-fits to show all markers on open.
//
// Props:
//   isOpen          - boolean
//   onClose         - () => void
//   onConfirm       - (location: { lat, lng }) => void
//   initialLocation - { lat, lng } | null

import { useState, useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import {
  generateRestaurants,
  allPairsWithinRadius,
  CLUSTER_COLORS,
} from '../../utils/demoRestaurants'

// ─── Fix Leaflet icon paths broken by Vite ───────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Custom marker icons ─────────────────────────────────────────────────────

// User location: orange pulsing pin
const makeUserIcon = () => L.divIcon({
  className: '',
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
  html: `
    <div style="position:relative;width:40px;height:40px;">
      <div style="
        position:absolute;inset:0;
        border-radius:50%;
        background:rgba(249,115,22,0.25);
        animation:pulse 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:6px;
        background:#f97316;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:13px;line-height:1;
      ">📍</div>
    </div>
    <style>
      @keyframes pulse {
        0%   { transform:scale(1);   opacity:.6 }
        100% { transform:scale(2.2); opacity:0  }
      }
    </style>
  `,
})

// Restaurant: solid circle with emoji, colour = cluster colour or grey
const makeRestaurantIcon = (emoji, color) => L.divIcon({
  className: '',
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
  html: `
    <div style="
      width:36px;height:36px;
      background:${color};
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;line-height:1;
    ">${emoji}</div>
  `,
})

// ─── Sub-component: map click → fire onSelect ─────────────────────────────────
const ClickHandler = ({ onSelect }) => {
  useMapEvents({ click: (e) => onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

// ─── Sub-component: auto-fit bounds to show all markers ──────────────────────
const BoundsFitter = ({ positions }) => {
  const map = useMap()
  useEffect(() => {
    if (!positions || positions.length === 0) return
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14 })
  }, [positions, map])
  return null
}

// ─── Preset quick-jump buttons ───────────────────────────────────────────────
const PRESETS = [
  { label: 'Dhanmondi', lat: 23.7461, lng: 90.3742 },
  { label: 'Gulshan',   lat: 23.7925, lng: 90.4078 },
  { label: 'Mirpur',    lat: 23.8223, lng: 90.3654 },
  { label: 'Uttara',    lat: 23.8759, lng: 90.3795 },
  { label: 'Motijheel', lat: 23.7330, lng: 90.4182 },
  { label: 'Mohakhali', lat: 23.7808, lng: 90.4015 },
]

const DEFAULT_LOCATION = { lat: 23.7808, lng: 90.4015 }

// ─── Main component ───────────────────────────────────────────────────────────
const LocationPickerMap = ({ isOpen, onClose, onConfirm, initialLocation }) => {
  const [selected, setSelected] = useState(initialLocation ?? DEFAULT_LOCATION)

  useEffect(() => {
    if (isOpen) setSelected(initialLocation ?? DEFAULT_LOCATION)
  }, [isOpen, initialLocation])

  // Generate restaurant positions whenever selected changes.
  // useMemo so we don't regenerate on every render tick.
  const restaurants = useMemo(
    () => generateRestaurants(selected.lat, selected.lng),
    [selected.lat, selected.lng]
  )

  // Group restaurants into clusters (same logic as NearbyRestaurantsView)
  const clusterGroups = useMemo(() => {
    const byGroup = {}
    restaurants.forEach((r) => {
      if (!r.group) return
      if (!byGroup[r.group]) byGroup[r.group] = []
      byGroup[r.group].push(r)
    })
    return Object.entries(byGroup).filter(([, rs]) => allPairsWithinRadius(rs, 2))
  }, [restaurants])

  // All marker positions for auto-fit (user + all restaurants)
  const allPositions = useMemo(() => [
    [selected.lat, selected.lng],
    ...restaurants.map((r) => [r.lat, r.lng]),
  ], [selected, restaurants])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base">
              Pick your delivery location
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click anywhere to move your pin. Restaurants update live around it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4
                       transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ── Quick-jump presets ───────────────────────────────────── */}
        <div className="px-5 py-2 border-b border-gray-100 flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-400 shrink-0">Jump to:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSelected({ lat: p.lat, lng: p.lng })}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-600
                         hover:bg-orange-50 hover:border-orange-400 hover:text-orange-700
                         transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Map ─────────────────────────────────────────────────── */}
        <div className="h-80 sm:h-96 w-full relative">
          <MapContainer
            center={[selected.lat, selected.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Re-fit bounds whenever markers change */}
            <BoundsFitter positions={allPositions} />

            {/* Map click handler */}
            <ClickHandler onSelect={setSelected} />

            {/* ── User location marker ─────────────────────────── */}
            <Marker
              position={[selected.lat, selected.lng]}
              icon={makeUserIcon()}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-gray-900">📍 Your location</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click anywhere to move this pin
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* ── Dashed lines connecting cluster members ──────── */}
            {clusterGroups.map(([groupId, rs]) => (
              <Polyline
                key={`cluster-line-${groupId}`}
                positions={rs.map((r) => [r.lat, r.lng])}
                pathOptions={{
                  color: CLUSTER_COLORS[groupId] ?? '#6b7280',
                  weight: 2,
                  dashArray: '6 5',
                  opacity: 0.7,
                }}
              />
            ))}

            {/* ── Restaurant markers ────────────────────────────── */}
            {restaurants.map((r) => {
              const color = r.group
                ? (CLUSTER_COLORS[r.group] ?? '#6b7280')
                : '#9ca3af'

              return (
                <Marker
                  key={r.id}
                  position={[r.lat, r.lng]}
                  icon={makeRestaurantIcon(r.emoji, color)}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      {/* Name + cluster badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{r.emoji}</span>
                        <span className="font-bold text-gray-900">{r.name}</span>
                      </div>

                      {r.group ? (
                        <span
                          className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5"
                          style={{
                            background: CLUSTER_COLORS[r.group] + '22',
                            color: CLUSTER_COLORS[r.group],
                            border: `1px solid ${CLUSTER_COLORS[r.group]}44`,
                          }}
                        >
                          🔗 Cluster {r.group}
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold text-gray-500
                                         bg-gray-100 border border-gray-200 px-2 py-0.5
                                         rounded-full mb-1.5">
                          🚚 Standard
                        </span>
                      )}

                      <p className="text-xs text-gray-500">{r.tagline}</p>

                      <div className="mt-1.5 pt-1.5 border-t border-gray-100
                                      flex items-center gap-3 text-xs text-gray-500">
                        <span>📍 {r.distanceKm} km away</span>
                        <span>⭐ {r.avgRating}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* ── Map legend (bottom-left corner) ──────────────────── */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm
                          rounded-xl shadow-lg border border-gray-200 px-3 py-2.5
                          pointer-events-none">
            <p className="text-xs font-bold text-gray-600 mb-1.5">Map legend</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block shrink-0" />
                Your location
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full inline-block shrink-0"
                      style={{ background: CLUSTER_COLORS.A }} />
                Cluster A restaurants
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full inline-block shrink-0"
                      style={{ background: CLUSTER_COLORS.B }} />
                Cluster B restaurants
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full bg-gray-400 inline-block shrink-0" />
                Standard delivery only
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-5 h-0.5 inline-block"
                      style={{ background: CLUSTER_COLORS.A,
                               backgroundImage: 'repeating-linear-gradient(90deg,#059669 0,#059669 4px,transparent 4px,transparent 8px)' }} />
                Within cluster radius
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center
                        justify-between gap-3">
          <span className="text-xs text-gray-500 font-mono">
            📍 {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600
                         hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(selected); onClose() }}
              className="px-5 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold
                         hover:bg-orange-600 active:scale-95 transition-all
                         shadow-sm shadow-orange-200"
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