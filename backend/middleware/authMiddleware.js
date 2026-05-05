import supabase from '../config/db.js'
import { normalizeRole } from '../utils/normalizeRole.js'
import jwt from 'jsonwebtoken'

const AUTH_CACHE_TTL_MS = 2 * 60 * 1000
const authUserCache = new Map()
const inFlightLookups = new Map()

const getCachedUserForToken = (token) => {
  const cached = authUserCache.get(token)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    authUserCache.delete(token)
    return null
  }
  return cached.user
}

const setCachedUserForToken = (token, user) => {
  authUserCache.set(token, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS })
}

const getUserFromTokenLocally = (token) => {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) return null

  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'], audience: 'authenticated' })

    if (!payload || typeof payload !== 'object') return null

    const id = payload.sub
    if (!id || typeof id !== 'string') return null

    const email =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload?.user_metadata?.email === 'string'
          ? payload.user_metadata.email
          : null

    const user_metadata = typeof payload.user_metadata === 'object' && payload.user_metadata ? payload.user_metadata : {}

    return {
      id,
      email,
      user_metadata,
    }
  } catch {
    return null
  }
}

const getUserFromSupabaseCached = async (token) => {
  const cachedUser = getCachedUserForToken(token)
  if (cachedUser) return cachedUser

  const existing = inFlightLookups.get(token)
  if (existing) return existing

  const lookupPromise = (async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) return null
      setCachedUserForToken(token, user)
      return user
    } finally {
      inFlightLookups.delete(token)
    }
  })()

  inFlightLookups.set(token, lookupPromise)
  return lookupPromise
}

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Not authorised, no token' })
    }

    // Fast-path: validate the Supabase JWT locally when SUPABASE_JWT_SECRET is configured.
    // Fallback: call Supabase auth.getUser(token), but cache/dedupe to prevent rate-limit stampedes.
    const localUser = getUserFromTokenLocally(token)
    const user = localUser ?? (await getUserFromSupabaseCached(token))

    if (!user) return res.status(401).json({ message: 'Not authorised, token invalid' })

    // Fetch role from the profiles table so it stays in sync with DB
    // rather than relying solely on JWT metadata (which can lag after role changes)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      return res.status(401).json({ message: 'Not authorised, user profile lookup failed' })
    }

    // profile?.role can be 'user' as a trigger default even for non-user roles.
    // Prefer the profile DB value; fall back to JWT metadata only if DB has no row.
    const dbRole = normalizeRole(profile?.role ?? null)
    // Never trust JWT user_metadata for authorization — it can be user-controlled.
    // If the DB profile row is missing, default to the least-privileged role.
    const safeFallbackRole = normalizeRole('user')

    req.user = {
      id: user.id,
      email: user.email,
      role: profile ? dbRole : safeFallbackRole,
    }

    next()
  } catch (err) {
    res.status(401).json({ message: 'Not authorised' })
  }
}
