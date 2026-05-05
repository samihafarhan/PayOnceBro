import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as apiLogout } from "../services/authService";
import supabase from "../lib/supabase";

const urlcontext = createContext()

const UrlProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isSessionLoaded, setIsSessionLoaded] = useState(false)
    const didBootstrapRef = useRef(false)
    const isAuthenticated = Boolean(user && (user.aud === "authenticated" || user.email))

    const fetchuser = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getCurrentUser()
            setUser(data)
        } catch (error) {
            console.error('Error fetching user:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = async () => {
        try {
            await apiLogout()
        } catch (error) {
            console.error('Error logging out:', error)
            throw error
        }
    }

    useEffect(() => {
        let didCancel = false

        // Bootstrap immediately
        ;(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (didCancel) return

                if (session && !didBootstrapRef.current) {
                    didBootstrapRef.current = true
                    // Optimistically set the user from session metadata so the app can render
                    // dashboard/auth routes immediately without waiting for the backend.
                    const sessionUser = session.user
                    setUser({
                        ...sessionUser,
                        role: sessionUser.user_metadata?.role || 'user',
                        full_name: sessionUser.user_metadata?.full_name || null,
                        username: sessionUser.user_metadata?.username || null,
                    })
                    // Start background fetch for the full profile (delivery coords, etc.)
                    fetchuser()
                }
                setIsSessionLoaded(true)
            } catch {
                if (didCancel) return
                setIsSessionLoaded(true)
            }
        })()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (didCancel) return

                if (event === 'INITIAL_SESSION') {
                    if (session && !didBootstrapRef.current) {
                        didBootstrapRef.current = true
                        const sessionUser = session.user
                        setUser({
                            ...sessionUser,
                            role: sessionUser.user_metadata?.role || 'user',
                        })
                        fetchuser()
                    }
                    setIsSessionLoaded(true)
                    return
                }

                if (event === 'SIGNED_IN') {
                    if (session) {
                        const sessionUser = session.user
                        setUser(prev => prev ? { ...prev, ...sessionUser } : {
                            ...sessionUser,
                            role: sessionUser.user_metadata?.role || 'user',
                        })
                    }
                    fetchuser()
                    return
                }

                if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setIsSessionLoaded(true)
                }
            }
        )

        return () => {
            didCancel = true
            subscription.unsubscribe()
        }
    }, [fetchuser])

    return (
        <urlcontext.Provider value={{user, fetchuser, loading, isAuthenticated, isSessionLoaded, logout}}>
            {children}
        </urlcontext.Provider>
    )
}

export { UrlProvider }

export const UrlState = () => {
    return useContext(urlcontext)
}

/**
 * Hook to guard protected pages — redirects to /auth if unauthenticated.
 * @param {boolean} skipCheck - Pass true to skip the check (e.g. on the auth page itself)
 */
export const useAuthCheck = (skipCheck = false) => {
    const navigate = useNavigate()
    const { user, isAuthenticated, loading, isSessionLoaded, logout } = UrlState()

    useEffect(() => {
        if (skipCheck) return
        if (loading || !isSessionLoaded) return
        if (!isAuthenticated && isSessionLoaded) {
            navigate('/auth')
        }
    }, [isAuthenticated, loading, isSessionLoaded, navigate, skipCheck])

    return {
        user,
        isAuthenticated,
        loading: loading || !isSessionLoaded,
        logout
    }
}
