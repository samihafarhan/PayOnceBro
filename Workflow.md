# PayOnceBro — Master Project Workflow Document (v2)
> **Tech Stack:** React.js · Node.js + Express.js · Supabase (PostgreSQL) · Gemini API  
> **Architecture:** MVC (Model → Service → Controller → Route → Frontend Service → View)  
> **Methodology:** Agile — 4 Sprints, 4 Members working in parallel  
> **Purpose:** This is the mother document. Use this as the single source of truth throughout the entire project.

---

## Team Structure

| Member | Class | Owns |
|--------|-------|------|
| Member A | **User** | Search, Cart, Ordering, Tracking, Recommendations, Combo Builder |
| Member B | **Rider** | Rider Dashboard, Route Optimization, Status Updates, Ratings, Demand Detection |
| Member C | **Restaurant** | Restaurant Dashboard, Menu Management, AI Auto-Tagging, Ratings, Vibe Check |
| Member D | **AI & Admin** | Analytics Dashboard, Cluster Engine, Delivery Fee Engine, ETA Engine, Assignment Engine |

> **Important:** Member D (AI & Admin) owns all shared backend services (clustering, routing, fee, ETA, rider assignment). Every other member **calls** these services — they never rewrite them. Member D is also responsible for the Gemini client setup and all `geminiService.js` methods.

---

## Sprint Philosophy

Each sprint represents a **phase of complexity** applied to all 4 classes simultaneously:

| Sprint | Phase | What Everyone Builds |
|--------|-------|----------------------|
| **Sprint 1** | Foundation | Auth, DB schema, base scaffolding, empty dashboard shells |
| **Sprint 2** | Core Read / Display | View-only features: see data, see lists, see profiles |
| **Sprint 3** | Core Write / Actions | Mutation features: place orders, update status, manage menus, assign riders |
| **Sprint 4** | AI & Polish | All Gemini features, recommendations, analytics, cross-member integration testing |

---

## Database Schema (Create Before Sprint 1 — All Members)

> Member D sets up the Supabase project and shares credentials with the team. All members create their tables in the same instance.

```sql
-- AUTH
users (id UUID PK, name TEXT, email TEXT UNIQUE, password_hash TEXT, role TEXT CHECK(role IN ('user','rider','restaurant','admin')), created_at TIMESTAMPTZ DEFAULT NOW())

-- USER CLASS
notifications (id UUID PK, user_id UUID FK users, message TEXT, type TEXT, is_read BOOL DEFAULT FALSE, created_at TIMESTAMPTZ)

-- RIDER CLASS
riders (id UUID PK, user_id UUID FK users, current_lat FLOAT, current_lng FLOAT, is_available BOOL DEFAULT TRUE, avg_rating FLOAT DEFAULT 0, total_deliveries INT DEFAULT 0)

-- RESTAURANT CLASS
restaurants (id UUID PK, owner_id UUID FK users, name TEXT, address TEXT, lat FLOAT, lng FLOAT, avg_prep_time INT, max_capacity_per_hour INT, is_active BOOL DEFAULT TRUE, avg_rating FLOAT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())
menu_items (id UUID PK, restaurant_id UUID FK restaurants, name TEXT, description TEXT, price FLOAT, category TEXT, is_available BOOL DEFAULT TRUE, ai_tags JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW())

-- AI & ADMIN CLASS (shared, used by all)
clusters (id UUID PK, restaurant_ids JSONB, rider_id UUID FK riders NULLABLE, is_active BOOL DEFAULT TRUE, created_at TIMESTAMPTZ)
orders (id UUID PK, user_id UUID FK users, rider_id UUID FK riders NULLABLE, cluster_id UUID FK clusters NULLABLE, status TEXT CHECK(status IN ('pending','accepted','preparing','pickup','on_the_way','delivered','cancelled')), total_price FLOAT, delivery_fee FLOAT, estimated_time INT, created_at TIMESTAMPTZ DEFAULT NOW())
order_items (id UUID PK, order_id UUID FK orders, menu_item_id UUID FK menu_items, restaurant_id UUID FK restaurants, quantity INT, price_at_order FLOAT)

-- SHARED
ratings (id UUID PK, order_id UUID FK orders, rated_by UUID FK users, rider_id UUID FK riders NULLABLE, restaurant_id UUID FK restaurants NULLABLE, score INT CHECK(score BETWEEN 1 AND 5), review_text TEXT, created_at TIMESTAMPTZ)
```

---

## Shared API Base Rules (All Members Follow)

```
Base URL: http://localhost:5000/api
Auth header: Authorization: Bearer <JWT>
Error format: { "message": "...", "stack": "..." (dev only) }
Success format: { "data": ... } or flat object depending on endpoint
```

### Status Transition Map (Member B owns enforcement, all must know)
```
pending → accepted       (Restaurant)
accepted → preparing     (Restaurant)
preparing → pickup       (Rider)
pickup → on_the_way      (Rider)
on_the_way → delivered   (Rider)
any → cancelled          (Restaurant or Admin)
```

---

---

# SPRINT 1 — Foundation
**Duration:** Week 1–2  
**Shared Goal:** By end of Sprint 1, every member has: the repo cloned, `.env` set up, Supabase connected, their dashboard shell rendering after login, and auth working end-to-end.

---

## S1 — Shared Setup (All Members, Day 1–2)

### Tasks
1. Member D creates the Supabase project, runs the schema SQL above, shares `.env` values.
2. All members clone the repo.
3. Run project setup:
```bash
# Root
npm init -y
npm install express dotenv cors helmet morgan bcryptjs jsonwebtoken @supabase/supabase-js

# Frontend
npm create vite@latest frontend -- --template react
cd frontend && npm install
```
4. All members create their feature branches: `feature/user`, `feature/rider`, `feature/restaurant`, `feature/ai-admin`.
5. Member D creates and merges `backend/app.js`, `backend/config/db.js`, `backend/config/gemini.js`, `backend/middleware/errorMiddleware.js`, and `frontend/src/services/api.js` into `main` before anyone else branches off.

### `backend/app.js`
```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorMiddleware.js';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// Each member mounts their routes here after Sprint 1
app.use(errorHandler);
export default app;
```

### `frontend/src/services/api.js`
```js
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
```

---

## S1 — Auth System (Member D builds, everyone uses)

### Goal
Register, login, JWT issue, role detection. Member D builds this entirely. Other members only consume `AuthContext` and `ProtectedRoute`.

