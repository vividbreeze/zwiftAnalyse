import React, { useEffect, useState } from 'react';
import { getAuthUrl, getToken, getActivities, calculateStats } from './services/strava';
import Dashboard from './components/Dashboard';
import WithingsCallback from './components/WithingsCallback';
import { Activity } from 'lucide-react';
import type { WeeklyStats } from './types';

function App() {
  const [stats, setStats] = useState<WeeklyStats[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataFetchedRef = React.useRef(false);

  // Check if we're on the Withings callback route
  const isWithingsCallback = window.location.pathname === '/withings/callback';

  useEffect(() => {
    // Don't run Strava init if we're handling Withings callback
    if (isWithingsCallback) return;

    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      // Check if we already have a stored token
      const existingToken = localStorage.getItem('strava_access_token');

      if (existingToken && !code) {
        // Use existing token - no need to re-authorize
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;

        setLoading(true);
        try {
          const activities = await getActivities(existingToken);
          const calculatedStats = calculateStats(activities);
          setStats(calculatedStats);
        } catch (err) {
          // Token might be expired - clear it and let user re-authorize
          console.error('Token expired or invalid:', err);
          localStorage.removeItem('strava_access_token');
          setError('Session expired. Please reconnect with Strava.');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Check for code in URL (callback from Strava)
      if (code) {
        if (dataFetchedRef.current) return; // Prevent double execution
        dataFetchedRef.current = true;

        setLoading(true);
        try {
          const tokenData = await getToken(code);
          localStorage.setItem('strava_access_token', tokenData.access_token);
          // Also store refresh token and expiry for future token refresh
          if (tokenData.refresh_token) {
            localStorage.setItem('strava_refresh_token', tokenData.refresh_token);
          }
          if (tokenData.expires_at) {
            localStorage.setItem('strava_token_expires', String(tokenData.expires_at));
          }
          const activities = await getActivities(tokenData.access_token);
          const calculatedStats = calculateStats(activities);
          setStats(calculatedStats);

          // Clean URL
          window.history.replaceState({}, document.title, "/");
        } catch (err) {
          setError('Failed to fetch data from Strava.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [isWithingsCallback]);

  const handleLogin = () => {
    window.location.href = getAuthUrl();
  };

  // Render Withings callback handler if on that route
  if (isWithingsCallback) {
    return <WithingsCallback />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Loading Strava data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={handleLogin} className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-center mb-8">
          <Activity className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Zwift/Strava Analysis</h1>
          <p className="text-gray-600">Connect your Strava account to visualize your training progress.</p>
        </div>
        <button
          onClick={handleLogin}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
        >
          Connect with Strava
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Dashboard stats={stats} />
    </div>
  );
}

export default App;
