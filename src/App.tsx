import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import WithingsCallback from './components/WithingsCallback';
import Settings from './components/Settings';
import Login from './components/Login';
import { Activity, Settings as SettingsIcon } from 'lucide-react';
import { useStravaAuth } from './hooks/useStravaAuth';
import { useSettings } from './context/SettingsContext';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { stats, loading, error, handleLogin } = useStravaAuth();
  const { settings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auth check - only if Google OAuth is configured
  let isAuthenticated = true; // Default to authenticated if no OAuth configured
  try {
    if (settings.googleClientId) {
      const auth = useAuth();
      isAuthenticated = auth.isAuthenticated;
    }
  } catch (e) {
    // useAuth throws error if used outside AuthProvider
    // This happens when googleClientId is not configured
    isAuthenticated = true; // Allow access without auth
  }

  // Check if we're on the Withings callback route
  const isWithingsCallback = window.location.pathname === '/withings/callback';

  // Render Withings callback handler if on that route
  if (isWithingsCallback) {
    return <WithingsCallback />;
  }

  // Show login if Google OAuth is configured and user is not authenticated
  if (settings.googleClientId && !isAuthenticated) {
    return <Login />;
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
        <button
          onClick={() => setSettingsOpen(true)}
          className="absolute top-6 right-6 p-2 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
          title="Settings"
        >
          <SettingsIcon className="w-6 h-6 text-gray-600" />
        </button>
        <div className="text-center mb-8">
          <Activity className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Zwift/Strava Analysis</h1>
          <p className="text-gray-600 mb-2">Connect your Strava account to visualize your training progress.</p>
          <p className="text-sm text-gray-500">
            First time? Click <button onClick={() => setSettingsOpen(true)} className="text-blue-600 underline">Settings</button> to configure your Strava API credentials.
          </p>
        </div>
        <button
          onClick={handleLogin}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
        >
          Connect with Strava
        </button>
        <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onSave={() => {}} />
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

