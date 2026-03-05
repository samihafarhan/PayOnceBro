import { Navigate, Outlet } from 'react-router-dom';
import { UrlState } from '../../context/AuthContext';
import { BeatLoader } from 'react-spinners';

const ProtectedRoute = ({ role }) => {
  const { user, isAuthenticated, loading, isSessionLoaded } = UrlState();

  // Wait until the Supabase session has been checked AND the user fetch has settled
  const stillLoading = loading || !isSessionLoaded;
  if (stillLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <BeatLoader color="#1e293b" />
      </div>
    );
  }

  // Not logged in → send to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Wrong role → send to auth
  const userRole = user?.role?.trim().toLowerCase();
  const requiredRole = role?.trim().toLowerCase();

  if (requiredRole && userRole !== requiredRole) {
    console.warn('ProtectedRoute: Expected role:', requiredRole, 'but got:', userRole);
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
