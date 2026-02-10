import { describe, it, expect } from 'vitest';
import { calculateZones, getZoneForHr, getZoneColor } from './user';

describe('calculateZones', () => {
    it('should calculate 5 zones using Karvonen formula', () => {
        const zones = calculateZones(182, 60);

        expect(zones).toHaveProperty('z1');
        expect(zones).toHaveProperty('z2');
        expect(zones).toHaveProperty('z3');
        expect(zones).toHaveProperty('z4');
        expect(zones).toHaveProperty('z5');
    });

    it('should have z1.min = 0 and z5.max = 250', () => {
        const zones = calculateZones(182, 60);
        expect(zones.z1.min).toBe(0);
        expect(zones.z5.max).toBe(250);
    });

    it('should have non-overlapping ordered zones', () => {
        const zones = calculateZones(182, 60);

        // z1 max should equal z2 min (Karvonen uses continuous ranges)
        expect(zones.z1.max).toBe(zones.z2.min);
        expect(zones.z2.max).toBe(zones.z3.min);
        expect(zones.z3.max).toBe(zones.z4.min);
        expect(zones.z4.max).toBe(zones.z5.min);
    });

    it('should produce lower zones for lower max HR', () => {
        const highHr = calculateZones(200, 60);
        const lowHr = calculateZones(160, 60);

        expect(highHr.z3.max).toBeGreaterThan(lowHr.z3.max);
    });

    it('should account for resting HR (HRR-based)', () => {
        // With higher resting HR, absolute zone values should shift upward
        const lowRest = calculateZones(182, 40);
        const highRest = calculateZones(182, 70);

        // Z2 min with higher resting HR should be higher
        expect(highRest.z2.min).toBeGreaterThan(lowRest.z2.min);
    });

    it('should have labels for each zone', () => {
        const zones = calculateZones(182, 60);

        expect(zones.z1.label).toBe('Recovery');
        expect(zones.z2.label).toBe('Endurance');
        expect(zones.z3.label).toBe('Tempo');
        expect(zones.z4.label).toBe('Threshold');
        expect(zones.z5.label).toBe('VO2 Max');
    });
});

describe('getZoneForHr', () => {
    const zones = calculateZones(182, 60);

    it('should return Z1 for low HR', () => {
        expect(getZoneForHr(100, zones)).toBe('Z1');
    });

    it('should return Z5 for very high HR', () => {
        expect(getZoneForHr(180, zones)).toBe('Z5');
    });

    it('should return correct zone for HR at zone boundary', () => {
        // HR exactly at z2.min should be Z2 (since z1.max === z2.min)
        const hr = zones.z2.min;
        expect(getZoneForHr(hr, zones)).toBe('Z2');
    });
});

describe('getZoneColor', () => {
    it('should return correct Tailwind classes for each zone', () => {
        expect(getZoneColor('Z1')).toBe('bg-gray-400');
        expect(getZoneColor('Z2')).toBe('bg-blue-500');
        expect(getZoneColor('Z3')).toBe('bg-green-500');
        expect(getZoneColor('Z4')).toBe('bg-yellow-500');
        expect(getZoneColor('Z5')).toBe('bg-red-500');
    });

    it('should return default color for unknown zone', () => {
        expect(getZoneColor('Z6')).toBe('bg-gray-200');
        expect(getZoneColor('')).toBe('bg-gray-200');
    });
});
