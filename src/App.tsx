import React from 'react';
import Dashboard from './components/Dashboard';
import WithingsCallback from './components/WithingsCallback';
import { Activity } from 'lucide-react';
import { useStravaAuth } from './hooks/useStravaAuth';

function App() {
  const { stats, loading, error, handleLogin } = useStravaAuth();

  // Check if we're on the Withings callback route
  const isWithingsCallback = window.location.pathname === '/withings/callback';

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