### Workflow — Register
1. User fills form: name, email, password, role.
2. `POST /api/auth/register` → `authController.register`.
3. Check duplicate email via `userModel.findByEmail`.
4. Hash password with `bcryptjs`.
5. Insert into `users`. If role = `rider` → insert into `riders`. If role = `restaurant` → insert placeholder into `restaurants`.
6. Return `{ token, user }`.

### Workflow — Login
1. `POST /api/auth/login` → validate credentials → sign JWT `{ id, role }` 7d expiry → return `{ token, user }`.
2. Frontend stores token in `localStorage`, user in `AuthContext`.
3. React Router redirects by role: user→`/home`, rider→`/rider/dashboard`, restaurant→`/restaurant/dashboard`, admin→`/admin/analytics`.

### Workflow — Protected Route
1. Every protected route uses `protect` middleware: extracts Bearer token, verifies JWT, attaches `req.user = { id, role }`.
2. `restrictTo('rider')` middleware checks `req.user.role`.

### Files (Member D)
```
backend/models/userModel.js
backend/controllers/authController.js
backend/routes/authRoutes.js
backend/middleware/authMiddleware.js
backend/middleware/roleMiddleware.js
frontend/src/context/AuthContext.jsx
frontend/src/pages/auth/Login.jsx
frontend/src/pages/auth/Register.jsx
frontend/src/components/common/ProtectedRoute.jsx
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/auth/register` | None | `{ name, email, password, role }` | `{ token, user }` |
| POST | `/api/auth/login` | None | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | JWT | — | `{ user }` |

### Sprint 1 Acceptance Checklist (Member D — Auth)
- [ ] Duplicate email returns 400
- [ ] Passwords hashed in DB
- [ ] JWT valid and decodable
- [ ] Role-based redirect works for all 4 roles
- [ ] `GET /api/auth/me` returns 401 without token

---

## S1 — User: Dashboard Shell (Member A)

### Goal
Empty User dashboard with nav and placeholder sections. Routing works. Auth-protected.

### Files
```
frontend/src/pages/user/Home.jsx
frontend/src/pages/user/Search.jsx
frontend/src/pages/user/Cart.jsx
frontend/src/pages/user/OrderTracking.jsx
frontend/src/components/layouts/UserLayout.jsx
```

### What to Build
- `UserLayout.jsx`: navbar with links to Home, Search, Cart, My Orders.
- Each page: renders inside the layout, shows a "Coming Soon" placeholder.
- `App.jsx` routing: `/home`, `/search`, `/cart`, `/orders/:id` — all wrapped in `ProtectedRoute role="user"`.

### Sprint 1 Acceptance Checklist (Member A)
- [ ] User sees their layout after login
- [ ] All 4 routes render without errors
- [ ] Non-user roles redirected away from `/home`

---

## S1 — Rider: Dashboard Shell (Member B)

### Goal
Empty Rider dashboard shell. Routing works. Auth-protected.

### Files
```
frontend/src/pages/rider/Dashboard.jsx
frontend/src/pages/rider/RouteView.jsx
frontend/src/components/layouts/RiderLayout.jsx
```

### What to Build
- `RiderLayout.jsx`: sidebar with Dashboard, Route, Earnings links.
- Each page: placeholder content.
- Routes: `/rider/dashboard`, `/rider/route` — wrapped in `ProtectedRoute role="rider"`.

### Sprint 1 Acceptance Checklist (Member B)
- [ ] Rider sees their layout after login
- [ ] Routes render without errors
- [ ] Non-rider roles cannot access `/rider/*`

---

## S1 — Restaurant: Dashboard Shell (Member C)

### Goal
Empty Restaurant dashboard shell. Routing works. Auth-protected.

### Files
```
frontend/src/pages/restaurant/Dashboard.jsx
frontend/src/pages/restaurant/MenuManagement.jsx
frontend/src/components/layouts/RestaurantLayout.jsx
```

### What to Build
- `RestaurantLayout.jsx`: sidebar with Orders, Menu, Reviews links.
- Routes: `/restaurant/dashboard`, `/restaurant/menu` — wrapped in `ProtectedRoute role="restaurant"`.

### Sprint 1 Acceptance Checklist (Member C)
- [ ] Restaurant sees their layout after login
- [ ] Routes render without errors

---

## S1 — AI & Admin: Core Services Setup (Member D)

### Goal
Beyond auth: set up all shared backend services as empty scaffolds with correct signatures. Other members can import and call them starting Sprint 2 without merge conflicts.

### Files
```
backend/utils/geoUtils.js
backend/services/clusteringService.js     ← evaluateCluster, sortByProximity, getNearbyClusteredRestaurants
backend/services/deliveryFeeService.js    ← calculate
backend/services/estimationService.js     ← estimateTime
backend/services/routeService.js          ← optimizeRoute
backend/services/riderAssignmentService.js ← findBestRider
backend/services/geminiService.js         ← generateMenuTags, generateVibeSummary, buildCombo
backend/services/recommendationService.js ← getRecommendations
backend/services/analyticsService.js      ← getAnalytics
backend/services/demandService.js         ← analyzeZones
frontend/src/pages/admin/Analytics.jsx
frontend/src/components/layouts/AdminLayout.jsx
```

### `geoUtils.js` — Haversine (implement fully in Sprint 1)
```js
export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};
```

### `.env` Reference (Member D shares with team)
```env
PORT=5000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CLUSTER_RADIUS_KM=2
BASE_DELIVERY_FEE=20
PER_KM_RATE=10
CLUSTER_DISCOUNT_RATE=0.6
RIDER_SPEED_KMH=30
```

### Sprint 1 Acceptance Checklist (Member D — Admin)
- [ ] `GET /api/health` returns 200
- [ ] Supabase client initializes without error
- [ ] Gemini client initializes without error
- [ ] All service files exist with correct exported function signatures (can return placeholder data)
- [ ] Admin shell renders after login

---

---

# SPRINT 2 — Core Read / Display Features
**Duration:** Week 3–4  
**Shared Goal:** Every class can now **display real data** from the database. No mutations yet except what's needed to populate test data. Members can now see their features working with real Supabase queries.

---

## S2 — Member A (User): Smart Food Search

### Goal
Users can search for food by name, filter by price and cuisine, and see results ordered by proximity (cluster-eligible restaurants first).

### Workflow
1. User types in search bar (debounced 400ms).
2. `GET /api/search?q=burger&minPrice=50&maxPrice=300&cuisine=fast-food&userLat=X&userLng=Y`.
3. `searchController.search` → `menuModel.searchItems(query, filters)`:
   - Full-text match on `menu_items.name` and `description`.
   - Joins `restaurants` for location and active status.
   - Filters: `is_available = true`, `restaurant.is_active = true`, price range, cuisine.
