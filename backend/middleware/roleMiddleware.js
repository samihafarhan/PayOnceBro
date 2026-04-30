import { normalizeRole } from '../utils/normalizeRole.js'

export const restrictTo = (...roles) => (req, res, next) => {
  const userRole = normalizeRole(req.user?.role)
  const normalizedRoles = new Set(roles.map(normalizeRole))

  if (!normalizedRoles.has(userRole)) {
    return res.status(403).json({ message: 'Access denied: insufficient role' })
  }
  next()
}
