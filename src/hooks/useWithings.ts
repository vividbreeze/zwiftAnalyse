import { useQuery } from '@tanstack/react-query';
import { isWithingsConnected, getWithingsAuthUrl, getBodyCompositionForChart, getLatestMeasures, getBloodPressureForChart } from '../services/withings';
import { loadSettings } from '../components/settings/utils';
import type { BodyCompositionEntry, LatestWeight, BloodPressureEntry } from '../types';

interface UseWithingsReturn {
    connected: boolean;
    loading: boolean;
    bodyComposition: BodyCompositionEntry[];
    bloodPressure: BloodPressureEntry[];
    latestWeight: LatestWeight | null;
    connect: (onError: () => void) => void;
}

export const useWithings = (): UseWithingsReturn => {
    // We derive connected status synchronously for now, or we could also query it if it was expensive
    const connected = isWithingsConnected();

    const { data: bodyComposition = [], isLoading: loadingBodyComp } = useQuery({
        queryKey: ['withings', 'bodyComposition'],
        queryFn: getBodyCompositionForChart,
        enabled: connected,
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
    });

    const { data: latestWeight = null, isLoading: loadingWeight } = useQuery({
        queryKey: ['withings', 'latestWeight'],
        queryFn: getLatestMeasures,
        enabled: connected,
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
    });

    const { data: bloodPressure = [], isLoading: loadingBP } = useQuery({
        queryKey: ['withings', 'bloodPressure'],
        queryFn: getBloodPressureForChart,
        enabled: connected,
        staleTime: 1000 * 60 * 30, // 30 minutes
        retry: 1,
    });

    // Handle OAuth connection redirect
    const connect = (onError: () => void) => {
        const settings = loadSettings();
        if (!settings.withingsClientId || !settings.withingsClientSecret) {
            onError();
            return;
        }
        const authUrl = getWithingsAuthUrl();
        if (authUrl) {
            window.location.href = authUrl;
        }
    };

    return {
        connected,
        loading: loadingBodyComp || loadingWeight || loadingBP,
        bodyComposition,
        bloodPressure,
        latestWeight,
        connect
    };
};
