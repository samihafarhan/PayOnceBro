import supabase from '../config/db.js'

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: 'Not authorised, no token' })
    }

    // Verify the Supabase JWT — uses the service role client
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorised, token invalid' })
    }

    // Fetch role from the profiles table so it stays in sync with DB
    // rather than relying solely on JWT metadata (which can lag after role changes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // profile?.role can be 'user' as a trigger default even for non-user roles.
    // Prefer the profile DB value; fall back to JWT metadata only if DB has no row.
    const dbRole = profile?.role ?? null
    const metaRole = user.user_metadata?.role ?? 'user'

    req.user = {
      id: user.id,
      email: user.email,
      role: profile ? dbRole : metaRole,
    }

    next()
  } catch (err) {
    res.status(401).json({ message: 'Not authorised' })
  }
}
