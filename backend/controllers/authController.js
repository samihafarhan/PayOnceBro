import supabase from '../config/db.js'

const ALLOWED_ROLES = new Set(['user', 'rider', 'restaurant_owner', 'admin'])

export const register = async (req, res, next) => {
  try {
    const { email, password, role, username, full_name } = req.body
    const normalizedRole = String(role || '').trim().toLowerCase()

    if (!email || !password || !role || !username || !full_name) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (!ALLOWED_ROLES.has(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid role. Allowed roles: 'user', 'rider', 'restaurant_owner', 'admin'.",
      })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: normalizedRole } },
    })

    if (error) {
      const status = error.status || 400;
      return res.status(status).json({ message: error.message });
    }

    // Trigger already created the profile row — update it with name fields
    if (data.user) {
      // upsert handles the case where the DB trigger hasn't created the row yet
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, username, full_name, role: normalizedRole },
          { onConflict: 'id' }
        );
      if (profileError) {
        console.error('Profile upsert error:', profileError.message);
      }

      if (normalizedRole === 'rider') {
        const { data: existingRider } = await supabase
          .from('riders')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (!existingRider) {
          const { error: riderError } = await supabase
            .from('riders')
            .insert({
              user_id: data.user.id,
              is_available: true,
              avg_rating: 0,
              total_deliveries: 0,
            })

          if (riderError) {
            console.error('Rider create error:', riderError.message)
          }
        }
      }

      if (normalizedRole === 'restaurant_owner') {
        const { data: existingRestaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', data.user.id)
          .maybeSingle()

        if (!existingRestaurant) {
          const { error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
              owner_id: data.user.id,
              name: `${full_name}'s Restaurant`,
              is_active: true,
            })

          if (restaurantError) {
            console.error('Restaurant create error:', restaurantError.message)
          }
        }
      }
    }

    res.status(201).json({
      session: data.session,
      user: data.user,
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(401).json({ message: error.message })
    }

    // Fetch the profile so we can include the definitive role in the response
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username, full_name')
      .eq('id', data.user.id)
      .single()

    res.json({
      session: data.session,
      user: {
        ...data.user,
        role: profile?.role ?? data.user.user_metadata?.role ?? 'user',
        username: profile?.username ?? null,
        full_name: profile?.full_name ?? null,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      // Invalidate the session server-side using the service role client
      await supabase.auth.admin.signOut(token)
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware — id, email, role from the verified Supabase JWT
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, role, username, full_name, created_at')
      .eq('id', req.user.id)
      .single()

    // PGRST116 = no rows found — profile row missing, not a server error
    if (error && error.code !== 'PGRST116') throw error

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: profile?.role ?? req.user.role ?? 'user',
        username: profile?.username ?? null,
        full_name: profile?.full_name ?? null,
        created_at: profile?.created_at ?? null,
      },
    })
  } catch (err) {
    console.error('getMe error:', err);
    next(err)
  }
}
