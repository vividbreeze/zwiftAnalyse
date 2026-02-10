// analysis/zones.ts
import { getZoneForHr } from '../../config/user';
import type { HRZones, Lap, ZoneDistribution } from '../../types';

/**
 * Estimate HR Zone Distribution based on Avg HR and Max HR
 */
export const estimateZoneDistribution = (avgHr: number, maxHr: number, durationMinutes: number, zones: HRZones): Record<string, number> | null => {
    if (!avgHr || !durationMinutes) return null;

    const primaryZone = getZoneForHr(avgHr, zones);
    const peakZone = maxHr ? getZoneForHr(maxHr, zones) : primaryZone;

    const primaryNum = parseInt(primaryZone.slice(1));
    const peakNum = parseInt(peakZone.slice(1));

    let dist: Record<string, number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };

    const warmupPct = 0.12;  // 12% in Z1
    const primaryPct = 0.50; // 50% at average
    const peakPct = peakNum > primaryNum ? 0.10 : 0; // 10% peak

    let remainingPct = 1.0 - warmupPct - primaryPct - peakPct;

    dist['Z1'] = warmupPct;
    dist[primaryZone] = primaryPct;

    if (peakNum > primaryNum) {
        dist[peakZone] = peakPct;
        const intermediateZones = peakNum - primaryNum - 1;

        if (intermediateZones > 0) {
            const perZone = remainingPct / (intermediateZones + 1);
            for (let z = primaryNum + 1; z < peakNum; z++) {
                dist[`Z${z}`] += perZone;
                remainingPct -= perZone;
            }
        }

        if (primaryNum < 5) {
            dist[`Z${primaryNum + 1}`] += remainingPct;
        }
    } else {
        if (primaryNum > 1) {
            dist[`Z${primaryNum - 1}`] += remainingPct * 0.6;
        }
        if (primaryNum < 5) {
            dist[`Z${primaryNum + 1}`] += remainingPct * 0.4;
        }
    }

    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    if (total > 0) {
        Object.keys(dist).forEach(z => {
            dist[z] = (dist[z] / total) * durationMinutes;
        });
    }

    return dist;
};

export const analyzeZones = (laps: Lap[], zones: HRZones): ZoneDistribution | null => {
    const distribution: Record<string, number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0 };
    let totalMinutes = 0;

    laps.forEach(lap => {
        const avgHr = lap.average_heartrate;
        const durationMin = lap.moving_time / 60;

        if (avgHr) {
            const zone = getZoneForHr(avgHr, zones);
            distribution[zone] += durationMin;
            totalMinutes += durationMin;
        }
    });

    if (totalMinutes === 0) return null;

    const formatted: Record<string, { minutes: string; pct: string }> = {};
    let maxZone = 'Z1';
    let maxVal = 0;

    Object.keys(distribution).forEach(z => {
        const pct = (distribution[z] / totalMinutes) * 100;
        formatted[z] = {
            minutes: distribution[z].toFixed(0),
            pct: pct.toFixed(0)
        };
        if (distribution[z] > maxVal) {
            maxVal = distribution[z];
            maxZone = z;
        }
    });

    return {
        distribution: formatted,
        primaryZone: maxZone,
        message: getZoneMessage(maxZone, formatted[maxZone].pct)
    };
};

export const getZoneMessage = (primaryZone: string, pct: string): string => {
    const descriptions: Record<string, string> = {
        Z1: "Active Recovery",
        Z2: "Endurance",
        Z3: "Tempo",
        Z4: "Threshold",
        Z5: "VO2 Max"
    };
    return `You spent **${pct}%** of this activity in **Zone ${primaryZone.slice(1)}** (${descriptions[primaryZone]}).`;
};
