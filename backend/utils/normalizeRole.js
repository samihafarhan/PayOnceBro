export const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  return value === 'restaurant' ? 'restaurant_owner' : value
}
