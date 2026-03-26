export const restrictTo = (...roles) => (req, res, next) => {
  const userRole = req.user?.role
  const normalizedRoles = new Set(roles)
  if (roles.includes('restaurant_owner')) normalizedRoles.add('restaurant')
  if (roles.includes('restaurant')) normalizedRoles.add('restaurant_owner')

  if (!normalizedRoles.has(userRole)) {
    return res.status(403).json({ message: 'Access denied: insufficient role' })
  }
  next()
}
