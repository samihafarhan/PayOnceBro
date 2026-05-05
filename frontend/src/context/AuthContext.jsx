import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import useFetch from "../hooks/useFetch";
import { getCurrentUser, logout as apiLogout } from "../services/authService";
import supabase from "../lib/supabase";

const urlcontext = createContext()

const UrlProvider = ({children}) => {
    const {data:user, loading, fn:fetchuser} = useFetch(getCurrentUser)
    const [isSessionLoaded, setIsSessionLoaded] = useState(false)
    const didBootstrapRef = useRef(false)
    const isAuthenticated = Boolean(user && (user.aud === "authenticated" || user.email))

    const logout = async () => {
        try {
            await apiLogout()
        } catch (error) {
            console.error('Error logging out:', error)
            throw error
        }
    }

    useEffect(() => {
        let timeoutId
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'INITIAL_SESSION') {
                    setIsSessionLoaded(true)
                    if (!didBootstrapRef.current) {
                        didBootstrapRef.current = true
                        // Fetch user once on the initial session event (covers both
                        // "already logged in on page load" and "not logged in" cases)
                        fetchuser()
                    }
                } else if (event === 'SIGNED_IN') {
                    // SIGNED_IN can follow quickly after initial load; avoid double-fetches.
                    if (!didBootstrapRef.current) {
                        didBootstrapRef.current = true
                    }
                    fetchuser()
                } else if (event === 'TOKEN_REFRESHED') {
                    // Token refresh happens frequently; avoid spamming /auth/me.
                    // Session is already updated client-side.
                    if (!session) return
                } else if (event === 'SIGNED_OUT') {
                    fetchuser()
                }
            }
        )

        // Fallback: in some environments INITIAL_SESSION can be delayed.
        // Prevent app root from staying blank forever.
        timeoutId = setTimeout(() => {
            setIsSessionLoaded((prev) => {
                if (prev) return prev
                if (!didBootstrapRef.current) {
                    didBootstrapRef.current = true
                    fetchuser()
                }
                return true
            })
        }, 2500)

        // Do NOT call fetchuser() here — INITIAL_SESSION always fires and handles it
        return () => {
            clearTimeout(timeoutId)
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
