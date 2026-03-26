import { Outlet, Link, useNavigate } from 'react-router-dom';
import { UrlState } from '../context/AuthContext';
import LocationTracker from '../components/rider/LocationTracker.jsx';

const RiderLayout = () => {
  const navigate = useNavigate();
  const { logout } = UrlState();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <LocationTracker />
      {/* Sidebar */}
      <nav style={{ width: '240px', background: '#1e293b', color: 'white', padding: '20px' }}>
        <h2 style={{ color: '#38bdf8' }}>PayOnce Rider</h2>
        <hr style={{ borderColor: '#334155' }} />
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
          <li style={{ marginBottom: '15px' }}>
            <Link to="/rider/dashboard" style={{ color: 'white', textDecoration: 'none' }}>📊 Dashboard</Link>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <Link to="/rider/route" style={{ color: 'white', textDecoration: 'none' }}>🗺️ Route View</Link>
          </li>
          <li style={{ marginBottom: '15px' }}>
            <Link to="/rider/earnings" style={{ color: 'white', textDecoration: 'none' }}>💰 Earnings</Link>
          </li>
        </ul>
        <button
          onClick={handleLogout}
          style={{ marginTop: '50px', width: '100%', padding: '10px', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px', background: '#f8fafc' }}>
        <header style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
          <strong>Rider Status:</strong> <span style={{ color: 'green' }}>● Online</span>
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default RiderLayout;
