import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UrlState } from '../../context/AuthContext'
import { BeatLoader } from 'react-spinners'

/**
 * Hitting /logout clears the Supabase session and takes the user back to /auth.
 * Useful to break out of a stale auto-login loop during development.
 */
const LogoutPage = () => {
    const navigate = useNavigate()
    const { logout } = UrlState()

    useEffect(() => {
        logout()
            .catch(() => { }) // ignore errors — we're logging out regardless
            .finally(() => navigate('/auth', { replace: true }))
    }, [])

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <BeatLoader color="#1e293b" />
        </div>
    )
}

export default LogoutPage