4. Results passed to `clusteringService.sortByProximity(results, userLat, userLng)`.
5. Returns flat list of `{ menuItem, restaurant, isClusterEligible }`.
6. Frontend renders results grouped by restaurant. Cluster badge shown where eligible.

### Files (Member A)
```
backend/models/menuModel.js               ← searchItems(query, filters)
backend/controllers/searchController.js
backend/routes/searchRoutes.js
frontend/src/services/searchService.js
frontend/src/components/user/SearchBar.jsx
frontend/src/components/user/FoodCard.jsx
```
> Call `clusteringService.sortByProximity` from Member D — do not rewrite it.

### API Endpoints
| Method | Path | Auth | Params | Response |
|--------|------|------|--------|----------|
| GET | `/api/search` | JWT (user) | `q, minPrice, maxPrice, cuisine, userLat, userLng` | `[{ menuItem, restaurant, isClusterEligible }]` |

### Sprint 2 Acceptance Checklist (Member A)
- [ ] Typing "burger" returns all burger items across restaurants
- [ ] Price filter correctly excludes items
- [ ] Cluster-eligible badge appears for restaurants within 2km
- [ ] Empty search returns featured/popular items

---

## S2 — Member A (User): Restaurant & Menu Profile View

### Goal
Clicking a restaurant in search results shows its full menu, average rating, and Vibe Check summary (populated in Sprint 4, placeholder for now).

### Workflow
1. User clicks a restaurant card.
2. `GET /api/restaurant/:id` returns restaurant details + full menu.
3. Frontend renders menu grouped by category, prices, tags, ratings.
4. Vibe Check card shows "Coming Soon" placeholder (Member C builds the data in Sprint 3, Member D builds the Gemini call in Sprint 4).

### Files (Member A)
```
frontend/src/pages/user/RestaurantProfile.jsx
frontend/src/components/user/MenuSection.jsx
frontend/src/components/user/VibeCheckCard.jsx    ← placeholder for now
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/restaurant/:id` | None | `{ restaurant, menuItems[], avgRating }` |
> This endpoint is built by Member C (see below). Member A only builds the frontend that consumes it.

### Sprint 2 Acceptance Checklist (Member A)
- [ ] Clicking a restaurant shows its full menu
- [ ] Menu items show price and AI tags if available

---

## S2 — Member B (Rider): Rider Dashboard — View Assignments

### Goal
Rider sees their currently assigned order(s), pickup locations, customer address, and earnings summary. Read-only for now — status buttons come in Sprint 3.

### Workflow
1. Rider loads `/rider/dashboard`.
2. `GET /api/rider/assignments` → `riderController.getAssignments`:
   - Queries `orders` where `rider_id = req.user.id` and status NOT `delivered` or `cancelled`.
   - Joins `clusters`, `restaurants`, `order_items`, `menu_items`.
3. Returns active assignment with full detail.
4. Dashboard shows: restaurant list in pickup order, customer address, item list, delivery earnings.
5. `GET /api/rider/earnings` returns daily, weekly, and total stats.
6. Supabase real-time subscription set up on `orders` filtered by `rider_id` — new assignments appear live.

### Files (Member B)
```
backend/models/riderModel.js              ← getAssignments(riderId), getEarnings(riderId)
backend/controllers/riderController.js
backend/routes/riderRoutes.js
frontend/src/services/riderService.js
frontend/src/hooks/useRiderAssignment.js   ← Supabase realtime subscription
frontend/src/components/rider/AssignmentCard.jsx
frontend/src/components/rider/EarningsSummary.jsx
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/rider/assignments` | JWT (rider) | `{ assignment, restaurants[], customer, earnings }` |
| GET | `/api/rider/earnings` | JWT (rider) | `{ daily, weekly, total }` |

### Sprint 2 Acceptance Checklist (Member B)
- [ ] Rider sees active assignment with full restaurant and customer details
- [ ] Earnings summary displays correctly
- [ ] New assignment appears live via Supabase subscription (test by manually inserting to DB)

---

## S2 — Member B (Rider): Route View

### Goal
Rider sees their optimized pickup route: ordered stop list with distances and a Google Maps navigation link. Read-only display — route is calculated by Member D's service.

