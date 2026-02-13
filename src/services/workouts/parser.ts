import type { ParsedWorkout } from '../../types';

/**
 * Parse .zwo XML file to structured workout metadata using browser's DOMParser
 */
export const parseZwoFile = async (xmlContent: string, filename: string): Promise<ParsedWorkout> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error(`XML parsing error: ${parserError.textContent}`);
    }

    const workoutFile = xmlDoc.querySelector('workout_file');
    if (!workoutFile) {
        throw new Error('Invalid .zwo file: missing workout_file element');
    }

    const workout = workoutFile.querySelector('workout');
    if (!workout) {
        throw new Error('Invalid .zwo file: missing workout element');
    }

    // Extract type from filename (e.g., "sweetspot-01.zwo" -> "sweetspot")
    const type = filename.split('-')[0] as ParsedWorkout['type'];

    // Calculate total duration
    const duration = calculateTotalDuration(workout);

    // Calculate power metrics
    const { maxPower, avgPower } = analyzePowerProfile(workout);

    // Estimate intensity
    const estimatedIntensity = estimateIntensity(avgPower);

    return {
        id: filename.replace('.zwo', ''),
        filename,
        name: getTextContent(workoutFile, 'name') || '',
        description: getTextContent(workoutFile, 'description') || '',
        type,
        author: getTextContent(workoutFile, 'author'),
        tags: extractTags(workoutFile),
        duration,
        durationFormatted: formatDuration(duration),
        maxPower,
        avgPower,
        estimatedIntensity
    };
};

const getTextContent = (parent: Element, tagName: string): string | undefined => {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || undefined;
};

const calculateTotalDuration = (workout: Element): number => {
    let total = 0;

    // Sum all Duration attributes from workout segments
    const segments = workout.querySelectorAll('Warmup, SteadyState, Cooldown, IntervalsT, FreeRide, Ramp');
    segments.forEach(segment => {
        const duration = segment.getAttribute('Duration');
        if (duration) {
            total += parseInt(duration, 10);
        }
    });

    return total;
};

const analyzePowerProfile = (workout: Element): { maxPower: number, avgPower: number } => {
    const powers: number[] = [];
    const weightedPowers: { power: number, duration: number }[] = [];

    // Extract power values from all segments
    const segments = workout.querySelectorAll('Warmup, SteadyState, Cooldown, IntervalsT, FreeRide, Ramp');
    segments.forEach(segment => {
        const duration = parseInt(segment.getAttribute('Duration') || '0', 10);

        // Single power value
        const power = segment.getAttribute('Power');
        if (power) {
            const powerVal = parseFloat(power);
            powers.push(powerVal);
            if (duration > 0) {
                weightedPowers.push({ power: powerVal, duration });
            }
        }

        // Power range (Warmup, Cooldown, Ramp)
        const powerLow = segment.getAttribute('PowerLow');
        const powerHigh = segment.getAttribute('PowerHigh');
        if (powerLow) powers.push(parseFloat(powerLow));
        if (powerHigh) powers.push(parseFloat(powerHigh));

        // For ranges, use average for weighted calculation
        if (powerLow && powerHigh && duration > 0) {
            const avgRangePower = (parseFloat(powerLow) + parseFloat(powerHigh)) / 2;
            weightedPowers.push({ power: avgRangePower, duration });
        }
    });

    // Calculate weighted average based on duration
    const totalDuration = weightedPowers.reduce((sum, wp) => sum + wp.duration, 0);
    const weightedSum = weightedPowers.reduce((sum, wp) => sum + (wp.power * wp.duration), 0);
    const avgPower = totalDuration > 0
        ? weightedSum / totalDuration
        : (powers.length > 0 ? powers.reduce((a, b) => a + b, 0) / powers.length : 0);

    return {
        maxPower: powers.length > 0 ? Math.max(...powers) : 0,
        avgPower
    };
};

const estimateIntensity = (avgPower: number): ParsedWorkout['estimatedIntensity'] => {
    if (avgPower < 0.60) return 'recovery';
    if (avgPower < 0.75) return 'endurance';
    if (avgPower < 0.85) return 'tempo';
    if (avgPower < 0.95) return 'sweet-spot';
    if (avgPower < 1.05) return 'threshold';
    return 'vo2max';
};

const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const extractTags = (workoutFile: Element): string[] => {
    const tags: string[] = [];
    const tagElements = workoutFile.querySelectorAll('tags > tag');

    tagElements.forEach(tagEl => {
        const name = tagEl.getAttribute('name') || tagEl.textContent?.trim();
        if (name) {
            tags.push(name);
        }
    });

    return tags;
};
