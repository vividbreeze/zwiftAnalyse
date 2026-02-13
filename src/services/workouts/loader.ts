import type { ParsedWorkout } from '../../types';
import { parseZwoFile } from './parser';

let cachedWorkouts: ParsedWorkout[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Load and parse all .zwo files
 * Uses in-memory cache (1 hour)
 */
export const loadWorkouts = async (): Promise<ParsedWorkout[]> => {
    // Check cache
    if (cachedWorkouts && Date.now() - cacheTimestamp < CACHE_DURATION) {
        return cachedWorkouts;
    }

    // Load workout files using Vite's import.meta.glob
    const workoutFiles = import.meta.glob('/data/zwift-workouts/*.zwo', { query: '?raw', import: 'default', eager: false });

    const workouts: ParsedWorkout[] = [];

    for (const [path, loadFile] of Object.entries(workoutFiles)) {
        try {
            const content = await loadFile();
            const filename = path.split('/').pop() || '';
            const parsed = await parseZwoFile(content as string, filename);
            workouts.push(parsed);
        } catch (error) {
            console.error(`Error parsing ${path}:`, error);
        }
    }

    // Update cache
    cachedWorkouts = workouts;
    cacheTimestamp = Date.now();

    console.log(`Loaded ${workouts.length} workouts from /data/zwift-workouts/`);

    return workouts;
};

/**
 * Force refresh workouts (clear cache)
 */
export const refreshWorkouts = async (): Promise<ParsedWorkout[]> => {
    cacheTimestamp = 0;
    cachedWorkouts = null;
    return loadWorkouts();
};
