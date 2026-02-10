import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuthUrl, getToken, getActivities, calculateStats } from '../services/strava';
import type { WeeklyStats } from '../types';

interface UseStravaAuthReturn {
    stats: WeeklyStats[] | null;
    loading: boolean;
    error: string | null;
    handleLogin: () => void;
}

export const useStravaAuth = (): UseStravaAuthReturn => {
    // Check if we're on the Withings callback route to avoid Strava init
    const isWithingsCallback = window.location.pathname === '/withings/callback';

    // Manage token state - sync with localStorage initially
    const [token, setToken] = useState<string | null>(
        !isWithingsCallback ? localStorage.getItem('strava_access_token') : null
    );
    const [authError, setAuthError] = useState<string | null>(null);
    const [isExchangingToken, setIsExchangingToken] = useState(false);

    const exchangeCodeEffectRan = useRef(false);

    // Effect to handle OAuth Code Exchange
    useEffect(() => {
        if (isWithingsCallback) return;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code && !exchangeCodeEffectRan.current) {
            exchangeCodeEffectRan.current = true;
            const exchangeToken = async () => {
                setIsExchangingToken(true);
                try {
                    const tokenData = await getToken(code);
                    localStorage.setItem('strava_access_token', tokenData.access_token);
                    if (tokenData.refresh_token) {
                        localStorage.setItem('strava_refresh_token', tokenData.refresh_token);
                    }
                    if (tokenData.expires_at) {
                        localStorage.setItem('strava_token_expires', String(tokenData.expires_at));
                    }
                    setToken(tokenData.access_token);
                    // Clean URL
                    window.history.replaceState({}, document.title, "/");
                } catch (err) {
                    console.error('Failed to exchange token:', err);
                    setAuthError('Failed to connect with Strava.');
                } finally {
                    setIsExchangingToken(false);
                }
            };
            exchangeToken();
        }
    }, [isWithingsCallback]);

    // Use Query for fetching Stats
    const {
        data: stats = null,
        isLoading: isQueryLoading,
        error: queryError
    } = useQuery({
        queryKey: ['strava', 'stats', token],
        queryFn: async () => {
            if (!token) throw new Error('No token');
            const activities = await getActivities(token);
            return calculateStats(activities);
        },
        enabled: !!token && !isWithingsCallback,
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: false,
    });

    // Handle token expiration/invalid error from query
    useEffect(() => {
        if (queryError) {
            console.error('Strava Query Error:', queryError);
            // If it's an auth error (implied by failure despite having token), clear token
            // In a real app we'd check error.response.status === 401
            setToken(null);
            localStorage.removeItem('strava_access_token');
            setAuthError('Session expired or invalid. Please reconnect.');
        }
    }, [queryError]);

    const handleLogin = () => {
        window.location.href = getAuthUrl();
    };

    return {
        stats: stats || null,
        loading: isExchangingToken || isQueryLoading,
        error: authError || (queryError ? (queryError as Error).message : null),
        handleLogin
    };
};
