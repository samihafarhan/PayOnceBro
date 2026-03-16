// frontend/src/pages/user/Search.jsx
//
// Two-tab page:
//   Tab 1 "Food Search"      — original search behaviour, now writes to CartContext
//   Tab 2 "Nearby & Clustering" — map location picker + clustered/standard restaurant view

import { useState, useEffect, useCallback } from 'react'
import SearchBar from '../../components/user/SearchBar'
import FoodCard from '../../components/user/FoodCard'
import LocationPickerMap from '../../components/user/LocationPickerMap'
import NearbyRestaurantsView from '../../components/user/NearbyRestaurantsView'
import { searchFood, getCategories as fetchApiCategories } from '../../services/searchService'
import { useCart } from '../../context/CartContext'

// ─── Dummy data (used when backend is unreachable) ────────────────────────────
const DUMMY_RESTAURANTS = {
  r1: { id: 'r1', name: 'Burger Barn',    address: '12 Main Street, Dhaka',  lat: 23.8103, lng: 90.4125, avgRating: 4.5, avgPrepTime: 20 },
  r2: { id: 'r2', name: 'Pizza Palace',   address: '34 Ring Road, Dhaka',    lat: 23.8121, lng: 90.4140, avgRating: 4.2, avgPrepTime: 25 },
  r3: { id: 'r3', name: 'Noodle Nirvana', address: '56 Lake View, Dhaka',    lat: 23.8110, lng: 90.4132, avgRating: 4.7, avgPrepTime: 15 },
  r4: { id: 'r4', name: 'Spice Garden',   address: '78 Green Road, Dhaka',   lat: 23.8500, lng: 90.4300, avgRating: 4.0, avgPrepTime: 30 },
  r5: { id: 'r5', name: 'Sweet Tooth',    address: '90 Gulshan Ave, Dhaka',  lat: 23.8600, lng: 90.4150, avgRating: 4.8, avgPrepTime: 10 },
}
const DUMMY_ITEMS = [
  { id: 'm1',  restaurantId: 'r1', name: 'Classic Beef Burger',   description: 'Juicy beef patty, cheddar, lettuce, tomato.',   price: 180, category: 'burger',  aiTags: ['halal'] },
  { id: 'm2',  restaurantId: 'r1', name: 'Double Smash Burger',   description: 'Two smashed patties, double cheese, pickles.',  price: 260, category: 'burger',  aiTags: ['halal', 'high-protein'] },
  { id: 'm3',  restaurantId: 'r1', name: 'Crispy Chicken Burger', description: 'Fried chicken thigh, coleslaw, sriracha mayo.', price: 200, category: 'burger',  aiTags: ['halal', 'spicy'] },
  { id: 'm4',  restaurantId: 'r1', name: 'Veggie Burger',         description: 'Black bean patty, avocado, roasted peppers.',   price: 160, category: 'burger',  aiTags: ['vegan', 'vegetarian'] },
  { id: 'm5',  restaurantId: 'r1', name: 'Loaded Fries',          description: 'Fries with cheese sauce and jalapeños.',        price: 120, category: 'sides',   aiTags: ['spicy'] },
  { id: 'm6',  restaurantId: 'r2', name: 'Margherita Pizza',      description: 'Tomato base, mozzarella, basil.',              price: 220, category: 'pizza',   aiTags: ['vegetarian'] },
  { id: 'm7',  restaurantId: 'r2', name: 'BBQ Chicken Pizza',     description: 'BBQ sauce, grilled chicken, smoked cheddar.',  price: 300, category: 'pizza',   aiTags: ['halal'] },
  { id: 'm8',  restaurantId: 'r2', name: 'Pepperoni Feast',       description: 'Double pepperoni, mozzarella, oregano.',       price: 320, category: 'pizza',   aiTags: ['spicy'] },
  { id: 'm9',  restaurantId: 'r3', name: 'Beef Ramen',            description: 'Rich broth, thick noodles, chashu beef.',      price: 250, category: 'noodles', aiTags: ['halal', 'high-protein'] },
  { id: 'm10', restaurantId: 'r3', name: 'Pad Thai',              description: 'Stir-fried noodles, shrimp, tofu, peanuts.',   price: 190, category: 'noodles', aiTags: ['gluten-free'] },
  { id: 'm11', restaurantId: 'r4', name: 'Chicken Biryani',       description: 'Aromatic basmati rice with tender chicken.',   price: 210, category: 'rice',    aiTags: ['halal', 'spicy'] },
  { id: 'm12', restaurantId: 'r4', name: 'Dal Makhani',           description: 'Creamy black lentils, butter and spices.',     price: 130, category: 'curry',   aiTags: ['vegetarian'] },
  { id: 'm13', restaurantId: 'r5', name: 'Chocolate Lava Cake',   description: 'Warm cake, molten centre, vanilla ice cream.', price: 150, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
  { id: 'm14', restaurantId: 'r5', name: 'Oreo Milkshake',        description: 'Thick blended shake with Oreo and vanilla.',   price: 110, category: 'dessert', aiTags: ['vegetarian', 'sweet'] },
]
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
const CLUSTER_RADIUS_KM = 2
const searchLocally = (query='', filters={}, userLocation=null) => {
  const {minPrice,maxPrice,cuisine} = filters
  const q = query.trim().toLowerCase()
  let results = DUMMY_ITEMS
  if (q) results = results.filter(i=>i.name.toLowerCase().includes(q)||i.description.toLowerCase().includes(q)||i.category.toLowerCase().includes(q)||i.aiTags.some(t=>t.includes(q)))
  if (minPrice) results = results.filter(i=>i.price>=Number(minPrice))
  if (maxPrice) results = results.filter(i=>i.price<=Number(maxPrice))
  if (cuisine) results = results.filter(i=>i.category.toLowerCase()===cuisine.toLowerCase())
  return results.map(item=>{
    const restaurant = DUMMY_RESTAURANTS[item.restaurantId]
    let distanceKm=null, isClusterEligible=false
    if (userLocation&&restaurant?.lat&&restaurant?.lng) {
      distanceKm = haversineDistance(userLocation.lat,userLocation.lng,restaurant.lat,restaurant.lng)
      isClusterEligible = distanceKm<=CLUSTER_RADIUS_KM
    } else { isClusterEligible = ['r1','r2','r3'].includes(item.restaurantId) }
    return { menuItem:{id:item.id,name:item.name,description:item.description,price:item.price,category:item.category,aiTags:item.aiTags,restaurantId:item.restaurantId}, restaurant, distanceKm, isClusterEligible }
  }).sort((a,b)=>{
    if (a.isClusterEligible&&!b.isClusterEligible) return -1
    if (!a.isClusterEligible&&b.isClusterEligible) return 1
    if (a.distanceKm!==null&&b.distanceKm!==null) return a.distanceKm-b.distanceKm
    return a.menuItem.price-b.menuItem.price
  })
}
const ALL_CATEGORIES = [...new Set(DUMMY_ITEMS.map(i=>i.category))].sort()

// ─── Main Component ───────────────────────────────────────────────────────────

const Search = () => {
  // Tab: 'search' | 'nearby'
  const [activeTab, setActiveTab]   = useState('search')

  // Map picker
  const [showMap, setShowMap]       = useState(false)
  const [mapLocation, setMapLocation] = useState(null) // { lat, lng }

  // Food search state
  const [results, setResults]               = useState([])
  const [hasSearched, setHasSearched]       = useState(false)
  const [lastQuery, setLastQuery]           = useState('')
  const [userLocation, setUserLocation]     = useState(null)
  const [cartNotif, setCartNotif]           = useState(null)
  const [searchLoading, setSearchLoading]   = useState(false)
  const [categories, setCategories]         = useState(ALL_CATEGORIES)
  const [isDemoMode, setIsDemoMode]         = useState(false)

  // Global cart
  const { addItem, itemCount, total: cartTotal } = useCart()

  // Load categories from API
  useEffect(() => {
    fetchApiCategories().then(cats=>{if(cats?.length)setCategories(cats)}).catch(()=>{})
  }, [])

  // Initial food search
  useEffect(() => {
    setSearchLoading(true)
    searchFood('',{})
      .then(({results:r})=>{setResults(r);setIsDemoMode(false)})
      .catch(()=>{setResults(searchLocally('',{},null));setIsDemoMode(true)})
      .finally(()=>setSearchLoading(false))
  }, [])

  const handleSearch = useCallback(async (query, filters) => {
    setLastQuery(query); setHasSearched(true); setSearchLoading(true)
    const loc = filters.userLat&&filters.userLng ? {lat:Number(filters.userLat),lng:Number(filters.userLng)} : userLocation
    if (filters.userLat&&filters.userLng) setUserLocation(loc)
    try {
      const {results:r} = await searchFood(query,filters)
      setResults(r); setIsDemoMode(false)
    } catch { setResults(searchLocally(query,filters,loc)); setIsDemoMode(true) }
    finally { setSearchLoading(false) }
  }, [userLocation])

  const handleAddToCart = (item) => {
    addItem(
      { id: item.menuItem.id, name: item.menuItem.name, price: item.menuItem.price, restaurantId: item.restaurant.id },
      { id: item.restaurant.id, name: item.restaurant.name }
    )
    setCartNotif(`${item.menuItem.name} added! 🛒`)
    setTimeout(()=>setCartNotif(null), 2500)
  }

  // When user confirms map location → switch to nearby tab
  const handleMapConfirm = (loc) => { setMapLocation(loc); setActiveTab('nearby') }

  const groups = Object.values(
    results.reduce((acc,item)=>{
      const id=item.restaurant.id
      if (!acc[id]) acc[id]={restaurant:item.restaurant,items:[],hasCluster:false}
      acc[id].items.push(item)
      if (item.isClusterEligible) acc[id].hasCluster=true
      return acc
    },{})
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Map picker modal */}
      <LocationPickerMap
        isOpen={showMap}
        onClose={()=>setShowMap(false)}
        onConfirm={handleMapConfirm}
        initialLocation={mapLocation}
      />

      {/* Cart toast */}
      {cartNotif && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl">
          {cartNotif}
        </div>
      )}

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Tabs */}
          <div className="flex items-center gap-1 pt-3">
            <button
              onClick={()=>setActiveTab('search')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab==='search' ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              🔍 Food Search
            </button>
            <button
              onClick={()=>setActiveTab('nearby')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${activeTab==='nearby' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              🔗 Nearby &amp; Clustering
              {mapLocation && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Location set" />}
            </button>
          </div>

          {/* Search bar — food search tab only */}
          {activeTab==='search' && (
            <div className="py-3">
              <SearchBar onSearch={handleSearch} categories={categories} loading={searchLoading} />
            </div>
          )}

          {/* Location bar — nearby tab only */}
          {activeTab==='nearby' && (
            <div className="py-3 flex items-center gap-3 flex-wrap">
              <button
                onClick={()=>setShowMap(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${mapLocation ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-orange-400 bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200 animate-pulse'}`}
              >
                📍 {mapLocation ? 'Change Location on Map' : 'Pick Your Location on Map'}
              </button>
              {mapLocation && (
                <span className="text-xs text-gray-500 font-mono">
                  {mapLocation.lat.toFixed(4)}°N, {mapLocation.lng.toFixed(4)}°E
                </span>
              )}
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />Cluster</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />Standard</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* ═══ TAB 1: Food Search ════════════════════════════════════════ */}
        {activeTab==='search' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-gray-900">
                  {!hasSearched ? '🍔 What are you craving?' : lastQuery ? `Results for "${lastQuery}"` : 'All Food'}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {results.length} item{results.length!==1?'s':''} across {groups.length} restaurant{groups.length!==1?'s':''}
                  {isDemoMode && <span className="text-xs text-orange-400 italic font-medium"> · demo mode</span>}
                </p>
              </div>
              {itemCount>0 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
                  <span className="text-xl">🛒</span>
                  <div className="text-sm">
                    <p className="font-bold text-orange-700">{itemCount} item{itemCount!==1?'s':''}</p>
                    <p className="text-orange-500 text-xs">৳{cartTotal.toFixed(0)}</p>
                  </div>
                </div>
              )}
            </div>

            {results.length===0 && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-10 text-center">
                <span className="text-5xl">🍽️</span>
                <p className="mt-3 font-bold text-gray-700">Nothing found</p>
                <p className="text-sm text-gray-500 mt-1">Try different words or remove filters.</p>
              </div>
            )}

            <div className="space-y-8">
              {groups.map(({restaurant,items,hasCluster})=>(
                <section key={restaurant.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                      {restaurant.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-gray-900">{restaurant.name}</h2>
                      <p className="text-xs text-gray-400 truncate">{restaurant.address}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-500 shrink-0">⭐ {restaurant.avgRating}</span>
                  </div>
                  {hasCluster && (
                    <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-4 py-2.5 flex items-center gap-2">
                      <span className="text-xl">🔗</span>
                      <div>
                        <p className="text-sm font-bold text-emerald-700">Cluster Delivery Available!</p>
                        <p className="text-xs text-emerald-600">Near other restaurants — order from multiple and save on delivery fees!</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(item=>(
                      <FoodCard key={item.menuItem.id} item={item} onAddToCart={handleAddToCart} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TAB 2: Nearby & Clustering ════════════════════════════════ */}
        {activeTab==='nearby' && (
          !mapLocation ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="text-6xl">🗺️</div>
              <h2 className="text-xl font-black text-gray-900">Pick your location first</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Click the button above to open the map and drop a pin anywhere in Dhaka.
                We'll show which nearby restaurants qualify for cluster delivery.
              </p>
              <button
                onClick={()=>setShowMap(true)}
                className="mt-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 animate-bounce"
              >
                📍 Open Map &amp; Pick Location
              </button>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full text-left">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-xs font-bold text-emerald-800">🔗 Cluster Delivery</p>
                  <p className="text-xs text-emerald-700 mt-1">Restaurants within 2 km of each other. One rider, lower fee.</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-bold text-gray-700">🚚 Standard Delivery</p>
                  <p className="text-xs text-gray-600 mt-1">Too far apart to cluster. Each order delivered separately.</p>
                </div>
              </div>
            </div>
          ) : (
            <NearbyRestaurantsView userLocation={mapLocation} />
          )
        )}

      </div>
    </div>
  )
}

export default Search