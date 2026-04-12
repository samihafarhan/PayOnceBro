import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UrlState } from '../../context/AuthContext'
import { BeatLoader } from 'react-spinners'
import { toast } from 'sonner'

/**
 * Hitting /logout clears the Supabase session and takes the user back to /auth.
 * Useful to break out of a stale auto-login loop during development.
 */
const LogoutPage = () => {
    const navigate = useNavigate()
    const { logout } = UrlState()

    useEffect(() => {
        logout()
            .then(() => toast.success('Signed out.'))
            .catch(() => { toast.error("Couldn't sign out. Please try again.") })
            .finally(() => navigate('/auth', { replace: true }))
    }, [logout, navigate])

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <BeatLoader color="#1e293b" />
        </div>
    )
}

export default LogoutPage