### Workflow
1. Rider clicks "View Route" on an active assignment.
2. `GET /api/rider/route/:clusterId` → `riderController.getRoute`:
   - Fetches cluster restaurant coordinates and customer coordinates.
   - Fetches rider's current `current_lat`, `current_lng`.
   - Calls `routeService.optimizeRoute(stops, riderLocation)` (Member D's service).
   - Builds Google Maps URL.
3. Frontend renders ordered stop list + total distance + "Start Navigation" button.

### Files (Member B)
```
backend/controllers/riderController.js    ← add getRoute method
frontend/src/pages/rider/RouteView.jsx
frontend/src/components/rider/StopList.jsx
frontend/src/components/rider/NavigationButton.jsx
```
> Call `routeService.optimizeRoute` from Member D — do not rewrite it.

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/rider/route/:clusterId` | JWT (rider) | `{ orderedStops[], mapsUrl, totalDistance }` |

### Sprint 2 Acceptance Checklist (Member B)
- [ ] 3-restaurant cluster returns correctly ordered stops
- [ ] Google Maps URL opens with correct waypoints
- [ ] Total distance displayed in km

---

## S2 — Member C (Restaurant): Restaurant Public Profile Endpoint

### Goal
Build the backend endpoint that serves a restaurant's public profile and full menu. This is consumed by Member A's frontend in Sprint 2.

### Workflow
1. `GET /api/restaurant/:id` → `restaurantController.getById`:
   - Fetch restaurant from `restaurants` table.
   - Fetch all `menu_items` for this restaurant where `is_available = true`.
   - Fetch average rating from `ratings`.
2. Returns `{ restaurant, menuItems[], avgRating }`.
3. `GET /api/restaurants` returns all active restaurants (used for seeding/testing).

### Files (Member C)
```
backend/models/restaurantModel.js         ← getById, getAll, getByOwner
backend/controllers/restaurantController.js
backend/routes/restaurantRoutes.js
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/restaurants` | None | `[restaurants]` |
| GET | `/api/restaurant/:id` | None | `{ restaurant, menuItems[], avgRating }` |

### Sprint 2 Acceptance Checklist (Member C)
- [ ] Endpoint returns correct restaurant + menu data
- [ ] Unavailable items excluded
- [ ] Works without auth (public route)

---

## S2 — Member C (Restaurant): Restaurant Dashboard — Order View

### Goal
Restaurant owner sees incoming and active orders on their dashboard. Read-only view of orders. Accept/Reject buttons come in Sprint 3.

### Workflow
1. Restaurant loads `/restaurant/dashboard`.
2. `GET /api/restaurant/orders` → `restaurantController.getOrders`:
   - Queries `order_items` where `restaurant_id = req.user.restaurantId`.
   - Joins `orders`, `menu_items`, and `clusters`.
   - Returns orders grouped by status.
3. Supabase real-time subscription on `order_items` filtered by `restaurant_id` — new orders appear live without refresh.
4. Each order card shows: items ordered, cluster status, customer count, estimated prep time needed.

### Files (Member C)
```
backend/controllers/restaurantController.js  ← add getOrders method
frontend/src/hooks/useRestaurantOrders.js      ← Supabase realtime subscription
frontend/src/components/restaurant/OrderCard.jsx
frontend/src/components/restaurant/OrderList.jsx
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/restaurant/orders` | JWT (restaurant) | `{ pending[], preparing[], completed[] }` |

### Sprint 2 Acceptance Checklist (Member C)
- [ ] Orders appear grouped by status
- [ ] New order appears within 2 seconds via real-time subscription (test by manually inserting to DB)
- [ ] Cluster badge shown on clustered orders

---

## S2 — Member C (Restaurant): Menu Read View

### Goal
Restaurant owner can view their full menu list. Edit/Add/Delete comes in Sprint 3.

### Workflow
1. `GET /api/menu/restaurant/:id` → `menuController.getByRestaurant`.
2. Returns all items regardless of availability (owner sees everything including unavailable).
3. Frontend renders as a card grid with tags, price, availability status badge.

### Files (Member C)
```
backend/models/menuModel.js               ← getByRestaurant(restaurantId)
backend/controllers/menuController.js
backend/routes/menuRoutes.js
frontend/src/components/restaurant/MenuItemCard.jsx
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/menu/restaurant/:id` | JWT (restaurant) | `[menuItems with ai_tags]` |

### Sprint 2 Acceptance Checklist (Member C)
- [ ] All items shown including unavailable
- [ ] AI tags column shown (empty until Sprint 3 AI tagging is done)

---

## S2 — Member D (AI & Admin): Cluster Check Endpoint

### Goal
Expose the clustering logic as an API endpoint so Member A's cart can call it.

### Workflow
1. `POST /api/cluster/check` with `{ restaurantIds, userLat, userLng }`.
2. `clusterController.checkCluster` → `restaurantModel.getByIds` → `clusteringService.evaluateCluster`.
3. Returns `{ eligible, restaurants, estimatedSaving }`.

### Files (Member D)
```
backend/models/restaurantModel.js         ← getByIds(ids)
backend/controllers/clusterController.js
backend/routes/clusterRoutes.js
backend/services/clusteringService.js     ← implement evaluateCluster fully
```

### `clusteringService.evaluateCluster`
```js
export const evaluateCluster = (restaurants, radiusKm = 2) => {
  for (let i = 0; i < restaurants.length; i++) {
    for (let j = i + 1; j < restaurants.length; j++) {
      const dist = haversineDistance(
        restaurants[i].lat, restaurants[i].lng,
        restaurants[j].lat, restaurants[j].lng
      );
      if (dist > radiusKm) return { eligible: false };
    }
  }
  return { eligible: true };
};
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/cluster/check` | JWT (user) | `{ restaurantIds[], userLat, userLng }` | `{ eligible, estimatedSaving }` |

### Sprint 2 Acceptance Checklist (Member D)
- [ ] Two restaurants 1.5km apart → `eligible: true`
- [ ] Two restaurants 3km apart → `eligible: false`
- [ ] Single restaurant → `eligible: false` (no cluster needed)

---

## S2 — Member D (AI & Admin): Delivery Fee & ETA Endpoints

### Goal
Expose fee calculation and ETA as API endpoints so Member A's cart can call them.

### Workflow — Fee
1. `POST /api/delivery/fee` → `deliveryController.calculateFee` → `deliveryFeeService.calculate`.
2. Fee formula:
   - **Non-cluster:** `(BASE_FEE + distance × PER_KM_RATE)` per restaurant, summed.
   - **Cluster:** `BASE_FEE + (maxDistance × PER_KM_RATE) × CLUSTER_DISCOUNT_RATE`.
3. Returns `{ fee, breakdown[], savings }`.

### Workflow — ETA
1. `POST /api/delivery/estimate` → `deliveryController.estimateTime` → `estimationService.estimateTime`.
2. `maxPrepTime` = max of all restaurants' `avg_prep_time`.
3. `travelTime` = `(totalRouteDistance / RIDER_SPEED_KMH) × 60`.
4. `estimatedMinutes` = `maxPrepTime + travelTime + 5` (buffer).
5. Returns `{ estimatedMinutes, breakdown }`.

### Files (Member D)
```
backend/services/deliveryFeeService.js    ← implement calculate fully
backend/services/estimationService.js     ← implement estimateTime fully
backend/controllers/deliveryController.js
backend/routes/deliveryRoutes.js
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/delivery/fee` | JWT (user) | `{ restaurantIds[], userLat, userLng, isCluster }` | `{ fee, breakdown[], savings }` |
| POST | `/api/delivery/estimate` | JWT (user) | `{ restaurantIds[], userLat, userLng }` | `{ estimatedMinutes, breakdown }` |

### Sprint 2 Acceptance Checklist (Member D)
- [ ] Cluster fee always less than sum of individual fees
- [ ] ETA increases proportionally with distance
- [ ] ETA uses slowest restaurant's prep time, not average

---

## S2 — Member D (AI & Admin): Analytics Dashboard — Read View

### Goal
Admin can see real platform data. All charts and stats populated from Supabase.

### Workflow
1. `GET /api/admin/analytics` → `adminController.getAnalytics` → `analyticsService.getAnalytics()`.
2. Queries:
   - Total orders: `SELECT COUNT(*) FROM orders`
   - Clustered orders: `SELECT COUNT(*) FROM clusters`
   - Cluster rate: `(clustered / total) * 100`
   - Avg delivery time: avg of `(delivered_at - created_at)` for delivered orders
   - Daily sales: `SUM(total_price) WHERE DATE(created_at) = TODAY`
   - Most ordered item: `SELECT menu_item_id, COUNT(*) FROM order_items GROUP BY 1 ORDER BY 2 DESC LIMIT 1`
   - Weekly revenue: group orders by day, last 7 days
3. Frontend renders `StatCard` components + `recharts` line chart.

### Files (Member D)
```
backend/services/analyticsService.js      ← implement getAnalytics fully
backend/controllers/adminController.js
backend/routes/adminRoutes.js
frontend/src/components/admin/StatCard.jsx
frontend/src/components/admin/RevenueChart.jsx
```

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/admin/analytics` | JWT (admin) | `{ totalOrders, clusteredOrders, clusterRate, avgDeliveryTime, dailySales, mostOrderedItem, weeklyRevenue[] }` |

### Sprint 2 Acceptance Checklist (Member D)
- [ ] All stats accurate against test data
- [ ] Revenue chart renders for partial weeks
- [ ] Only accessible to admin role

---

---

# SPRINT 3 — Core Write / Action Features
**Duration:** Week 5–7  
**Shared Goal:** Every class can now **mutate data**. The full ordering lifecycle works end-to-end: user places order → restaurant accepts → rider is assigned → rider delivers → user rates.

---

## S3 — Member A (User): Multi-Restaurant Cart

### Goal
Users add items from multiple restaurants into one cart. Cluster eligibility shown live.

### Workflow
1. User clicks "Add to Cart" on a `FoodCard` in Search results.
2. `CartContext.addItem(menuItem, restaurant)` updates in-memory state.
3. `useEffect` watching `restaurants` in cart calls `POST /api/cluster/check` (Member D's endpoint).
4. Cart UI shows:
   - Items grouped by restaurant.
   - Quantity controls.
   - If cluster: one combined fee line + "Save X Tk!" banner.
   - If not: individual fee per restaurant.
   - Calls `POST /api/delivery/fee` and `POST /api/delivery/estimate` for live totals.

### Files (Member A)
```
frontend/src/context/CartContext.jsx
frontend/src/pages/user/Cart.jsx
frontend/src/components/user/CartItem.jsx
frontend/src/components/user/CartSummary.jsx
frontend/src/components/user/ClusterBanner.jsx
frontend/src/components/user/ETADisplay.jsx
frontend/src/components/user/DeliveryFeeSummary.jsx
```

### CartContext State Shape
```js
{
  items: [{ menuItem, restaurant, quantity }],
  clusterStatus: { eligible: bool, estimatedSaving: number },
  deliveryFee: number,
  estimatedMinutes: number,
  subtotal: number,
  total: number
}
```

### Sprint 3 Acceptance Checklist (Member A — Cart)
- [ ] Adding items from 3 restaurants works
- [ ] Cluster banner appears/disappears dynamically
- [ ] Totals update live as items are added/removed
- [ ] Cart persists across page navigation within session

---

## S3 — Member A (User): Order Placement & Live Tracking

### Goal
Convert cart into a confirmed DB order. Track status in real time.

### Workflow — Place Order
1. User clicks "Place Order".
2. `POST /api/orders` with `{ items[], restaurantIds[], userLat, userLng, isCluster }`.
3. Backend: creates `orders` + `order_items`. If cluster: creates `clusters` record.
4. Supabase broadcasts new order to relevant restaurants.
5. Frontend redirects to `/orders/:id`.

### Workflow — Track Order
1. `OrderTracking` page fetches initial order via `GET /api/orders/:id`.
2. Subscribes to Supabase real-time `orders` table filtered by `id`.
3. Status updates render in a `StatusTimeline` component.
4. On `delivered` status: rating modal appears automatically.

### Files (Member A)
```
frontend/src/services/orderService.js
frontend/src/pages/user/OrderTracking.jsx
frontend/src/hooks/useOrderTracking.js        ← Supabase realtime
frontend/src/components/user/StatusTimeline.jsx
frontend/src/components/user/RatingModal.jsx
```
> `POST /api/orders` is built by Member D (see below). Member A only builds the frontend that calls it.

### Sprint 3 Acceptance Checklist (Member A)
- [ ] Order placed successfully, `orderId` returned
- [ ] Tracking page shows correct initial status
- [ ] Status updates appear within 2 seconds of DB change
- [ ] Rating modal appears automatically on delivery

---

## S3 — Member B (Rider): Delivery Status Updates

### Goal
Riders can update order status (Pickup → On the Way → Delivered) via button taps on the dashboard.

### Workflow
1. Rider taps status button on `AssignmentCard`.
2. `PUT /api/orders/:id/status` with `{ status }`.
3. `orderController.updateStatus` validates transition using the status map.
4. Updates `orders.status` in DB.
5. Supabase broadcasts to customer tracking page.
6. On `delivered`: `riderModel.setAvailable(riderId, true)`, earnings recorded.

### Files (Member B)
```
frontend/src/components/rider/StatusButtons.jsx
```
> The `PUT /api/orders/:id/status` endpoint is built by Member D. Member B only builds the UI that calls it.

### Sprint 3 Acceptance Checklist (Member B)
- [ ] Illegal status transition (e.g., pending → delivered) returns 400
- [ ] Customer tracking page updates within 2 seconds
- [ ] Rider marked available after delivering

---

## S3 — Member B (Rider): Rider Rating System

### Goal
After delivery, users rate riders (1–5 stars). Low ratings alert admin.

### Workflow
1. Rating modal (built by Member A) calls `POST /api/ratings` with `{ orderId, riderId, score, reviewText }`.
2. `ratingController.create` saves to `ratings`.
3. `ratingModel.updateRiderAvgRating(riderId)` recalculates average.
4. If avg < 3.0: `notificationModel.createAdminAlert`.
5. Rider dashboard shows updated `avg_rating`.

### Files (Member B)
```
backend/models/ratingModel.js             ← createRiderRating, updateRiderAvg
backend/controllers/ratingController.js
backend/routes/ratingRoutes.js
frontend/src/components/rider/RatingDisplay.jsx
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/ratings` | JWT (user) | `{ orderId, riderId?, restaurantId?, score, reviewText }` | `{ rating }` |

### Sprint 3 Acceptance Checklist (Member B)
- [ ] Can only rate once per order per entity
- [ ] Average updates after each new rating
- [ ] Admin notification created when avg drops below 3.0

---

## S3 — Member B (Rider): Location Update

### Goal
Rider's current location is updated periodically so the cluster assignment engine can find the nearest rider, and so the customer tracking map can show the rider's position.

### Workflow
1. On rider dashboard load, browser geolocation API called.
2. Every 30 seconds: `PUT /api/rider/location` with `{ lat, lng }`.
3. `riderController.updateLocation` → `riderModel.updateLocation(riderId, lat, lng)`.
4. Customer tracking page polls rider location to update map marker.

### Files (Member B)
```
backend/controllers/riderController.js    ← add updateLocation
frontend/src/hooks/useRiderLocation.js     ← geolocation + polling hook
frontend/src/components/rider/LocationTracker.jsx
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| PUT | `/api/rider/location` | JWT (rider) | `{ lat, lng }` | `{ success }` |
| GET | `/api/rider/:id/location` | JWT | — | `{ lat, lng }` |

### Sprint 3 Acceptance Checklist (Member B)
- [ ] Location updates in DB every 30 seconds
- [ ] Customer tracking map reflects rider's current position

---

## S3 — Member C (Restaurant): Order Accept / Reject & Prep Management

### Goal
Restaurant can accept or reject incoming orders. Accepted orders show a preparation countdown timer.

### Workflow
1. Incoming order appears in restaurant dashboard (built in Sprint 2).
2. Restaurant clicks "Accept" → `PUT /api/orders/:id/status` `{ status: 'accepted' }`.
   - This triggers Member D's `riderAssignmentService.findBestRider` automatically (see below).
3. Restaurant clicks "Reject" → status → `cancelled`, user notified.
4. Restaurant clicks "Ready" → status → `preparing`.
5. On accept, a `PrepTimer` component counts down from `restaurant.avg_prep_time` minutes.

### Files (Member C)
```
frontend/src/components/restaurant/OrderActionButtons.jsx
frontend/src/components/restaurant/PrepTimer.jsx
```
> `PUT /api/orders/:id/status` is Member D's endpoint. Member C only builds the UI buttons that call it.

### Sprint 3 Acceptance Checklist (Member C)
- [ ] Accepting triggers rider assignment (confirm by checking `orders.rider_id` in DB)
- [ ] Rejection sets status to `cancelled` and notifies user
- [ ] Prep timer counts down accurately

---

## S3 — Member C (Restaurant): Menu Management (Add / Edit / Delete)

### Goal
Restaurant owners can fully manage their menu items.

### Workflow
1. **Add:** Owner fills `MenuItemForm` → `POST /api/menu` → `menuController.create` → saves to DB → triggers AI auto-tagging (Sprint 4, graceful skip for now).
2. **Edit:** Owner clicks edit → pre-filled form → `PUT /api/menu/:id`.
3. **Delete:** Confirmation modal → `DELETE /api/menu/:id`.
4. **Toggle Availability:** Switch toggle → `PATCH /api/menu/:id/availability`.

### Files (Member C)
```
backend/controllers/menuController.js     ← create, update, delete, toggleAvailability
frontend/src/components/restaurant/MenuItemForm.jsx
frontend/src/components/restaurant/DeleteConfirmModal.jsx
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/menu` | JWT (restaurant) | `{ name, description, price, category }` | `{ menuItem }` |
| PUT | `/api/menu/:id` | JWT (restaurant) | `{ ...fields }` | `{ menuItem }` |
| DELETE | `/api/menu/:id` | JWT (restaurant) | — | `{ success }` |
| PATCH | `/api/menu/:id/availability` | JWT (restaurant) | `{ isAvailable }` | `{ menuItem }` |

### Sprint 3 Acceptance Checklist (Member C)
- [ ] Only owning restaurant can edit their items (enforced with `req.user`)
- [ ] Deleted items disappear from user search immediately
- [ ] Unavailable items hidden from users, still visible to owner

---

## S3 — Member C (Restaurant): Restaurant Rating System

### Goal
Customers rate food quality. Restaurants can respond to reviews.

### Workflow
1. `POST /api/ratings` with `{ orderId, restaurantId, score, reviewText }` (same endpoint as rider rating, Member B built the backend).
2. `ratingModel.updateRestaurantAvgRating(restaurantId)` recalculates average.
3. Restaurant reviews tab shows all reviews.
4. `POST /api/ratings/:id/response` saves restaurant's reply.

### Files (Member C)
```
backend/models/ratingModel.js             ← updateRestaurantAvg, addResponse, getByRestaurant (add to Member B's model)
frontend/src/components/restaurant/ReviewList.jsx
frontend/src/components/restaurant/ReviewResponseForm.jsx
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/ratings/restaurant/:id` | None | — | `[ratings with responses]` |
| POST | `/api/ratings/:id/response` | JWT (restaurant) | `{ responseText }` | `{ rating }` |

### Sprint 3 Acceptance Checklist (Member C)
- [ ] Average rating updates after each submission
- [ ] Restaurant response appears threaded under review
- [ ] User can rate each restaurant in a multi-order separately

---

## S3 — Member D (AI & Admin): Order Placement Backend

### Goal
The core `POST /api/orders` endpoint. This is the most critical endpoint in the system — it creates the order, the cluster, and triggers rider assignment.

### Workflow
1. `POST /api/orders` → `orderController.placeOrder`:
   - Validate all item IDs exist and are available.
   - Calculate final fee and ETA using services.
   - `orderModel.create` → insert `orders` row (status: `pending`).
   - `orderModel.createItems` → insert `order_items` rows.
   - If `isCluster`: `clusterModel.create` → insert `clusters` row linking order + restaurant IDs.
   - Supabase broadcast to notify restaurant(s) of new order.
2. Returns `{ orderId, clusterId, estimatedTime, deliveryFee }`.

### Files (Member D)
```
backend/models/orderModel.js              ← create, createItems, getById, updateStatus, getByUser
backend/models/clusterModel.js            ← create, getByOrder, assignRider
backend/controllers/orderController.js    ← placeOrder, getById, getByUser, updateStatus
backend/routes/orderRoutes.js
```

### API Endpoints
| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/orders` | JWT (user) | `{ items[], restaurantIds[], userLat, userLng, isCluster }` | `{ orderId, clusterId, estimatedTime, fee }` |
| GET | `/api/orders/:id` | JWT | — | `{ order, items[], cluster }` |
| GET | `/api/orders/my` | JWT (user) | — | `[orders]` |
| PUT | `/api/orders/:id/status` | JWT | `{ status }` | `{ order }` |

### Sprint 3 Acceptance Checklist (Member D — Orders)
- [ ] Order created with `pending` status
- [ ] Cluster record created only when `isCluster: true`
- [ ] Placing order with unavailable item returns 400
- [ ] Restaurant notified via Supabase on order creation

---

## S3 — Member D (AI & Admin): Rider Assignment Engine

### Goal
When a restaurant accepts an order, automatically find and assign the nearest available rider.

### Workflow
1. `orderController.updateStatus` detects transition `pending → accepted`.
2. Calls `riderAssignmentService.findBestRider(clusterId)`:
   - `riderModel.getAvailable()` → all riders with `is_available = true`.
   - For each rider, compute Haversine distance to cluster centroid (avg lat/lng of restaurants).
   - Select rider with minimum distance.
3. `clusterModel.assignRider(clusterId, riderId)`.
4. `orderModel.updateRider(orderId, riderId)`.
5. `riderModel.setAvailable(riderId, false)`.
6. Supabase broadcast notifies rider's dashboard.

### Files (Member D)
```
backend/services/riderAssignmentService.js ← implement findBestRider fully
backend/models/riderModel.js               ← getAvailable, setAvailable, updateLocation
```

### Sprint 3 Acceptance Checklist (Member D — Assignment)
- [ ] Nearest available rider is assigned correctly
- [ ] Assigned rider's `is_available` set to `false`
- [ ] Rider dashboard updates live when assigned
- [ ] No assignment made if no riders available (order stays `accepted`, retry logic logs warning)

---

---

# SPRINT 4 — AI Features & Polish
**Duration:** Week 8–10  
**Shared Goal:** All Gemini-powered features live. Recommendations working. Platform tested end-to-end. UI polished.

---

## S4 — Member A (User): AI Combo Builder

### Goal
User types a natural language prompt; Gemini builds a complete cart from cluster-eligible restaurants.

### Workflow
1. User opens "AI Combo Builder" page.
2. Types prompt: "meal for 2 under 500 Tk, one person is vegetarian".
3. `POST /api/ai/combo` with `{ prompt, userLat, userLng }`.
4. Backend:
   - `clusteringService.getNearbyClusteredRestaurants(userLat, userLng)` gets eligible restaurants.
   - Fetches all their menu items with `ai_tags`.
   - Calls `geminiService.buildCombo(prompt, menuContext)`.
   - Validates all returned item IDs exist.
5. Returns `{ suggestedItems[], totalPrice, explanation }`.
6. Frontend shows suggested cart + "Add All to Cart" button.

### Files (Member A)
```
frontend/src/pages/user/ComboBuilder.jsx
frontend/src/components/user/ComboResult.jsx
frontend/src/services/aiService.js
```
> `POST /api/ai/combo` is built by Member D. Member A only builds the frontend.

### Sprint 4 Acceptance Checklist (Member A)
- [ ] Prompt respects budget constraint
- [ ] Vegetarian/vegan tags respected in selection
- [ ] "Add All to Cart" populates CartContext correctly
- [ ] Graceful error message if Gemini is unavailable

---

## S4 — Member A (User): Food Recommendation Carousels

### Goal
Three horizontal carousels on Home page: Popular, Frequently Ordered Together, Cluster-Friendly picks.

### Workflow
1. On home page load, `GET /api/recommendations?userLat=X&userLng=Y`.
2. Three lists returned from `recommendationService.getRecommendations(userId)`.
3. Each carousel scrolls horizontally, each card is a `FoodCard` with Add to Cart button.

### Files (Member A)
```
frontend/src/components/user/RecommendationCarousel.jsx
```
> `/api/recommendations` is built by Member D.

### Sprint 4 Acceptance Checklist (Member A)
- [ ] New users see only Popular carousel
- [ ] Returning users see personalized "Ordered Together" suggestions
- [ ] Each carousel card adds to cart correctly

---

## S4 — Member B (Rider): Area Demand Detection — Rider Notification

### Goal
Riders are notified when they are near a high-demand zone, prompting them to reposition.

### Workflow
1. Member D's `demandService.analyzeZones()` runs every 30 minutes (background job).
2. If a rider's current location is within 1km of a high-demand zone, `notificationModel.create(riderId, message)`.
3. Rider dashboard shows a notification badge and message: "High demand detected 0.8km away — consider repositioning."
4. Rider can see demand heatmap overlay on their route view.

### Files (Member B)
```
frontend/src/components/rider/DemandNotification.jsx
frontend/src/hooks/useRiderNotifications.js   ← Supabase realtime on notifications table
```
> `demandService` and `notificationModel` are Member D's. Member B only builds the frontend that reads notifications.

### Sprint 4 Acceptance Checklist (Member B)
- [ ] Notification appears within 2 minutes of zone detection
- [ ] Notification dismissed after rider reads it

---

## S4 — Member C (Restaurant): AI Menu Auto-Tagging

### Goal
On menu item create/edit, Gemini auto-generates dietary and flavor tags, stored in `ai_tags` JSONB column.

### Workflow
1. `menuController.create` / `menuController.update` saves item to DB.
2. Calls `geminiService.generateMenuTags(name, description)`:

```js
const prompt = `Given this menu item:
Name: ${name}
Description: ${description}

Return ONLY a valid JSON array of applicable tags from:
["vegan", "vegetarian", "halal", "spicy", "mild", "sweet", "gluten-free", "dairy-free", "high-protein", "low-calorie"]

Example: ["halal", "spicy"]`;
```

3. Parses response, validates it is a JSON array of known tags.
4. `menuModel.updateTags(itemId, tags)` saves to `ai_tags` column.
5. Tags displayed on menu card with "AI" badge. Used in search filtering and Combo Builder.

### Files (Member C)
```
backend/controllers/menuController.js     ← call geminiService.generateMenuTags after save
frontend/src/components/restaurant/AiTagBadge.jsx
```
> `geminiService.generateMenuTags` is Member D's. Member C calls it from the menu controller.

### Sprint 4 Acceptance Checklist (Member C)
- [ ] Tags generated within 3 seconds of item save
- [ ] Malformed Gemini response caught — item saved without tags, no crash
- [ ] Tags visible on user search results and filter correctly

---

## S4 — Member C (Restaurant): Vibe Check Review Summary

### Goal
A single-sentence Gemini-generated sentiment summary shown on each restaurant's public profile.

### Workflow
1. `GET /api/restaurant/:id/vibe` → `restaurantController.getVibeSummary`.
2. `ratingModel.getRecentReviews(restaurantId, limit=20)` fetches last 20 text reviews.
3. If < 3 reviews: return `{ summary: null }`.
4. Calls `geminiService.generateVibeSummary(reviews)`:

```js
const prompt = `Summarize these restaurant reviews in ONE sentence of 20 words or less.
Be specific and honest. Tell a new customer what to expect.
Reviews: ${JSON.stringify(reviews.map(r => r.review_text))}`;
```

5. Cache result for 1 hour (in-memory Map keyed by `restaurantId`).
6. Member A's `VibeCheckCard` renders the summary.

### Files (Member C)
```
backend/controllers/restaurantController.js  ← add getVibeSummary
```
> `geminiService.generateVibeSummary` is Member D's.

### API Endpoints
| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/restaurant/:id/vibe` | None | `{ summary: string \| null }` |

### Sprint 4 Acceptance Checklist (Member C)
- [ ] Summary renders on restaurant profile
- [ ] Returns null with < 3 reviews, no crash
- [ ] Cached result served on repeat calls within 1 hour

---

## S4 — Member D (AI & Admin): Gemini Service — Full Implementation

### Goal
All three Gemini-powered features fully implemented in `geminiService.js`.

### Files (Member D)
```
backend/services/geminiService.js
```

### `generateMenuTags(name, description)` → `string[]`
- Prompt as shown in Member C section.
- Parse response as JSON array.
- Fallback: return `[]` on any error.

### `generateVibeSummary(reviews)` → `string`
- Prompt as shown in Member C section.
- Return summary string.
- Fallback: return `null` on any error.

### `buildCombo(userPrompt, menuContext)` → `{ items[], explanation }`
```js
const prompt = `You are a food ordering assistant. The user wants: "${userPrompt}"

Available menu items (JSON):
${JSON.stringify(menuContext)}

Return ONLY this exact JSON:
{
  "items": [{ "menuItemId": "...", "restaurantId": "...", "quantity": 1 }],
  "explanation": "One sentence explaining your selection"
}`;
```
- Parse response as JSON.
- Validate all `menuItemId` values exist in `menuContext`.
- Fallback: return `{ items: [], explanation: "Could not generate combo. Please try again." }`.

### Sprint 4 Acceptance Checklist (Member D — Gemini)
- [ ] All three methods return correct types on success
- [ ] All three methods return safe fallbacks on Gemini error
- [ ] No Gemini failure crashes any other flow

---

## S4 — Member D (AI & Admin): Combo Builder & Recommendations Backend

### Goal
Expose Combo Builder and Recommendation endpoints.

### Files (Member D)
```
backend/controllers/aiController.js
backend/routes/aiRoutes.js
backend/services/recommendationService.js  ← implement fully
backend/controllers/recommendationController.js
backend/routes/recommendationRoutes.js
```

### Recommendation Logic
- **Popular:** `SELECT menu_item_id, COUNT(*) FROM order_items GROUP BY 1 ORDER BY 2 DESC LIMIT 10`
- **Frequently Together:** Items appearing in same orders as the user's top item
- **Cluster-Friendly:** Pairs of items from restaurants within cluster radius of user

### API Endpoints
| Method | Path | Auth | Body/Params | Response |
|--------|------|------|-------------|----------|
| POST | `/api/ai/combo` | JWT (user) | `{ prompt, userLat, userLng }` | `{ suggestedItems[], totalPrice, explanation }` |
| GET | `/api/recommendations` | JWT (user) | `userLat, userLng` | `{ popular[], frequentlyTogether[], clusterFriendly[] }` |

### Sprint 4 Acceptance Checklist (Member D)
- [ ] Combo respects budget and dietary constraints
- [ ] Recommendations endpoint returns all three lists
- [ ] New users (no history) receive only popular recommendations

---

## S4 — Member D (AI & Admin): Demand Detection

### Goal
Analyze order density per area, flag high-demand zones, assist rider positioning.

### Workflow
1. Background job in `app.js`: `setInterval(demandService.analyzeZones, 1800000)` (30 min).
2. `demandService.analyzeZones()`:
   - Fetch orders from past 2 hours.
   - Group by `lat.toFixed(2)` + `lng.toFixed(2)` grid cells.
   - Flag cells with > 5 orders as HIGH_DEMAND.
   - Store in memory or `demand_zones` table.
3. `GET /api/admin/demand-zones` returns zone list for admin heatmap.
4. Riders near high-demand zones notified (Member B reads notifications).

### Sprint 4 Acceptance Checklist (Member D)
- [ ] Zones update every 30 minutes without restart
- [ ] Admin heatmap shows high/low demand areas
- [ ] Rider notifications created for nearby high-demand zones

---

---

# Integration Touchpoints (All Members Read)

These are the exact moments where two members' work must connect. Coordinate on these explicitly.

| Touchpoint | Owner A | Owner B | When |
|------------|---------|---------|------|
| Cart calls cluster check | Member A (frontend) | Member D (endpoint) | Sprint 2 |
| Cart calls fee + ETA | Member A (frontend) | Member D (endpoints) | Sprint 2 |
| Place order | Member A (frontend) | Member D (endpoint) | Sprint 3 |
| Order triggers rider assignment | Member D (backend) | — | Sprint 3 |
| Status update | Member B (frontend buttons) | Member D (endpoint) | Sprint 3 |
| Rating submission | Member A (modal) | Member B (backend) | Sprint 3 |
| Restaurant rating | Member A (modal) | Member C (backend) | Sprint 3 |
| Vibe Check display | Member A (frontend card) | Member C (endpoint) | Sprint 4 |
| AI tags in search filter | Member A (frontend) | Member C (data), Member D (Gemini) | Sprint 4 |
| Combo Builder | Member A (frontend) | Member D (endpoint + Gemini) | Sprint 4 |
| Recommendations | Member A (frontend) | Member D (endpoint) | Sprint 4 |
| Demand notifications | Member B (frontend) | Member D (background job) | Sprint 4 |

---

# Cross-Sprint Standards (All Members Follow)

### Controller Pattern
```js
export const someAction = async (req, res, next) => {
  try {
    const result = await someService.doThing(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
```

### Protected Route Pattern
```js
// In route file:
router.post('/endpoint', protect, restrictTo('user'), controller.method);
```

### Supabase Real-Time Hook Pattern
```js
// Reusable hook — create once in frontend/src/hooks/useRealtimeSubscription.js
export const useRealtimeSubscription = (table, filter, callback) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, filter]);
};
```

### Gemini Error Handling Rule
Every `geminiService` method returns a safe fallback value on failure. **Never let Gemini crash the ordering flow.**

---

*v2 — Redesigned for 4-member parallel workflow. Last updated: Sprint 0 (pre-development).*
