import React, { useEffect, useState } from 'react';
import { exchangeWithingsCode } from '../services/withings';

/**
 * Withings OAuth callback handler
 * This component handles the redirect from Withings after authorization
 */
const WithingsCallback = () => {
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const errorParam = urlParams.get('error');

            // Check for errors from Withings
            if (errorParam) {
                setStatus('error');
                setError(`Withings authorization failed: ${errorParam}`);
                return;
            }

            // Verify state parameter (CSRF protection)
            const storedState = sessionStorage.getItem('withings_oauth_state');
            if (state && storedState && state !== storedState) {
                setStatus('error');
                setError('Invalid state parameter. Please try again.');
                return;
            }

            if (!code) {
                setStatus('error');
                setError('No authorization code received from Withings.');
                return;
            }

            try {
                await exchangeWithingsCode(code);
                sessionStorage.removeItem('withings_oauth_state');
                setStatus('success');

                // Redirect to main dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } catch (err) {
                console.error('Withings token exchange error:', err);
                setStatus('error');
                setError('Failed to connect Withings account. Please check your credentials in Settings.');
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            {status === 'processing' && (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Verbinde mit Withings...</h2>
                    <p className="text-gray-500 mt-2">Bitte warten...</p>
                </div>
            )}

            {status === 'success' && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-green-700">Withings verbunden!</h2>
                    <p className="text-gray-500 mt-2">Weiterleitung zum Dashboard...</p>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-red-700">Verbindung fehlgeschlagen</h2>
                    <p className="text-gray-600 mt-2">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                        Zurück zum Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default WithingsCallback;
