import axios from 'axios'
import supabase from '../lib/supabase'

let cachedAccessToken = null
let didInitTokenListener = false

const ensureTokenListener = () => {
  if (didInitTokenListener) return
  didInitTokenListener = true

  // Seed once on module init.
  supabase.auth
    .getSession()
    .then(({ data: { session } }) => {
      cachedAccessToken = session?.access_token ?? null
    })
    .catch(() => {
      cachedAccessToken = null
    })

  supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.access_token ?? null
  })
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use(async (config) => {
  ensureTokenListener()

  if (!cachedAccessToken) return config

  const nextHeaders = {
    ...(config.headers || {}),
    Authorization: `Bearer ${cachedAccessToken}`,
  }

  return {
    ...config,
    headers: nextHeaders,
  }
})

export default api
