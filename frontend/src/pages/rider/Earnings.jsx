import { useState, useEffect } from 'react';
import { getEarnings } from '../../services/riderService';
import EarningsSummary from '../../components/rider/EarningsSummary';

const Earnings = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const data = await getEarnings();
      console.log('📊 Raw earnings data:', data);
      
      // Transform API response to match expected structure
      const transformed = {
        earnings: {
          today: data.todayEarnings || 0,
          total: data.totalEarnings || 0,
          weekly: data.weeklyEarnings || 0,
          monthly: data.monthlyEarnings || 0,
        },
        deliveries: {
          today: data.todayDeliveries || 0,
          total: data.totalDeliveries || 0,
          weekly: data.weeklyDeliveries || 0,
          monthly: data.monthlyDeliveries || 0,
        },
        rating: data.rating || 0,
      };
      console.log('✅ Rating updated in Earnings:', data.rating);
      
      setEarnings(transformed);
      setError(null);
      setLastRefresh(new Date());
      console.log('✅ Earnings updated at', new Date().toLocaleTimeString(), 'Today:', transformed.earnings.today, 'taka');
    } catch (err) {
      setError(err.message || 'Failed to load earnings');
      console.error('Earnings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchEarnings();
  }, []);

  // Refresh when page becomes visible (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📍 Page became visible - refreshing earnings');
        fetchEarnings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600 mt-2">Track your daily, weekly, and total earnings</p>
            <p className="text-xs text-gray-400 mt-1">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={fetchEarnings}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8">
          <EarningsSummary
            earnings={earnings?.earnings || { today: 0, total: 0 }}
            deliveries={earnings?.deliveries || { today: 0, total: 0 }}
            rating={earnings?.rating || 0}
            isLoading={loading}
          />
        </div>

        {/* Detailed Stats */}
        {!loading && earnings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Earnings</span>
                  <span className="font-semibold">৳{(earnings.earnings?.weekly || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deliveries</span>
                  <span className="font-semibold">{earnings.deliveries?.weekly || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg per Delivery</span>
                  <span className="font-semibold">
                    ৳{earnings.deliveries?.weekly > 0 
                      ? ((earnings.earnings?.weekly || 0) / earnings.deliveries?.weekly).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Earnings</span>
                  <span className="font-semibold">৳{(earnings.earnings?.monthly || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deliveries</span>
                  <span className="font-semibold">{earnings.deliveries?.monthly || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg per Delivery</span>
                  <span className="font-semibold">
                    ৳{earnings.deliveries?.monthly > 0 
                      ? ((earnings.earnings?.monthly || 0) / earnings.deliveries?.monthly).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Time</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">৳{(earnings.earnings?.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Deliveries</span>
                  <span className="font-semibold">{earnings.deliveries?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg per Delivery</span>
                  <span className="font-semibold">
                    ৳{earnings.deliveries?.total > 0 
                      ? ((earnings.earnings?.total || 0) / earnings.deliveries?.total).toFixed(2)
                      : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading earnings data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;