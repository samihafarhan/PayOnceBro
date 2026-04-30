export const getRoleHome = (role) => {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'restaurant_owner' || normalized === 'restaurant') return '/restaurant/dashboard'
  if (normalized === 'rider') return '/rider/dashboard'
  if (normalized === 'admin') return '/admin/analytics'
  return '/home'
}
